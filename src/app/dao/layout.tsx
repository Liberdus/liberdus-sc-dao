"use client"

import { ToastContainer, } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAccount,  WagmiProvider } from "wagmi";
import {  wagmiConfig } from "../wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import WalletConnect from "../walletConnect.component";
import { useEffect, useState } from "react";
import NavWrapper from "./navWrapper.component";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { address, isConnected } = useAccount({config: wagmiConfig});
  const [ stateFulIsConnected, setStateFulIsConnected ] = useState(isConnected);

  useEffect(() => {
    setStateFulIsConnected(isConnected);
  }, [isConnected]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
            {!stateFulIsConnected ? <WalletConnect /> : 
              <NavWrapper>{children}</NavWrapper>}
            <ToastContainer position='bottom-right'/>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
