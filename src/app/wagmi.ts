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

export const contractAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
export const ownerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const chainId = 1337;

export const defaultLiberdusValues: {
  [key: string]: { target: { default: string, allowed: boolean, placeholder: string }, value: { default: any, allowed: boolean, placeholder: string }, data: { default: string, allowed: boolean, placeholder: string } }
} = {
  Mint: {
    target: {
      default: ownerAddress,
      allowed: true,
      placeholder: "Mint target address"
    },
    value: {
      default: 3000000,
      allowed: true,
      placeholder: "Mint value"
    },
    data: {
      default: "",
      allowed: false,
      placeholder: "Mint data"
    }
  },
  Burn: {
    target: {
      default: ownerAddress,
      allowed: true,
      placeholder: "Burn target address"
    },
    value: {
      default: "",
      allowed: true,
      placeholder: "Burn value"
    },
    data: {
      default: "",
      allowed: false,
      placeholder: "Burn data"
    }
  },
  PostLaunch: {
    target: {
      default: "",
      allowed: false,
      placeholder: "Post launch target address"
    },
    value: {
      default: "",
      allowed: false,
      placeholder: "Post launch value"
    },
    data: {
      default: "",
      allowed: false,
      placeholder: "Post launch data"
    }
  },
  UpdateSigner: {
    target: {
      default: "",
      allowed: true,
      placeholder: "Old signer address"
    },
    value: {
      default: "",
      allowed: true,
      placeholder: "New signer address"
    },
    data: {
      default: "",
      allowed: false,
      placeholder: "Update signer data"
    },
  },
  Pause: {
    target: {
      default: "",
      allowed: false,
      placeholder: ""
    },
    value: {
      default: "",
      allowed: false,
      placeholder: ""
    },
    data: {
      default: "",
      allowed: false,
      placeholder: ""
    }
  },
  Unpause: {
    target: {
      default: "",
      allowed: false,
      placeholder: ""
    },
    value: {
      default: "",
      allowed: false,
      placeholder: ""
    },
    data: {
      default: "0x",
      allowed: false,
      placeholder: ""
    }
  },
  SetBridgeInCaller: {
    target: {
      default: "",
      allowed: true,
      placeholder: "New bridge-in caller address"
    },
    value: {
      default: "",
      allowed: false,
      placeholder: ""
    },
    data: {
      default: "0x",
      allowed: false,
      placeholder: "Set bridge in caller data"
    }
  },
  SetBridgeInLimits: {
    target: {
      default: 10000,
      allowed: true,
      placeholder: "New bridge-in max amount"
    },
    value: {
      default: 60,
      allowed: true,
      placeholder: "New bridge-in cooldown (in seconds)"
    },
    data: {
      default: "0x",
      allowed: false,
      placeholder: "Set bridge in limits data"
    }
  }
}

export enum OperationTypes {
  Mint = "Mint",
  Burn = "Burn",
  PostLaunch = "PostLaunch",
  Pause = "Pause",
  Unpause = "Unpause",
  SetBridgeInCaller = "SetBridgeInCaller",
  SetBridgeInLimits = "SetBridgeInLimits",
  UpdateSigner = "UpdateSigner",
}

export const OperationTypesMap = {
  Mint: 0,
  Burn: 1,
  PostLaunch: 2,
  Pause: 3,
  Unpause: 4,
  SetBridgeInCaller: 5,
  SetBridgeInLimits: 6,
  UpdateSigner: 7,
}
