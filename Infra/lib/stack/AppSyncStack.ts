// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as path from "path";

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
            schema: appsync.SchemaFile.fromAsset(
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

        const meetingRequestTemplate = appsync.MappingTemplate.fromString(
            '{"version": "2018-05-29", "payload": { "meeting": "${ctx.args.meeting}", "attendee": "${ctx.args.attendee}", "username": "${ctx.args.username}" } }'
        );

        const meetingResponseTemplate = appsync.MappingTemplate.fromString(
            "$util.toJson($context.result)"
        );

        const claimChimeSessionRequestTemplate = appsync.MappingTemplate.fromString(
            '{"version": "2018-05-29", "payload": "${ctx.args.meeting}"}'
        );

        noneDataSource.createResolver("id_stub", {
            typeName: "Query",
            fieldName: "stub",
            requestMappingTemplate: meetingRequestTemplate,
            responseMappingTemplate: meetingResponseTemplate,
        });

        noneDataSource.createResolver("id_startChimeSession", {
            typeName: "Mutation",
            fieldName: "startChimeSession",
            requestMappingTemplate: meetingRequestTemplate,
            responseMappingTemplate: meetingResponseTemplate,
        });

        noneDataSource.createResolver("id_claimChimeSession", {
            typeName: "Mutation",
            fieldName: "claimChimeSession",
            requestMappingTemplate: claimChimeSessionRequestTemplate,
            responseMappingTemplate: meetingResponseTemplate,
        });

        noneDataSource.createResolver("id_chimeSessionStarted", {
            typeName: "Subscription",
            fieldName: "chimeSessionStarted",
            requestMappingTemplate: meetingRequestTemplate,
            responseMappingTemplate: meetingResponseTemplate,
        });

        noneDataSource.createResolver("id_chimeSessionClaimed", {
            typeName: "Subscription",
            fieldName: "chimeSessionClaimed",
            requestMappingTemplate: claimChimeSessionRequestTemplate,
            responseMappingTemplate: meetingResponseTemplate,
        });

        this.graphqlApi = api;
    }
}
