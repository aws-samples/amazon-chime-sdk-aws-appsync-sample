// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Auth, Signer } from "aws-amplify";

// @ts-ignore
const { region } = window["runConfig"];

/**
 * Send a Signature Version 4 Signed GET request to the given url. Uses the current authenticated/unauthenticated user's
 * credentials
 */
export const sigv4SignedGet = async (url: string) => {
    const credentials = await Auth.currentCredentials();

    const requestUrl = Signer.signUrl(
        url,
        {
            access_key: credentials.accessKeyId,
            secret_key: credentials.secretAccessKey,
            session_token: credentials.sessionToken,
        },
        { region, service: "execute-api" }
    );

    return await fetch(requestUrl);
};

/**
 * Send a Signature Version 4 Signed request to the given url
 * @param url the url to send the request to
 * @param method the http method to use, PUT, POST etc
 * @param headers http headers to include in the request
 * @param body the body of the request
 */
export const sigv4SignedRequest = async (
    url: string,
    method: string,
    headers: { [key: string]: string },
    body: string
) => {
    const credentials = await Auth.currentCredentials();

    const request = Signer.sign(
        {
            url,
            headers,
            method,
            data: body,
        },
        {
            access_key: credentials.accessKeyId,
            secret_key: credentials.secretAccessKey,
            session_token: credentials.sessionToken,
        },
        { region, service: "execute-api" }
    );

    return await fetch(url, {
        ...request,
        body,
    });
};

/**
 * Send a Signature Version 4 Signed request to the given url, with a JSON payload
 */
export const sigv4SignedJsonRequest = (url: string, method: string, data: any) => {
    return sigv4SignedRequest(
        url,
        method,
        {
            "Content-Type": "application/json",
        },
        JSON.stringify(data)
    );
};

export const sigv4SignedJsonPost = (url: string, data: any) => sigv4SignedJsonRequest(url, "POST", data);

export const sigv4SignedJsonPut = (url: string, data: any) => sigv4SignedJsonRequest(url, "PUT", data);
