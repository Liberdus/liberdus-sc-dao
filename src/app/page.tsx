"use client"

import '@rainbow-me/rainbowkit/styles.css';
import Bridge from '@/components/Bridge';

import {
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { useAccount, WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { wagmiConfig } from "./wagmi";
import WalletConnect from "./walletConnect.component";
import NavWrapper from './dao/navWrapper.component';

const queryClient = new QueryClient();

export default function Home() {

  const { address, isConnected } = useAccount({config: wagmiConfig});

  // redirect('/debug');

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
            {!isConnected ? <WalletConnect /> : 
              <WrappedHome/>}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>

  );
}

function WrappedHome() {
  return (
    <NavWrapper>
      <Bridge />
    </NavWrapper>
  )
}
