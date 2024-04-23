// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import { Duration, Stack } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { getLambdaPath } from "../utils/lambda";

export interface MeetingProviderProps {
    lambdaAssetDirectory: string;
    environment: { [key: string]: string };
    policyStatements: iam.PolicyStatement[];
}

export interface MeetingProviderApi {
    api: apigateway.RestApi;
    queryPath: string;
}

export default class MeetingProvider extends Construct {
    public readonly api: MeetingProviderApi;

    constructor(scope: Stack, id: string, props: MeetingProviderProps) {
        super(scope, id);

        const apiDefaults = {
            restApiName: `${id}Api`,
            description: `${id}Api`,
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
            },
            policy: new iam.PolicyDocument({
                statements: [
                    // Allow only callers with credentials from the AWS account
                    // for this stage
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        principals: [new iam.AccountPrincipal(scope.account)],
                        actions: ["execute-api:Invoke"],
                        resources: ["execute-api:/*"],
                    }),
                    // Open up OPTIONS to allow browsers to make unauthenticated
                    // preflight requests
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        principals: [new iam.AnyPrincipal()],
                        actions: ["execute-api:Invoke"],
                        resources: ["execute-api:/*/OPTIONS/*"],
                    }),
                ],
            }),
        };

        const api = new apigateway.RestApi(this, `${id}Api`, apiDefaults);

        const lambdaFn = new lambda.Function(scope, `${id}-Handler`, {
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset(getLambdaPath(props.lambdaAssetDirectory)),
            handler: `index.chimeCallHandler`,
            timeout: Duration.seconds(30),
            environment: props.environment,
            initialPolicy: props.policyStatements,
        });

        const apiPath = "call-create";
        const apiResource = api.root.addResource(apiPath);

        const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFn);

        apiResource.addMethod("GET", lambdaIntegration, {
            authorizationType: apigateway.AuthorizationType.IAM,
        });

        this.api = {
            api,
            queryPath: `/${apiPath}`,
        };
    }
}
