// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "@aws-cdk/core";
import {Construct, Stack} from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";
import * as cr from "@aws-cdk/custom-resources";

import * as path from "path";

export interface StaticWebsiteStackProps {
    userPoolId: string;
    userPoolClientId: string;
    identityPoolId: string;
    graphqlEndpoint: string;
    apiUrl: string;
}

/**
 * Defines the infrastructure for the user interface
 */
export class StaticWebsiteStack extends Stack {
    // This file will be used to provide configuration for the static website, eg identity pool id or api urls
    public readonly s3ConfigFileKey: string = 'runtime-config.js';

    constructor(scope: Construct, id: string, props: StaticWebsiteStackProps) {
        super(scope, id);

        // S3 Website

        const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
            websiteIndexDocument: 'index.html',
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        });

        // Cloudfront distribution

        const cloudFrontOia = new cloudfront.OriginAccessIdentity(this, 'CloudfrontOia');

        websiteBucket.grantRead(cloudFrontOia);

        const cloudFrontDistribution = new cloudfront.CloudFrontWebDistribution(this, 'CloudfrontDistribution', {
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: websiteBucket,
                        originAccessIdentity: cloudFrontOia,
                    },
                    behaviors: [{ isDefaultBehavior: true }],
                }
            ],
            // We need to redirect "key not found errors" to index.html since our app is a Single Page App
            errorConfigurations: [{
                errorCode: 404,
                responseCode: 200,
                responsePagePath: '/index.html',
            }],
        });

        const websiteDeployment = new s3Deployment.BucketDeployment(this, 'WebsiteDeployment', {
            sources: [s3Deployment.Source.asset('../Website/build')],
            destinationBucket: websiteBucket,
            // Files in the distribution's edge caches will be invalidated after files are uploaded to the destination bucket.
            distribution: cloudFrontDistribution,
            serverSideEncryption: s3Deployment.ServerSideEncryption.AES_256,
        });

        const uploadWebsiteConfigFunction = new lambda.Function(this, 'UploadWebsiteConfigFunction', {
            runtime: lambda.Runtime.PYTHON_3_7,
            handler: 'app.on_event',
            code: lambda.Code.fromAsset(path.join(__dirname, '../custom-resources/upload-website-config')),
            timeout: cdk.Duration.seconds(30),
            initialPolicy: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['cloudfront:GetInvalidation', 'cloudfront:CreateInvalidation'],
                    resources: ['*'],
                }),
            ],
        });

        websiteBucket.grantWrite(uploadWebsiteConfigFunction);

        const uploadWebsiteConfigProvider = new cr.Provider(this, 'UploadWebsiteConfigProvider', {
            onEventHandler: uploadWebsiteConfigFunction,
        });

        const websiteConfiguration = `window['runConfig'] = {
          region: "${this.region}",
          userPoolId: "${props.userPoolId}",
          userPoolWebClientId: "${props.userPoolClientId}",
          identityPoolId: "${props.identityPoolId}",
          graphqlEndpoint: "${props.graphqlEndpoint}",
          apiUrl: "${props.apiUrl}"
        }`;

        const uploadWebsiteConfigResource = new cdk.CustomResource(this, 'UploadWebsiteConfigResource', {
            serviceToken: uploadWebsiteConfigProvider.serviceToken,
            // Pass the mapping file attributes as a property. Every time the mapping file changes, the custom resource will be updated which will trigger the corresponding Lambda.
            properties: {
                'S3_BUCKET': websiteBucket.bucketName,
                'S3_CONFIG_FILE_KEY': this.s3ConfigFileKey,
                'WEBSITE_CONFIG': websiteConfiguration,
                'CLOUDFRONT_DISTRIBUTION_ID': cloudFrontDistribution.distributionId,
                // The bucket deployment clears the s3 bucket, so we must always run the custom resource to write the config
                'ALWAYS_UPDATE': new Date().toISOString(),
            },
        });

        uploadWebsiteConfigResource.node.addDependency(websiteDeployment);

        // Output

        new cdk.CfnOutput(this, 'CloudFrontUrl', {
            value: cloudFrontDistribution.distributionDomainName,
        });
    }
}
