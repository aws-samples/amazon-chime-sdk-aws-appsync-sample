// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import { CognitoAuthStack } from "./stack/CognitoAuthStack";
import { StaticWebsiteStack } from "./stack/StaticWebsiteStack";
import { ApiStack } from "./stack/ApiStack";
import { AppSyncStack } from "./stack/AppSyncStack";
import { UserPoolStack } from "./stack/UserPoolStack";

export class AppStacks extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        // see comment in source for this stack to understand why we inject this
        // into the cognito stack instead of doing it sanely...
        const userPoolStack = new UserPoolStack(this, 'UserPoolStack');

        const appsyncStack = new AppSyncStack(this, 'AppSyncStack', {
            userPool: userPoolStack.userPool
        });

        const apiStack = new ApiStack(this, 'ApiStack', {
            graphqlEndpoint: appsyncStack.graphqlApi.graphqlUrl
        });

        const authStack = new CognitoAuthStack(this, 'CognitoAuthStack', {
            meetingProviderApi: apiStack.meetingApi,
            userPool: userPoolStack.userPool,
            graphqlApiArn: appsyncStack.graphqlApi.arn
        });

        new StaticWebsiteStack(this, 'StaticWebsiteStack', {
            identityPoolId: authStack.identityPoolId,
            userPoolClientId: authStack.userPoolClientId,
            userPoolId: userPoolStack.userPool.userPoolId,
            graphqlEndpoint: appsyncStack.graphqlApi.graphqlUrl,
            apiUrl: apiStack.meetingApi.api.url
        });
    }
}
