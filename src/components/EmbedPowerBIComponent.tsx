import React, { useEffect, useState } from "react";
import { useMsal } from '@azure/msal-react';
import { models } from 'powerbi-client';
import { Report } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import { setSelection } from '../state/slice/selectionSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from "../state/store";

interface EmbedPowerBIProps {
  powerBIVisualName: string;
  powerBITable: string;
  powerBIColumn: string;
  powerBIVisualReportId: string;
  powerBIVisualReportEmbedURL: string;
}

declare global {
  interface Window {
    report: Report | undefined;
  }
}

const EmbedPowerBIComponent: React.FC<EmbedPowerBIProps> = (props) => {
  const dispatch: AppDispatch = useDispatch();
  const { powerBIVisualName, powerBITable, powerBIColumn, powerBIVisualReportId, powerBIVisualReportEmbedURL } = props;
  const [isBusy, setBusy] = useState(true);
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const [token, setTokenVal] = useState<string | undefined>();
  const assetIds = useSelector((state: RootState) => state.selection.assetIds);

  const setPowerBIEmbededToken = async () => {
    const request = {
      scopes: ['https://analysis.windows.net/powerbi/api/Report.Read.All'],
      account: activeAccount
    };

    try {
      const authResult = await instance.acquireTokenSilent(request);
      setTokenVal(authResult.accessToken);
      setBusy(false);
    } catch (error) {
      console.error(error);
      setBusy(false);
    }
  };

  useEffect(() => {
    setBusy(true);
    setPowerBIEmbededToken();
  }, []);

  
  const handleSetSelection = (assetId: string) => {
    let updatedSelection;

    if (assetIds.includes(assetId)) {
        updatedSelection = assetIds.filter(id => id !== assetId);
    } else {
        updatedSelection = [...assetIds, assetId];
    }
    dispatch(setSelection(updatedSelection));
};

  const basicFilter: models.IBasicFilter = {
    $schema: "http://powerbi.com/product/schema#basic",
    target: {
      table: powerBITable,
      column: powerBIColumn
    },
    operator: "In",
    values: assetIds,
    filterType: models.FilterType.Basic
  };

  const setSlicer = () => {
    if (window.report) {
      let report:Report = window.report
      report.getPages().then(pages => {
        pages[0].getVisuals().then(visuals => {
          for (let visual of visuals) {


            if (visual.type === 'slicer' && visual.name === powerBIVisualName) {
              if (basicFilter.values.length > 0) {
                visual.setSlicerState({ 'filters': [basicFilter] });
              } else {
                visual.setSlicerState({ 'filters': [] });
              }
            }
          }
        });
      });
      return "";
    }
  };

  return (
    <div>
      {setSlicer()}
      {isBusy ? (
        <div className="pbi-div">Loading</div>
      ) : (
        <div className="pbi-div">
          <PowerBIEmbed
            embedConfig={{
              type: 'report',
              id: powerBIVisualReportId,
              embedUrl: powerBIVisualReportEmbedURL,
              accessToken: token || '',
              tokenType: models.TokenType.Aad,
              settings: {
                panes: {
                  filters: {
                    expanded: false,
                    visible: false
                  },
                  pageNavigation: {
                    visible: false
                  }
                },
                background: models.BackgroundType.Transparent,
              }
            }}
            eventHandlers={
              new Map([
                ['loaded', function () {
                  setSlicer();
                  let report:Report =window.report
                  report?.on('visualClicked', async function () {
                    const pages = await report?.getPages();
                    const visuals = await pages?.[0].getVisuals();
                    if (visuals) {
                      for (let visual of visuals) {
      
                          
                        if (visual.type === 'slicer' && visual.name === powerBIVisualName) {    
                               
                          const state = await visual.getSlicerState();
                          if (state.filters.length > 0) {
                              let filter = state.filters[0] as models.IBasicFilter;
                              filter.values.forEach(val => {
                                let v = val as string;
                                //alert(visual.name + " " + v) <-- use this to get the visual name of slicer
                                handleSetSelection(v); 
                              });
                          }
                        }
                      }
                    }
                  });
                }],
                ['rendered', function () { console.log('Report rendered'); }],
                ['error', function (event) { console.log(event.detail); }],
              ])
            }
            cssClassName={"bi-embedded"}
            getEmbeddedComponent={(embeddedReport) => {
              
              window.report = embeddedReport as Report;
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EmbedPowerBIComponent;