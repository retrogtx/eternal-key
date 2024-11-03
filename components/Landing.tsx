'use client';

import React, { FC, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const Landing: FC = () => {
  const { connected } = useWallet();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (connected && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [connected, router, isRedirecting]);

  // Prevent flickering by not rendering during redirect
  if (isRedirecting) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-6xl font-bold mb-4">Dead Man&apos;s Switch</h1>
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
  );
};

export default Landing; 