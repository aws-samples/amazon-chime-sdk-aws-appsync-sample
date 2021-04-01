// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "@aws-cdk/core";
import * as cognito from "@aws-cdk/aws-cognito";
import * as appsync from "@aws-cdk/aws-appsync";
import * as path from "path";
import {
    MappingTemplate
} from "@aws-cdk/aws-appsync";
import { Construct } from "@aws-cdk/core";

export interface AppsyncStackProps extends cdk.StackProps {
    readonly userPool: cognito.UserPool;
}

interface ChimeSession {
    meeting: string;
    attendee: string;
    username: string;
}

export class AppSyncStack extends cdk.Stack {
    public readonly graphqlApi: appsync.GraphqlApi;

    constructor(scope: Construct, id: string, props: AppsyncStackProps) {
        super(scope, id, props);

        // Creates the AppSync API
        const api = new appsync.GraphqlApi(this, "ChimeSessionEventsApi", {
            name: "chime-session-api",
            schema: appsync.Schema.fromAsset(
                path.join(__dirname, "../graphql/schema.graphql")
            ),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.USER_POOL,
                    userPoolConfig: {
                        userPool: props.userPool,
                        defaultAction: appsync.UserPoolDefaultAction.ALLOW,
                    },
                },
            },
            xrayEnabled: true,
        });

        const noneDataSource = api.addNoneDataSource("NoneDataSource");

        const meetingRequestTemplate = MappingTemplate.fromString(
            '{"version": "2018-05-29", "payload": { "meeting": "${ctx.args.meeting}", "attendee": "${ctx.args.attendee}", "username": "${ctx.args.username}" } }'
        );

        const meetingResponseTemplate = MappingTemplate.fromString(
            "$util.toJson($context.result)"
        );

        const claimChimeSessionRequestTemplate = MappingTemplate.fromString(
            '{"version": "2018-05-29", "payload": "${ctx.args.meeting}"}'
        );

        noneDataSource.createResolver({
            typeName: "Query",
            fieldName: "stub",
            requestMappingTemplate: meetingRequestTemplate,
            responseMappingTemplate: meetingResponseTemplate,
        });

        noneDataSource.createResolver({
            typeName: "Mutation",
            fieldName: "startChimeSession",
            requestMappingTemplate: meetingRequestTemplate,
            responseMappingTemplate: meetingResponseTemplate,
        });

        noneDataSource.createResolver({
            typeName: "Mutation",
            fieldName: "claimChimeSession",
            requestMappingTemplate: claimChimeSessionRequestTemplate,
            responseMappingTemplate: meetingResponseTemplate,
        });

        noneDataSource.createResolver({
            typeName: "Subscription",
            fieldName: "chimeSessionStarted",
            requestMappingTemplate: meetingRequestTemplate,
            responseMappingTemplate: meetingResponseTemplate,
        });

        noneDataSource.createResolver({
            typeName: "Subscription",
            fieldName: "chimeSessionClaimed",
            requestMappingTemplate: claimChimeSessionRequestTemplate,
            responseMappingTemplate: meetingResponseTemplate,
        });

        this.graphqlApi = api;
    }
}
