"use client"
import styles from "./page.module.css";
import '@rainbow-me/rainbowkit/styles.css';

import {
    ConnectButton,
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { useAccount, WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { wagmiConfig } from "./wagmi";
import { useEffect } from "react";
import { redirect } from "next/navigation";

const queryClient = new QueryClient();

export default function Home() {

  const { address, isConnected } = useAccount({config: wagmiConfig});

  // redirect('/debug');

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
            {!isConnected ? <WalletConnect /> : 
              <>Development in process</>}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>

  );
}

function WalletConnect() {
  return (
    <div className={styles.banner}>
      <div>
        <h1 className={styles.title}>Liberdus Smart Contract Bridging And Governance</h1>
        <div className={styles.description}>Start Connecting your wallet to do bridge operations with liberdus network</div>
        <ConnectButton/>
      </div>
    </div>
  );
}
