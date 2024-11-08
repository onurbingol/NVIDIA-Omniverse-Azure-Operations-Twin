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
import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../state/store';
import './State.css';

const State: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    // Access the state values from Redux
    const jwt = useSelector((state: RootState) => state.service.jwt);
    const sessionService = useSelector((state: RootState) => state.service.sessionService);
    const appId = useSelector((state: RootState) => state.service.appId);
    const version = useSelector((state: RootState) => state.service.version);
    const profile = useSelector((state: RootState) => state.service.profile);
    const sessionId = useSelector((state: RootState) => state.service.sessionId);
    const server = useSelector((state: RootState) => state.appStream.server);
    const remoteStream = useSelector((state: RootState) => state.appStream.remoteStream);
    const kitState = useSelector((state: RootState) => state.appStream.kitState);
    const url = useSelector((state: RootState) => state.usdStorage.url);
    const loadingState = useSelector((state: RootState) => state.usdStorage.loadingState);
    const loadedUrl = useSelector((state: RootState) => state.usdStorage.loadedUrl);
    const assetIds = useSelector((state: RootState) => state.selection.assetIds);
    const selectionChangeOrigin = useSelector((state: RootState) => state.selection.selectionChangeOrigin);
    const assetId = useSelector((state: RootState) => state.status.assetId);
    const assetStatus = useSelector((state: RootState) => state.status.assetStatus);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'm') {
                setIsVisible((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div style={{fontFamily: 'Arial, sans-serif', fontSize: '12px'}}>
            <strong>DEBUG STATE</strong>
            <table style={{width: '100%', tableLayout: 'fixed'}}>
                <tbody>
                <tr>
                    {/* state.service properties */}
                    <td style={{verticalAlign: 'top'}}>
                        <table style={{width: '100%'}}>
                            <tbody>
                            <tr>
                                <td><i>sessionService</i></td>
                            </tr>
                            <tr>
                                <td>jwt</td>
                                <td>{jwt}</td>
                            </tr>
                            <tr>
                                <td>address</td>
                                <td>{sessionService.address}</td>
                            </tr>
                            <tr>
                                <td>desiredState</td>
                                <td>{sessionService.desiredState}</td>
                            </tr>
                            <tr>
                                <td>appId</td>
                                <td>{appId}</td>
                            </tr>
                            <tr>
                                <td>version</td>
                                <td>{version}</td>
                            </tr>
                            <tr>
                                <td>profile</td>
                                <td>{profile}</td>
                            </tr>
                            <tr>
                                <td>sessionId</td>
                                <td>{sessionId}</td>
                            </tr>
                            </tbody>
                        </table>
                    </td>

                    {/* state.appStream properties */}
                    <td style={{verticalAlign: 'top'}}>
                        <table style={{width: '100%'}}>
                            <tbody>
                            <tr>
                                <td><i>appStream</i></td>
                            </tr>
                            <tr>
                                <td>remoteStream.accessToken</td>
                                <td>{remoteStream.accessToken}</td>
                            </tr>
                            <tr>
                                <td>remoteStream.mediaport</td>
                                <td>{remoteStream.mediaport}</td>
                            </tr>
                            <tr>
                                <td>remoteStream.mediaserver</td>
                                <td>{remoteStream.mediaserver}</td>
                            </tr>
                            <tr>
                                <td>remoteStream.sessionid</td>
                                <td>{remoteStream.sessionid}</td>
                            </tr>
                            <tr>
                                <td>remoteStream.signalingport</td>
                                <td>{remoteStream.signalingport}</td>
                            </tr>
                            <tr>
                                <td>remoteStream.signalingserver</td>
                                <td>{remoteStream.signalingserver}</td>
                            </tr>
                            <tr>
                                <td>server</td>
                                <td>{server}</td>
                            </tr>
                            <tr>
                                <td>kitState</td>
                                <td>{kitState}</td>
                            </tr>
                            </tbody>
                        </table>
                    </td>

                    {/* state.usdStorage properties */}
                    <td style={{verticalAlign: 'top'}}>
                        <table style={{width: '100%'}}>
                            <tbody>
                            <tr>
                                <td><i>usdStorage</i></td>
                            </tr>
                            <tr>
                                <td>url</td>
                                <td>{url}</td>
                            </tr>
                            <tr>
                                <td>loadingState</td>
                                <td>{loadingState}</td>
                            </tr>
                            <tr>
                                <td>loadedUrl</td>
                                <td>{loadedUrl}</td>
                            </tr>
                            </tbody>
                        </table>
                    </td>

                    {/* state.selection properties */}
                    <td style={{verticalAlign: 'top'}}>
                        <table style={{width: '100%'}}>
                            <tbody>
                            <tr>
                                <td><i>selection</i></td>
                            </tr>
                            <tr>
                                <td>assetIds</td>
                                <td>
                                    <ul style={{margin: 0, padding: 0, listStyle: 'none'}}>
                                        {assetIds && assetIds.length > 0 ? (
                                            assetIds.map((id, index) => (
                                                <li key={index} style={{margin: 0}}>{id}</li>
                                            ))
                                        ) : (
                                            <li>EMPTY</li>
                                        )}
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td>selectionChangeOrigin</td>
                                <td>{selectionChangeOrigin}</td>
                            </tr>
                            </tbody>
                        </table>
                    </td>

                    {/* state.status properties */}
                    <td style={{verticalAlign: 'top'}}>
                        <table style={{width: '100%'}}>
                            <tbody>
                            <tr>
                                <td><i>status</i></td>
                                <td><i>(most recent)</i></td>
                            </tr>
                            <tr>
                                <td>assetId</td>
                                <td>{assetId}</td>
                            </tr>
                            <tr>
                                <td>assetStatus</td>
                                <td>{assetStatus}</td>
                            </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default State;
