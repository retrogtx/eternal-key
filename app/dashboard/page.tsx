'use client';

import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DeadManSwitch = dynamic(
  () => import('@/components/DeadManSwitch'),
  { ssr: false }
);

const Dashboard: FC = () => {
  const { connected } = useWallet();
  const router = useRouter();

  // Redirect to home if wallet is not connected
  React.useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  if (!connected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dead Man&apos;s Switch Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-300 hover:text-white"
            >
              Home
            </button>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto p-8">
        <DeadManSwitch />
      </main>
    </div>
  );
};

export default Dashboard; 