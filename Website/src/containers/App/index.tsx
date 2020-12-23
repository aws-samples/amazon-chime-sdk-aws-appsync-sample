// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Auth } from "aws-amplify";
import AppLayout from "aws-northstar/layouts/AppLayout";
import NorthStarThemeProvider from "aws-northstar/components/NorthStarThemeProvider";
import HomeContainer from "../Home/HomeContainer";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import Header from "aws-northstar/components/Header";
import ButtonDropdown from "aws-northstar/components/ButtonDropdown";
import { ThemeProvider } from "styled-components";
import { lightTheme, MeetingProvider } from "amazon-chime-sdk-component-library-react";

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

// Set up cognito auth, and configure our api endpoint
Amplify.configure({
    Auth: {
        region,
        userPoolId,
        userPoolWebClientId,
        identityPoolId,
    },
    aws_appsync_graphqlEndpoint: graphqlEndpoint,
    aws_appsync_region: region,
});

const App: React.FC = () => {
    const [username, setUsername] = useState<string>();
    useEffect(() => {
        (async () => {
            try {
                const user = await Auth.currentAuthenticatedUser();
                setUsername(user.username);
            } catch (e) {
                // No user currently logged in
            }
        })();
    }, []);

    const rightContent = <ButtonDropdown content={username} items={menuItems} variant="primary" />;

    return (
        <NorthStarThemeProvider>
            <ThemeProvider theme={lightTheme}>
                <Router>
                    <Header title="Cross Talk" rightContent={rightContent} />
                    <MeetingProvider>
                        <AppLayout header={<div></div>}>
                            <Switch>
                                <Route exact path="/" component={HomeContainer} />
                            </Switch>
                        </AppLayout>
                    </MeetingProvider>
                </Router>
            </ThemeProvider>
        </NorthStarThemeProvider>
    );
};

// Temporarily restrict access via a login page. For unauthenticated
// access, replace with the commented line below
export default withAuthenticator(App);
