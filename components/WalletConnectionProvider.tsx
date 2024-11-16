'use client';

import React, { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useNetworkConfiguration } from '@/contexts/NetworkConfigurationProvider';
import dynamic from 'next/dynamic';

const WalletModalProviderDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletModalProvider),
  { ssr: false }
);

export const WalletConnectionProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { networkConfiguration } = useNetworkConfiguration();
  
  const endpoint = useMemo(() => {
    return clusterApiUrl(networkConfiguration);
  }, [networkConfiguration]);

  const wallets = useMemo(
    () => {
      if (typeof window !== 'undefined') {
        return [
          new SolflareWalletAdapter(),
        ];
      }
      return [];
    },
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProviderDynamic>{children}</WalletModalProviderDynamic>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletConnectionProvider;
