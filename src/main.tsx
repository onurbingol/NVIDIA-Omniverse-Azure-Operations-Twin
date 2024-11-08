import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PublicClientApplication, EventType, AccountInfo } from '@azure/msal-browser';
import { msalConfig } from './authConfig';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';


const msalInstance = new PublicClientApplication(msalConfig);

const allAccounts = msalInstance.getAllAccounts();
if (!msalInstance.getActiveAccount() && allAccounts.length > 0) {
    msalInstance.setActiveAccount(allAccounts[0]);
}

interface EventPayload{
    account:AccountInfo
}

msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        let payload = event.payload as EventPayload;
        const account = payload.account;
        msalInstance.setActiveAccount(account);
    }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App instance={msalInstance} />
    </React.StrictMode>
);