import React, { ReactNode } from 'react';
import { AuthenticatedTemplate } from '@azure/msal-react';
import { NavigationBar } from './NavigationBar';
import ServiceComponent from "./components/ServiceComponent";
import AppStreamComponent from './components/AppStreamComponent';
import USDStorageComponent from './components/USDStorageComponent';
import SelectionComponent from "./components/SelectionComponent";
import StatusComponent from "./components/StatusComponent";
import EventHubStreamComponent from "./components/EventHubStreamComponent";
import EmbedPowerBIComponent from "./components/EmbedPowerBIComponent";

interface PageLayoutProps {
    children: ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = (props) => {
    return (
        <>
            <NavigationBar />
            {props.children}
            <br />
            <AuthenticatedTemplate>    
                <EventHubStreamComponent
                    eventHubsResourceName="hou-ns-1"
                    eventHubName="from-hou-aiom2-k8s"
                    consumerGroup="reacttest"
                />
                <EmbedPowerBIComponent
                    powerBIVisualName='544a19b2352fd10bab76'
                    powerBITable='digital_twins'
                    powerBIColumn='module'
                    powerBIVisualReportId='143ada8b-39fe-4cc0-8810-c7ddbd3c5727'
                    powerBIVisualReportEmbedURL='https://app.powerbi.com/reportEmbed?reportId=143ada8b-39fe-4cc0-8810-c7ddbd3c5727&ctid=d2e5ac16-7068-4b2d-995b-3924af59cc7a'
                />
                <ServiceComponent/>
                <AppStreamComponent/>
                <USDStorageComponent/>
                <SelectionComponent/>
                <StatusComponent/>
            </AuthenticatedTemplate>
        </>
    );
};
