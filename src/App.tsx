/*
 * SPDX-FileCopyrightText: Copyright (c) 2024 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-NvidiaProprietary
 *
 * NVIDIA CORPORATION, its affiliates and licensors retain all intellectual
 * property and proprietary rights in and to this material, related
 * documentation and any modifications thereto. Any use, reproduction,
 * disclosure or distribution of this material and related documentation
 * without an express license agreement from NVIDIA CORPORATION or
 * its affiliates is strictly prohibited.
 */
import React, { useEffect,useState } from 'react';
import { MsalProvider} from '@azure/msal-react';
import { PageLayout } from './PageLayout';
import {Provider} from 'react-redux';
import {store} from './state/store';
// Import debug controls
import Controls from './debug/Controls';
import State from "./debug/State";
import SessionManagement from "./debug/SessionManagement.tsx";
import { IPublicClientApplication } from '@azure/msal-browser';

const MainContent: React.FC = () => {
    return (
        <div className="App"></div>
    );
};



interface msalInstance {
    instance: IPublicClientApplication;
}

const App: React.FC<msalInstance> = (props)  => {
    const [isVisible, setIsVisible] = useState(true);

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
      
    return (
        <Provider store={store}>
            <MsalProvider instance={props.instance}>
                    {isVisible &&
                        <div id="debug">
                            <h2>Debug Panel</h2>
                            <SessionManagement/>
                            <Controls/>
                            <State/>
                        </div>
                    }
                    <PageLayout>
                        <MainContent />
                    </PageLayout>
            </MsalProvider>
        </Provider>
    );
};

export default App;
