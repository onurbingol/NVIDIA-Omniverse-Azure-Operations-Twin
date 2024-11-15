/*
 * SPDX-FileCopyrightText: Copyright (c) 2024 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

import { Http } from "./http";

export interface ApplicationItem {
    id: string;
    name: string;
    description: string;
    tags: string[];
}

export interface ApplicationResponse {
    offset: number;
    limit: number;
    count: number;
    items: ApplicationItem[];
}

export interface VersionData {
    version: string;
}

export interface ApplicationVersionResponse {
    count: number;
    limit: number;
    offset: number;
    items: VersionData[];
}

export interface ProfileData {
    id: string;
    name: string;
    description: string;
}

export interface ApplicationProfileResponse {
    count: number;
    limit: number;
    offset: number;
    items: ProfileData[];
}

export interface StreamData {
    description: "signaling" | "media";
    destination_port: number;
    protocol: "TCP" | "UDP";
    source_port: number;
}

export interface StreamRoutes {
    routes: StreamData[];
}

export interface StreamItem {
    id: string;
    routes: { [key: string]: StreamRoutes };
}

export interface StreamingResponse {
    count: number;
    items: StreamItem[];
    limit: number;
    offset: number;
}

export interface ErrorItem {
    detail: string;
}

export async function getApplications(appServer: string) {
    const endpoint = `${appServer}/cfg/apps`;
    const response = await Http.get<ApplicationResponse>(endpoint);

    const applications = response.data.items.reduce((lookup: { [key: string]: ApplicationItem }, application) => {
        lookup[application.id] = application;
        return lookup;
    }, {});

    return { status: response.status, data: applications };
}

export async function getApplicationVersions(appServer: string, appId: string) {
    const endpoint = `${appServer}/cfg/apps/${appId}/versions`;
    const response = await Http.get<ApplicationVersionResponse>(endpoint);

    return {
        status: response.status,
        data: {
            appId,
            versions: response.data.items.map((item) => item.version)
        }
    };
}

export async function getApplicationVersionProfiles(appServer: string, appId: string, appVersion: string) {
    const endpoint = `${appServer}/cfg/apps/${appId}/versions/${appVersion}/profiles`;
    const response = await Http.get<ApplicationProfileResponse>(endpoint);

    return { status: response.status, data: { appId, appVersion, profiles: response.data.items } };
}

export async function getStreamingSessions(streamServer: string) {
    const endpoint = `${streamServer}/streaming/stream`;

    return await Http.get<StreamingResponse>(endpoint);
}

export async function getStreamingSessionInfo(streamServer: string, sessionId: string) {
    const endpoint = `${streamServer}/streaming/stream/${sessionId}`;
    return await Http.get<StreamItem>(endpoint);
}

export async function createStreamingSession(streamServer: string, appId: string, appVersion: string, profile: string, usd_stage_uri?: string) {
    const endpoint = `${streamServer}/streaming/stream`;
    console.log(`Requesting session with asset url: ${usd_stage_uri}`);
    const payload = {
        "arguments": {
            "usd_stage_uri": usd_stage_uri ?? '',
        },
        "id": appId,
        "version": appVersion,
        "profile": profile
    };

    return await Http.post<typeof payload, StreamItem | ErrorItem>(endpoint, payload);
}

export async function destroyStreamingSession(streamServer: string, sessionId: string) {
    const endpoint = `${streamServer}/streaming/stream`;
    const payload = { "id": sessionId };

    return await Http.del(endpoint, payload);
}
