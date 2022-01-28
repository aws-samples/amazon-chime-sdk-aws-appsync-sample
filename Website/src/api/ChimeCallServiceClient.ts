// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { sigv4SignedGet } from "./api";

const {
    apiUrl,
    // @ts-ignore
} = window["runConfig"];

/**
 * Client for the patient diagnostic and connect query service, responsible
 * for further interaction from the diagnostic and contact card
 */
export class ChimeCallServiceClient {
    async createChimeSession(): Promise<string | undefined> { 
        try {
            const response = await sigv4SignedGet(`${apiUrl}call-create`);
            return await response.json();
        } catch (e) {
            console.error(e);
            return undefined;
        }
    }
};
