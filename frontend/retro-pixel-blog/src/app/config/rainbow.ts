'use client';

import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [sepolia, mainnet],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Retro Pixel Blog',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID', // 从 WalletConnect 获取
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains }; 