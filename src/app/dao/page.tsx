"use client"

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAccount, useDisconnect, WagmiProvider } from "wagmi";
import { wagmiConfig } from "../wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import WalletConnect from "../walletConnect.component";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import NavWrapper from "./navWrapper.component";

const queryClient = new QueryClient();

export default function DaoPage(){
  const { address, isConnected } = useAccount({config: wagmiConfig});
  const [ stateFulIsConnected, setStateFulIsConnected ] = useState(isConnected);

  useEffect(() => {
    setStateFulIsConnected(isConnected);
  }, [isConnected]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
            {!stateFulIsConnected ? <WalletConnect /> : <NavWrapper><></></NavWrapper>}
            <ToastContainer position='bottom-right'/>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>

  );
}




