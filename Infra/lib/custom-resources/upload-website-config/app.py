"""
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
"""

import logging
import boto3
import json
from uuid import uuid4

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
cloudfront_client = boto3.client('cloudfront')


def on_event(event, context):
    logger.info(f'New event {json.dumps(event, indent=2)}')

    request_type = event['RequestType']
    if request_type == 'Create' or request_type == 'Update':
        s3_bucket = event['ResourceProperties']['S3_BUCKET']
        s3_key = event['ResourceProperties']['S3_CONFIG_FILE_KEY']
        website_config = event['ResourceProperties']['WEBSITE_CONFIG']
        distribution_id = event['ResourceProperties']['CLOUDFRONT_DISTRIBUTION_ID']
        update_website_config(s3_bucket, s3_key, website_config, distribution_id)
    elif request_type == 'Delete':
        logger.info("Website config deletion")
        pass
    else:
        raise Exception("Invalid request type: %s" % request_type)


def update_website_config(s3_bucket, s3_key, website_config, distribution_id):
    logger.info(f"Updating config file {s3_key}")
    s3_client.put_object(Body=website_config, Bucket=s3_bucket, Key=s3_key)

    logger.info(f"Invalidating Cloudfront distribution {distribution_id}")
    cloudfront_client.create_invalidation(
        DistributionId=distribution_id,
        InvalidationBatch={
            'Paths': {
                'Quantity': 1,
                'Items': [f'/{s3_key}']
            },
            'CallerReference': str(uuid4()),
        })

    logger.info(f"Website config updated succesfully")
