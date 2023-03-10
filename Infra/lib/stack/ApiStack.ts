// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import { Stack } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import MeetingProvider, { MeetingProviderApi } from "../constructs/MeetingProvider";

export interface ApiStackProps {
    graphqlEndpoint: string;
}

/**
 * API for handling requests from the UI and routing to the appropriate channel
 */
export class ApiStack extends Stack {
    public readonly meetingApi: MeetingProviderApi;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id);

        const meetingProvider = new MeetingProvider(this, "MeetingProvider", {
            lambdaAssetDirectory: "ChimeCallService",
            environment: { GRAPHQL_ENDPOINT: props.graphqlEndpoint },
            policyStatements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["execute-api:Invoke", "chime:CreateMeeting", "chime:CreateAttendee"],
                    resources: ["*"],
                }),
            ],
        });

        this.meetingApi = meetingProvider.api;
    }
}
