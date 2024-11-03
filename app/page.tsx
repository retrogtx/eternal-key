'use client';

import React, { FC } from 'react';
import dynamic from 'next/dynamic';
import '@solana/wallet-adapter-react-ui/styles.css';

const WalletConnectionProvider = dynamic(
  () => import('@/components/WalletConnectionProvider'),
  { ssr: false }
);

const HomePage = dynamic(
  () => import('@/components/HomePage'),
  { ssr: false }
);

const Home: FC = () => {
  return (
    <WalletConnectionProvider>
      <HomePage />
    </WalletConnectionProvider>
  );
};

export default Home;
