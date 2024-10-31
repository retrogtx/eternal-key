'use client';

import React, { FC, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey } from '@solana/web3.js';

// Dynamically import Solana components
const WalletConnectionProvider = dynamic(
  () => import('../components/WalletConnectionProvider'),
  { ssr: false }
);

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

const Home: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [targetTime, setTargetTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update countdown timer
  useEffect(() => {
    if (!targetTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Time to execute!');
        executeSmartContract();
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const executeSmartContract = async () => {
    if (!publicKey || !connection) {
      console.error('Wallet not connected');
      return;
    }

    try {
      // Replace with your actual smart contract logic
      const programId = new PublicKey('YOUR_PROGRAM_ID');
      const transaction = new Transaction();
      
      // Add your transaction instructions here
      // transaction.add(...)

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);
      
      console.log('Transaction confirmed:', signature);
    } catch (error) {
      console.error('Error executing smart contract:', error);
    }
  };

  const setTimer = (hours: number) => {
    const newTargetTime = new Date();
    newTargetTime.setHours(newTargetTime.getHours() + hours);
    setTargetTime(newTargetTime);
    
    // Store in localStorage for persistence
    localStorage.setItem('targetTime', newTargetTime.toISOString());
  };

  // Load saved timer on mount
  useEffect(() => {
    const savedTime = localStorage.getItem('targetTime');
    if (savedTime) {
      setTargetTime(new Date(savedTime));
    }
  }, []);

  return (
    <WalletConnectionProvider>
      <div className="p-8">
        <WalletMultiButton />
        
        {publicKey && (
          <div className="mt-8">
            <h2 className="text-2xl mb-4">Set Timer</h2>
            <div className="space-x-4">
              <button 
                onClick={() => setTimer(1)} 
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                1 Hour
              </button>
              <button 
                onClick={() => setTimer(24)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                24 Hours
              </button>
            </div>
            
            {timeRemaining && (
              <div className="mt-4">
                <h3 className="text-xl">Time Remaining:</h3>
                <p className="text-2xl font-mono">{timeRemaining}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </WalletConnectionProvider>
  );
};

export default Home;
