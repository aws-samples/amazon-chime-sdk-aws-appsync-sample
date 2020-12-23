// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {Construct, Stack} from "@aws-cdk/core";
import {MeetingProviderApi} from "../constructs/MeetingProvider";
import * as cognito from "@aws-cdk/aws-cognito";
import * as iam from "@aws-cdk/aws-iam";

export interface CognitoAuthStackProps {
  meetingProviderApi: MeetingProviderApi;
  graphqlApiArn: string;
  userPool: cognito.UserPool;
}

/**
 * Defines infrastructure for authentication, including assigning permissions to authenticated and unauthenticated user
 * roles.
 */
export class CognitoAuthStack extends Stack {
    public readonly userPoolClientId: string;
    public readonly identityPoolId: string;

    constructor(scope: Construct, id: string, props: CognitoAuthStackProps) {
        super(scope, id);

        /*
         * Cognito user pool
         */

        const userPoolWebClient = props.userPool.addClient('UserPoolWebClient', {
            authFlows: {
                userPassword: true,
                userSrp: true,
            },
            generateSecret: false,
        });
        this.userPoolClientId = userPoolWebClient.userPoolClientId;

        /*
         * Cognito identity pool
         */
        const identityPool = new cognito.CfnIdentityPool(this, "identityPool", {
            allowUnauthenticatedIdentities: true,
            cognitoIdentityProviders: [
                {
                    clientId: userPoolWebClient.userPoolClientId,
                    providerName: props.userPool.userPoolProviderName,
                },
            ],
        });

        this.identityPoolId = identityPool.ref;

        const authenticatedRole = new iam.Role(
            this,
            "CognitoDefaultAuthenticatedRole",
            {
                assumedBy: new iam.FederatedPrincipal(
                    "cognito-identity.amazonaws.com",
                    {
                        StringEquals: {
                            "cognito-identity.amazonaws.com:aud": identityPool.ref
                        },
                        "ForAnyValue:StringLike": {
                            "cognito-identity.amazonaws.com:amr": "authenticated"
                        }
                    },
                    "sts:AssumeRoleWithWebIdentity"
                )
            }
        );

        // Add any policies that apply to both authenticated and unauthenticated users
        [authenticatedRole].forEach((role) => {
            role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "cognito-sync:*",
                    "cognito-identity:*",
                ],
                resources: ["*"]
            }));

            role.addToPolicy(
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['appsync:GraphQL'],
                resources: [`${props.graphqlApiArn}/*`]
              })
            );

            // Transcribe audio
            role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'transcribe:StartStreamTranscriptionWebsocket',
                ],
                resources: ['*'],
            }));

            // Text to speech
            role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'polly:SynthesizeSpeech',
                ],
                resources: ['*'],
            }));

            // Translation
            role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'translate:TranslateText',
                ],
                resources: ['*'],
            }));

            role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'execute-api:Invoke',
                ],
                resources: [props.meetingProviderApi.api.arnForExecuteApi("*", props.meetingProviderApi.queryPath, "*")]
            }));
        });

        new cognito.CfnIdentityPoolRoleAttachment(
            this,
            "DefaultValid",
            {
                identityPoolId: identityPool.ref,
                roles: {
                    authenticated: authenticatedRole.roleArn
                },
            }
        );
    }
}
