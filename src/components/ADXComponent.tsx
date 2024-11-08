import React, { useEffect } from "react";
import { useMsal } from '@azure/msal-react';
//import { useDispatch } from 'react-redux';
//import { AppDispatch } from "../state/store";



const ADXComponent: React.FC = () => {
  // dispatch: AppDispatch = useDispatch();
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const data = {data:{}};

 
  const fetchData = async () => {
    const response = await fetch("https://hou-adx-1.westus2.kusto.windows.net/v1/rest/mgmt", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${activeAccount.idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        db: "db1",
        csl: "current_state | take 1",
      }),
    });
   
    const result = await response.json();
    alert(JSON.stringify(result))
    return result;
  };

  useEffect(() => {
    data.data= fetchData()
  })

  return (
    
    <div>
      <h1>First Row Data</h1>
      {data.data ? <pre>{JSON.stringify(data.data)}</pre> : <p>Loading...</p>}
    </div>
  );
};

export default ADXComponent;