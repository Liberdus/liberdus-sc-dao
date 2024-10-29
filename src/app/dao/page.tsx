"use client"
import 'react-toastify/dist/ReactToastify.css';
import { useAccount } from "wagmi";
import { contractAddress, wagmiConfig } from "../wagmi";
import { useEffect, useState } from "react";
import OpIdExplorer from './opIdExplorer.component';
import { ethers } from 'ethers';
import { abi } from '../../../abi.json';


export default function DaoPage(){
  const { address, isConnected } = useAccount({config: wagmiConfig});
  const [ stateFulIsConnected, setStateFulIsConnected ] = useState(isConnected);
  const [ events, setEvents ] = useState<ethers.Log[] | ethers.EventLog[]>([]);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const contract = provider ? new ethers.Contract(contractAddress, abi, provider) : null;

  // [TODO] The current way slow down UI when there's too frequent new proposal
  // A better way is to use websocket to listen to new proposal only.
  const queryAllEvents = async () => {
    if (!provider) return;
    if (!contract) return;
    try {
      const filter = contract.filters.OperationRequested();
      const allEvents = await contract.queryFilter(filter, 0, 'latest');
      if(allEvents.length !== events.length) {
        allEvents.reverse();
        setEvents(allEvents);
      }


    } catch (error) {
      console.error('Error querying events:', error);
    }
  };

  useEffect(() => {
    setStateFulIsConnected(isConnected);
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, [isConnected]);

  useEffect(() => {
      queryAllEvents();
  },[provider]);

  setInterval(queryAllEvents,2000);


  return (
   <OpIdExplorer events={events}/>
  );
}




