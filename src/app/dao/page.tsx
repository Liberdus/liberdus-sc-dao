"use client"

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAccount, useDisconnect, useWatchContractEvent, WagmiProvider } from "wagmi";
import { contractAddress, wagmiConfig } from "../wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import WalletConnect from "../walletConnect.component";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import NavWrapper from "./navWrapper.component";
import OpIdExplorer from './opIdExplorer.component';
import { ethers } from 'ethers';
import { abi } from '../../../abi.json';

const queryClient = new QueryClient();

export default function DaoPage(){
  const { address, isConnected } = useAccount({config: wagmiConfig});
  const [ stateFulIsConnected, setStateFulIsConnected ] = useState(isConnected);
  const [ events, setEvents ] = useState<ethers.Log[] | ethers.EventLog[]>([]);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const contract = provider ? new ethers.Contract(contractAddress, abi, provider) : null;

  const queryAllEvents = async () => {
    if (!provider) return;
    if (!contract) return;
    try {
      const filter = contract.filters.OperationRequested();
      const allEvents = await contract.queryFilter(filter, 0, 'latest');
      allEvents.reverse();
      if(allEvents.length !== events.length) setEvents(allEvents);

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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
            {!stateFulIsConnected ? <WalletConnect /> : <NavWrapper><OpIdExplorer events={events}/></NavWrapper>}
            <ToastContainer position='bottom-right'/>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>

  );
}




