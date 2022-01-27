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
cd ../Lambdas/Common && npm i && npm run build
cd ../ChimeCallService && npm i && npm run build
cd ..

# Build the website
cd ../Website && npm update && npm i && npm run build

# Build the infrastructure cdk code
cd ../Infra && npm i && npm run build

# Synth and deploy the sandbox stack
cdk --profile $CDK_PROFILE synth && cdk --profile $CDK_PROFILE deploy --all --require-approval never
