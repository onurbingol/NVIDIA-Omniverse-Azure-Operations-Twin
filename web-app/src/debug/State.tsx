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

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import './State.css';

const State: React.FC = () => {
    // Access the state values from Redux
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

    return (
        <div id="debugState">
            <strong>DEBUG STATE</strong>
            {/* Left Column: First two tables */}
            <div className="state-column">
                <table className="state-table">
                    <tbody>
                        <tr>
                            <td className="table-heading"><i>sessionService</i></td>
                        </tr>
                        <tr><td className="label">address</td><td className="value">{sessionService.address}</td></tr>
                        <tr><td className="label">desiredState</td><td className="value">{sessionService.desiredState}</td></tr>
                        <tr><td className="label">appId</td><td className="value">{appId}</td></tr>
                        <tr><td className="label">version</td><td className="value">{version}</td></tr>
                        <tr><td className="label">profile</td><td className="value">{profile}</td></tr>
                        <tr><td className="label">sessionId</td><td className="value">{sessionId}</td></tr>
                    </tbody>
                </table>

                <table className="state-table">
                    <tbody>
                        <tr>
                            <td className="table-heading"><i>appStream</i></td>
                        </tr>
                        <tr><td className="label">remoteStream.accessToken</td><td className="value">{remoteStream.accessToken}</td></tr>
                        <tr><td className="label">remoteStream.mediaport</td><td className="value">{remoteStream.mediaport}</td></tr>
                        <tr><td className="label">remoteStream.mediaserver</td><td className="value">{remoteStream.mediaserver}</td></tr>
                        <tr><td className="label">remoteStream.sessionid</td><td className="value">{remoteStream.sessionid}</td></tr>
                        <tr><td className="label">remoteStream.signalingport</td><td className="value">{remoteStream.signalingport}</td></tr>
                        <tr><td className="label">remoteStream.signalingserver</td><td className="value">{remoteStream.signalingserver}</td></tr>
                        <tr><td className="label">server</td><td className="value">{server}</td></tr>
                        <tr><td className="label">kitState</td><td className="value">{kitState}</td></tr>
                    </tbody>
                </table>
            </div>

            {/* Right Column: Remaining three tables */}
            <div className="state-column">
                <table className="state-table">
                    <tbody>
                        <tr>
                            <td className="table-heading"><i>usdStorage</i></td>
                        </tr>
                        <tr><td className="label">url</td><td className="value">{url}</td></tr>
                        <tr><td className="label">loadingState</td><td className="value">{loadingState}</td></tr>
                        <tr><td className="label">loadedUrl</td><td className="value">{loadedUrl}</td></tr>
                    </tbody>
                </table>

                <table className="state-table">
                    <tbody>
                        <tr>
                            <td className="table-heading"><i>selection</i></td>
                        </tr>
                        <tr>
                            <td className="label">assetIds</td>
                            <td className="value">
                                <ul className="asset-ids">
                                    {assetIds && assetIds.length > 0 ? (
                                        assetIds.map((id, index) => (
                                            <li key={index} className="asset-id-item">{id}</li>
                                        ))
                                    ) : (
                                        <li className="asset-id-item">EMPTY</li>
                                    )}
                                </ul>
                            </td>
                        </tr>
                        <tr><td className="label">selectionChangeOrigin</td><td className="value">{selectionChangeOrigin}</td></tr>
                    </tbody>
                </table>

                <table className="state-table">
                    <tbody>
                        <tr>
                            <td className="table-heading"><i>status</i></td>
                            <td><i>(most recent)</i></td>
                        </tr>
                        <tr><td className="label">assetId</td><td className="value">{assetId}</td></tr>
                        <tr><td className="label">assetStatus</td><td className="value">{assetStatus}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default State;
