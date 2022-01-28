// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState } from "react";
import HomeContainer from "../Home/HomeContainer";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { ThemeProvider } from "styled-components";
import { darkTheme, MeetingProvider } from "amazon-chime-sdk-component-library-react";
import { AmplifyAuthenticator, AmplifySignIn } from '@aws-amplify/ui-react';
import {
  AppLayout,
  ButtonDropdown,
  Header,
  NorthStarThemeProvider,
} from 'aws-northstar';
import Amplify, { Auth } from 'aws-amplify';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

const menuItems = [
    {
        text: "Sign Out",
        onClick: async () => {
            await Auth.signOut();
            window.location.reload();
        },
    },
];

const {
    region,
    userPoolId,
    userPoolWebClientId,
    identityPoolId,
    graphqlEndpoint,
    // @ts-ignore
} = window["runConfig"];

const awsConfig = {
    Auth: {
        region,
        userPoolId,
        userPoolWebClientId,
        identityPoolId,
    },
    aws_appsync_graphqlEndpoint: graphqlEndpoint,
    aws_appsync_region: region,
};

// Set up cognito auth, and configure our api endpoint
Amplify.configure(awsConfig);

const App: React.FC = () => {
    const [user, setUser] = useState<any>();

    const rightContent = <ButtonDropdown darkTheme content={user?.attributes?.given_name || user?.username} items={menuItems} />;

    return (
        <AmplifyAuthenticator
            handleAuthStateChange={async () => {
                try {
                    setUser(await Auth.currentAuthenticatedUser());
                } catch (err) {
                    setUser(undefined);
                }
            }}
        >
            <AmplifySignIn slot="sign-in">
                <div slot="secondary-footer-content"></div>
                <div slot="federated-buttons"></div>
            </AmplifySignIn>
  
            {user ? (
                <NorthStarThemeProvider>
                    <ThemeProvider theme={darkTheme}>
                        <Router>
                            <MeetingProvider>
                                <AppLayout
                                    header={
                                        <Header
                                            title="Cross Talk"
                                            rightContent={rightContent}
                                        />
                                    }
                                >
                                    <Switch>
                                        <Route exact path="/" component={HomeContainer} />
                                    </Switch>
                                </AppLayout>
                            </MeetingProvider>
                        </Router>
                    </ThemeProvider>
                </NorthStarThemeProvider>
            ) : (
                <></>
            )}
        </AmplifyAuthenticator>
    );
  };

// Temporarily restrict access via a login page. For unauthenticated
// access, replace with the commented line below
export default withAuthenticator(App);
