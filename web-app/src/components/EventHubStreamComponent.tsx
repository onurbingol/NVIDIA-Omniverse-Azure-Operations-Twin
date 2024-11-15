/*
Copyright (c) Microsoft Corporation.

MIT License

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

import { useCallback, useEffect, useState, useMemo } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import {
  EventHubConsumerClient,
  ReceivedEventData,
  latestEventPosition,
} from "@azure/event-hubs";
import { useDispatch } from 'react-redux';
import { AppDispatch } from "../state/store";
import { setStatus } from '../state/slice/statusSlice';

process.nextTick = (callback: () => void | PromiseLike<void>) =>
  Promise.resolve().then(callback);

const EventHubStreamComponent = () => {

  const dispatch: AppDispatch = useDispatch();
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [messages, setMessages] = useState<ReceivedEventData[]>([]);
  const [state, setState] = useState<string>("Not Started");
  const [hasError, setHasError] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [subscription, setSubscription] = useState<any>();
  const maxRetries = 5;

  const loginRequest = useMemo(
    () => ({
      scopes: [process.env.EVENTHUB_REQUEST_SCOPE]
    }),
    []
  );

  interface StatusState {
    assetId: string;
    assetStatus: 'nominal' | 'warning' | 'fault';
  }

  const handleSetStatus = (assetId: string, status: 'nominal' | 'warning' | 'fault') => {
    const state: StatusState = {
      assetId: assetId,
      assetStatus: status,
    };
    dispatch(setStatus(state));
  };

  const acquireToken = useCallback(async () => {

    if (inProgress !== InteractionStatus.None) {
      console.warn("MSAL is not ready yet.");
      return;
    }

    try {
      const silentRequest = {
        ...loginRequest,
        account: instance.getActiveAccount(),
      };
      const silentResponse = await instance.acquireTokenSilent(silentRequest);
      return silentResponse.accessToken;
    } catch (silentError) {
      console.warn(
        "Silent token acquisition failed, attempting redirect",
        silentError
      );
      try {
        instance.acquireTokenRedirect(loginRequest);
      } catch (redirectError) {
        console.error("Redirect token acquisition failed", redirectError);
        throw redirectError;
      }
    }
  }, [inProgress, instance, loginRequest]);

  const credential = useMemo(
    () => ({
      getToken: async () => {
        const token = await acquireToken();
        return {
          token,
          expiresOnTimestamp: Date.now() + 3600 * 1000, // Assuming the token is valid for 1 hour
        };
      },
    }),
    [acquireToken]
  );

  const processEvents = useCallback(
    (events: ReceivedEventData[], context: any) => {
      setHasError(false);
      setError(undefined);
      if (events.length === 0) {
        setState(
          `No events received within wait time. Waiting for next interval`
        );
        console.log(
          `No events received within wait time. Waiting for next interval`
        );
        return;
      }

      // * * * * * * * * * * * * * * * * * * * * * * * * * * * *
      // This code is just to show how to use events and tag data in the react app and send to redux
      // TODO: Move into mapping file in Fabric Alpine Lakes
      if (events.length > 0) {
        if (events[0].body != null) {
          if (events[0].body.Pressure001 != null) {
            const tag = events[0].body.Pressure001;
            if ((tag.Value > 1 && tag.Value < 1.5) || (tag.Value > 2)) {
              handleSetStatus("Pump 1", "fault")
            } else {
              handleSetStatus("Pump 1", "nominal")
            }
          }
        }
      }
      // * * * * * * * * * * * * * * * * * * * * * * * * * * * *

      setState(`Received ${events.length} event(s)`);

      setMessages([]);
      setMessages((messages) => [...messages, ...events]); // Batch updates

      context.updateCheckpoint(events[events.length - 1]);
    },
    []
  );

  const processError = useCallback(
    (err, context) => {
      console.log("Error:", err, context);
      setHasError(true);
      setError((prevError) => prevError || JSON.stringify(err));
    },
    [maxRetries]
  );

  // Subscribe to the events, and specify handlers for processing the events and errors.
  const createSubscription = useCallback(
    async (consumerClient, processError) => {
      try {
        if (subscription) {
          await subscription.close();
        }
        const newSubscription = consumerClient.subscribe(
          {
            processInitialize: async (context) => {
              console.log(`Initialized subscription for partition ${context.partitionId}`, context);
              setState(
                `Initialized subscription for partition ${context.partitionId}`
              );
              setHasError(false); // Clear error state on successful connection
            },
            processClose: async (reason, context) => {
              console.log(`Closing subscription due to ${reason}.`);
              setState(
                `Stopped processing events from partition ${context.partitionId}`
              );
            },
            processEvents: async (events, context) => {
              processEvents(events, context);
            },
            processError,
          },
          { startPosition: latestEventPosition }
        );
        setSubscription(newSubscription);
        setState("Subscription created, waiting for events...");
      } catch (error) {
        console.error("Failed to create subscription:", error);
      }
    },
    [processEvents]
  );

  const closeSubscription = useCallback(
    (consumerClient) => {
      subscription?.close();
      consumerClient.close();
    },
    [subscription]
  );

  useEffect(() => {

    if (!isAuthenticated) {
      return;
    }

    console.log("Creating Event Hub consumer client...");

    const consumerClient = new EventHubConsumerClient(
      process.env.EVENTHUB_GROUP_NAME,
      process.env.EVENTHUB_RESOURCE_URL,
      process.env.EVENTHUB_NAME,
      credential
    );

    createSubscription(consumerClient, processError);

    return () => {
      closeSubscription(consumerClient);
    };
  }, [
    process.env.EVENTHUB_GROUP_NAME,
    process.env.EVENTHUB_RESOURCE_URL,
    process.env.EVENTHUB_NAME,
    credential,
    createSubscription,
    isAuthenticated
  ]);

  return (
    // This is hidden, but can be used to show event tag data in react app
    <div id="eventView">
      <ul>
        {messages.map((message, index) => (
          <li key={index}>Pressure001: {(message.body.Pressure001 != null) ? message.body.Pressure001.Value : ""}</li>
        ))}
      </ul>

      <div id="eventErrors">
        {state}
        {hasError}
        {error}
      </div>
    </div>
  );
};

export default EventHubStreamComponent;
