'use client';

import React, { FC } from 'react';
import dynamic from 'next/dynamic';
import '@solana/wallet-adapter-react-ui/styles.css';

const WalletConnectionProvider = dynamic(
  () => import('@/components/WalletConnectionProvider'),
  { ssr: false }
);

const DeadManSwitch = dynamic(
  () => import('@/components/DeadManSwitch'),
  { ssr: false }
);

const Home: FC = () => {
  return (
    <WalletConnectionProvider>
      <DeadManSwitch />
    </WalletConnectionProvider>
  );
};

export default Home;
