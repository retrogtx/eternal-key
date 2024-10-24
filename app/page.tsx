'use client';

import React, { FC } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Solana components
const WalletConnectionProvider = dynamic(
  () => import('../components/WalletConnectionProvider'),
  { ssr: false }
);

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const WalletDisconnectButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletDisconnectButton),
  { ssr: false }
);

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

const Home: FC = () => {
  return (
    <WalletConnectionProvider>
      <div>
        <WalletMultiButton />
        <WalletDisconnectButton />
        {/* Your app's components go here, nested within the context providers. */}
      </div>
    </WalletConnectionProvider>
  );
};

export default Home;
