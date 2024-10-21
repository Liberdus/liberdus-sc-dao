"use client"
import style1 from "../page.module.css";
import style2 from "./debug.module.css";
import '@rainbow-me/rainbowkit/styles.css';
import abi from "../../../abi.json"

import {
    ConnectButton,
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { useAccount, useWatchContractEvent, WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import OperationDashboard from "./requestOps.component";
import ConsoleTV from "./consoleTV.component";
import { useState } from "react";
import { consoleTvContext } from "./consoleTv.context";
import { contractAddress, wagmiConfig } from "../wagmi";


const queryClient = new QueryClient();

export default function Debug() {

  const [ logs, setLogs ] = useState<string[]>([]);

  function formatTime(timestamp: number) {
    const date = new Date(timestamp); // Convert timestamp to Date object

    // Get hours, minutes, and seconds
    const hours = date.getHours().toString().padStart(2, '0'); // Ensure two digits
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    // Return the formatted time as [hh:mm:ss]
    return `[${hours}:${minutes}:${seconds}]`;
  }

  function addLogs(log: string) {
    setLogs([...logs, `${formatTime(Date.now())} ${log}`]);
  }

  const { address, isConnected } = useAccount({config: wagmiConfig});


  useWatchContractEvent({
    address: contractAddress,
    abi: abi,
    config: wagmiConfig,
    syncConnectedChain: true,
    eventName: "SignatureSubmitted",
    enabled: true,
    onLogs: (event) => {
      console.log(event);
      addLogs(`[EVM EVENT] SignatureSubmitted: ${event[1]}`);
    },
    onError: (error) => {
      console.error(error);
      addLogs(`[EVM EVENT] Error: ${error}`);
    }
  })

  useWatchContractEvent({
    address: contractAddress,
    abi: abi,
    syncConnectedChain: true,
    config: wagmiConfig,
    enabled: true,
    eventName: "OperationRequested",
    onLogs: (event) => {
      console.log(event);
      addLogs(`[EVM EVENT] OperationRequested: ${event[1]}`);
    },
    onError: (error) => {
      console.error(error);
      addLogs(`[EVM EVENT] Error: ${error}`);
    }
  })


  useWatchContractEvent({
    address: contractAddress,
    abi: abi,
    syncConnectedChain: true,
    config: wagmiConfig,
    enabled: true,
    eventName: "OperationExecuted",
    onLogs: (event) => {
      console.log(event);
      addLogs(`[EVM EVENT] OperationExecuted: ${event[1]}`);
    },
    onError: (error) => {
      console.error(error);
      addLogs(`[EVM EVENT] Error: ${error}`);
    }
  })

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          
            <consoleTvContext.Provider value={{logs, setLogs: addLogs}}>
            {!isConnected ? <WalletConnect /> : 
              <Container/>}
            </consoleTvContext.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>

  );
}

function WalletConnect() {
  return (
    <div className={style1.banner}>
      <div>
        <h1 className={style1.title}>Liberdus Smart Contract Bridging And Governance</h1>
        <div className={style1.description}>Start Connecting your wallet to do bridge operations with liberdus network</div>
        <ConnectButton/>
      </div>
    </div>
  );
}

function Container() {


  return (
      <div className={style2.container}>
        <OperationDashboard/>
        <ConsoleTV/>
      </div>
  );
}
