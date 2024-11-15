/*
SPDX-FileCopyrightText: Copyright (c) 2024 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
SPDX-License-Identifier: MIT

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

import { MsalProvider } from '@azure/msal-react';
import { PageLayout } from './PageLayout';
import { Provider } from 'react-redux';
import { store } from './state/store';
import DebugPanel from "./debug/DebugPanel.tsx";
import { IPublicClientApplication } from '@azure/msal-browser';

const MainContent: React.FC = () => {
    return (
        <div className="App"></div>
    );
};

interface msalInstance {
    instance: IPublicClientApplication;
}

const App: React.FC<msalInstance> = (props) => {
    return (
        <Provider store={store}>
            <MsalProvider instance={props.instance}>
                <DebugPanel />
                <PageLayout>
                    <MainContent />
                </PageLayout>
            </MsalProvider>
        </Provider>
    );
};

export default App;
