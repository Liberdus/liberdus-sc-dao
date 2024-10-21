import { getDefaultConfig } from "@rainbow-me/rainbowkit";

import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';

export const localchain = {
  id: 1337, // Or 31337 for Hardhat
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'], // Change this to your local RPC URL if needed
    },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'http://127.0.0.1:8545' }, // No block explorer for localhost
  },
  testnet: true, // Mark it as a testnet
};

export const wagmiConfig = getDefaultConfig({
  appName: 'Liberdus Bridging And Governance',
  projectId: 'a456240005ff39a4d2dc51d18ffa4ad9',
  chains: [mainnet, localchain],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

export const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
