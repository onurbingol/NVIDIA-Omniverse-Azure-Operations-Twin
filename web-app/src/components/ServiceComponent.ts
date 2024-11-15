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

import React, {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../state/store';
import {setSessionId, setStatus} from '../state/slice/serviceSlice';
import {setServer} from '../state/slice/appStreamSlice';
import {setRemoteStream} from '../state/slice/appStreamSlice';
import {setLoadingState} from '../state/slice/usdStorageSlice';

import {
    getStreamingSessionInfo,
    createStreamingSession,
    destroyStreamingSession,
    StreamItem
} from '../service/Endpoints';

const ServiceComponent: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();

    const sessionService = useSelector((state: RootState) => state.service.sessionService);
    const appId = useSelector((state: RootState) => state.service.appId);
    const version = useSelector((state: RootState) => state.service.version);
    const profile = useSelector((state: RootState) => state.service.profile);
    const sessionId = useSelector((state: RootState) => state.service.sessionId);
    const url = useSelector((state: RootState) => state.usdStorage.url);

    const _requestSession = async () => {
        console.log(`Requesting streaming session from ${sessionService.address}`);

        if (url) {
            dispatch(setLoadingState('loading'));
        }

        const response = await createStreamingSession(sessionService.address, appId, version, profile, url);
        if (response.status > 400) {
            dispatch(setStatus(response.status));

            console.log({
                connectionText: `Failed to create a new streaming session for ${appId} ${version}. Error code ${response.status}`,
                loadingText: "Failed to create stream"
            });
            return;
        }

        dispatch(setSessionId((response.data as StreamItem).id));
        dispatch(setStatus(response.status));

        if (response.status === 202)
            await _pollForSessionReady((response.data as StreamItem).id);
        else
            _setAppStreamServer(response.data as StreamItem);
    };

    const _pollForSessionReady = async (sessionId: string) => {
        console.log(`Polling ${sessionId}`);
        const response = await getStreamingSessionInfo(sessionService.address, sessionId);
        if (response.status === 200) {
            // Stream is ready
            _setAppStreamServer(response.data as StreamItem);
            dispatch(setStatus(response.status));
            return;
        }
        // Continue polling
        setTimeout(() => _pollForSessionReady(sessionId), 60000);
    };

    const _setAppStreamServer = (stream: StreamItem) => {
        console.log('Applying stream configuration.');
        const serverIP = Object.keys(stream.routes)[0];
        const routeData = stream.routes[serverIP].routes;

        const signalingData = routeData.find((item: any) => item.description === 'signaling');
        const mediaData = routeData.find((item: any) => item.description === 'media');

        if (!signalingData || !mediaData) {
            console.error('Signaling or media data is missing');
            return;
        }

        dispatch(setRemoteStream({
                signalingserver: serverIP,
                signalingport: signalingData.source_port,
                mediaserver: serverIP,
                mediaport: mediaData.source_port,
                accessToken: 'invalid-token',
                sessionid: stream.id,
            }));
    };

    const _destroySession = async (sessionId: string) => {
        console.log(`Destroying session ${sessionId}`);
        const response = await destroyStreamingSession(sessionService.address, sessionId);
        dispatch(setSessionId(''));
        dispatch(setStatus(0));
        dispatch(setServer(''));
        console.log(response)
    };

    // React to changes in the service address
    useEffect(() => {
        if (sessionService.address) {
            if (sessionService.desiredState === 'connected' && !sessionId) {
                // Service address defined, but we don't have a session yet - so we request it
                _requestSession();
            } else if (sessionService.desiredState === 'destroyed' && sessionId) {
                _destroySession(sessionId);
            }
        }
    }, [sessionService, sessionId]);

    return null;
};

export default ServiceComponent;
