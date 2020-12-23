// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
};

export const respond = (statusCode: number, body: any) => respondRaw(statusCode, JSON.stringify(body));

export const respondRaw = (statusCode: number, body: string) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
    },
    body,
});
