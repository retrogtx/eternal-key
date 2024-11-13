'use client';

import React, { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useNetworkConfiguration } from '@/contexts/NetworkConfigurationProvider';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

export const WalletConnectionProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const { networkConfiguration } = useNetworkConfiguration();
  
  const endpoint = useMemo(() => {
    return clusterApiUrl(WalletAdapterNetwork.Devnet);
  }, [networkConfiguration]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletConnectionProvider;
