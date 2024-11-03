'use client';

import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const DeadManSwitch = dynamic(
  () => import('@/components/DeadManSwitch'),
  { ssr: false }
);

const HomePage: FC = () => {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {!connected ? (
        // Landing Page
        <div className="min-h-screen flex flex-col items-center justify-center text-white">
          <div className="text-center space-y-8 p-8">
            <h1 className="text-6xl font-bold mb-4">Eternal Key</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Secure your digital assets with our decentralized dead man&apos;s switch. 
              Set up automatic transfers that trigger if you don&apos;t check in regularly.
            </p>
            
            <div className="mt-8">
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 transition-colors" />
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="p-6 bg-gray-800 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Secure</h3>
                <p className="text-gray-400">Built on Solana blockchain for maximum security and transparency</p>
              </div>
              <div className="p-6 bg-gray-800 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Flexible</h3>
                <p className="text-gray-400">Customize your check-in periods and beneficiary addresses</p>
              </div>
              <div className="p-6 bg-gray-800 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Reliable</h3>
                <p className="text-gray-400">Automated execution ensures your wishes are carried out</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Dashboard
        <div className="min-h-screen bg-gray-900 text-white">
          <nav className="bg-gray-800 p-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <h1 className="text-2xl font-bold">Eternal Key</h1>
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 transition-colors" />
            </div>
          </nav>
          
          <main className="max-w-7xl mx-auto p-8">
            <DeadManSwitch />
          </main>
        </div>
      )}
    </div>
  );
};

export default HomePage; 