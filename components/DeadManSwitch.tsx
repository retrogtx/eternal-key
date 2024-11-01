'use client';

import React, { FC, useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const DeadManSwitch: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [targetTime, setTargetTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);

  const executeTransfer = useCallback(async () => {
    if (!publicKey || !connection || !beneficiaryAddress) {
      console.error('Missing required parameters');
      return;
    }

    try {
      const balance = await connection.getBalance(publicKey);
      const beneficiaryKey = new PublicKey(beneficiaryAddress);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: beneficiaryKey,
          lamports: balance - 5000 // Leave some SOL for transaction fees
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);
      
      console.log('Transfer completed:', signature);
      setIsActive(false);
      localStorage.removeItem('deadManSwitch');
    } catch (error) {
      console.error('Error executing transfer:', error);
    }
  }, [publicKey, connection, beneficiaryAddress, sendTransaction]);

  useEffect(() => {
    if (!targetTime || !isActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Executing dead man switch...');
        executeTransfer();
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, isActive, executeTransfer]);

  const activateSwitch = (days: number) => {
    if (!beneficiaryAddress) {
      alert('Please enter a beneficiary address first');
      return;
    }

    const newTargetTime = new Date();
    newTargetTime.setDate(newTargetTime.getDate() + days);
    setTargetTime(newTargetTime);
    setIsActive(true);
    
    localStorage.setItem('deadManSwitch', JSON.stringify({
      targetTime: newTargetTime.toISOString(),
      beneficiaryAddress,
      isActive: true
    }));
  };

  const checkIn = () => {
    if (!isActive) return;
    const newTargetTime = new Date();
    newTargetTime.setDate(newTargetTime.getDate() + 30); // Reset to 30 days
    setTargetTime(newTargetTime);
    localStorage.setItem('deadManSwitch', JSON.stringify({
      targetTime: newTargetTime.toISOString(),
      beneficiaryAddress,
      isActive: true
    }));
  };

  useEffect(() => {
    const savedSwitch = localStorage.getItem('deadManSwitch');
    if (savedSwitch) {
      const { targetTime: savedTime, beneficiaryAddress: savedAddress, isActive: savedActive } = JSON.parse(savedSwitch);
      setTargetTime(new Date(savedTime));
      setBeneficiaryAddress(savedAddress);
      setIsActive(savedActive);
    }
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <WalletMultiButton />
      
      {publicKey && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-2xl mb-2">Dead Man&apos;s Switch</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Set up automatic transfer of funds if you don&apos;t check in regularly.
            </p>
          </div>

          <div>
            <label className="block mb-2">Beneficiary Address:</label>
            <input
              type="text"
              value={beneficiaryAddress}
              onChange={(e) => setBeneficiaryAddress(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-800"
              placeholder="Enter Solana address"
            />
          </div>

          {!isActive ? (
            <div className="space-y-4">
              <h3 className="text-xl">Activate Switch</h3>
              <div className="space-x-4">
                <button 
                  onClick={() => activateSwitch(30)} 
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  30 Days
                </button>
                <button 
                  onClick={() => activateSwitch(90)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  90 Days
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded">
                <h3 className="text-xl mb-2">Switch Active</h3>
                <p className="text-2xl font-mono">{timeRemaining}</p>
              </div>
              <button 
                onClick={checkIn}
                className="bg-green-500 text-white px-6 py-3 rounded-lg w-full"
              >
                Check In (Reset Timer)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeadManSwitch; 