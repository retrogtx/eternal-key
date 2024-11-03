'use client';

import React, { FC } from 'react';
import dynamic from 'next/dynamic';
import '@solana/wallet-adapter-react-ui/styles.css';

const WalletConnectionProvider = dynamic(
  () => import('@/components/WalletConnectionProvider'),
  { ssr: false }
);

const Landing = dynamic(
  () => import('@/components/Landing'),
  { ssr: false }
);

const Home: FC = () => {
  return (
    <WalletConnectionProvider>
      <Landing />
    </WalletConnectionProvider>
  );
};

export default Home;
