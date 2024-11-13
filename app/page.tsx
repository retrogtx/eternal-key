'use client';

import React, { FC } from 'react';
import dynamic from 'next/dynamic';
import '@solana/wallet-adapter-react-ui/styles.css';
import { NetworkConfigurationProvider } from '@/contexts/NetworkConfigurationProvider';

const WalletConnectionProvider = dynamic(
  () => import('@/components/WalletConnectionProvider'),
  { ssr: false }
);

import HomePage from '@/components/HomePage';

const Home: FC = () => {
  return (
    <NetworkConfigurationProvider>
      <WalletConnectionProvider>
        <HomePage />
      </WalletConnectionProvider>
    </NetworkConfigurationProvider>
  );
};

export default Home;
