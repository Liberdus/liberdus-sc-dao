"use client"
import Image from "next/image";
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

const config = getDefaultConfig({
  appName: 'Liberdus Bridging And Governance',
  projectId: 'a456240005ff39a4d2dc51d18ffa4ad9',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true, // If your dApp uses server side rendering (SSR)
});


const queryClient = new QueryClient();

export default function Home() {

  const { address, isConnected } = useAccount({config});

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className={styles.container}>
            {!isConnected && <Banner />}
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>

  );
}

function Banner() {
  return (
    <div className={styles.banner}>
      <h1 className={styles.title}>Liberdus Smart Contract Bridging And Governance</h1>
      <div className={styles.description}>Start Connecting your wallet to do bridge operations with liberdus network</div>
      <ConnectButton/>
    </div>
  );
}
