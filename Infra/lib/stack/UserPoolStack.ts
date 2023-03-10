// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as cdk from "aws-cdk-lib";

/**
 * In stand-alone stack so that we can avoid various & sundry
 * cyclic dependencies between assorted other stacks. Sigh.
 */
export class UserPoolStack extends cdk.Stack {
    public readonly userPool: cognito.UserPool;

    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.userPool = new cognito.UserPool(this, "UserPool", {
            selfSignUpEnabled: false,
            autoVerify: {
                email: true,
            },
        });
    }
}
