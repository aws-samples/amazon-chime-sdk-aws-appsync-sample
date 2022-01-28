#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

set -e;

CDK_PROFILE=default

while [[ "$#" -gt 0 ]]; do case $1 in
  --profile) CDK_PROFILE="$2"; shift;;
esac; shift; done

echo "Using AWS profile '$CDK_PROFILE'"

# Build all the lambdas
cd ../Lambdas/Common && yarn && yarn build
cd ../ChimeCallService && yarn && yarn build
cd ..

# Build the website
cd ../Website && yarn && yarn build

# Build the infrastructure cdk code
cd ../Infra && yarn && yarn build

# Synth and deploy the sandbox stack
cdk --profile $CDK_PROFILE synth && cdk --profile $CDK_PROFILE deploy --all --require-approval never
