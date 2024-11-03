'use client';

import React, { FC, useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const DeadManSwitch: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [targetTime, setTargetTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [customDays, setCustomDays] = useState<string>('');
  const [customMinutes, setCustomMinutes] = useState<string>('');

  const executeTransfer = useCallback(async () => {
    if (!publicKey || !connection || !beneficiaryAddress) {
      console.error('Missing required parameters');
      return;
    }

    try {
      const balance = await connection.getBalance(publicKey);
      const beneficiaryKey = new PublicKey(beneficiaryAddress);
      
      const transferAmount = balance - 5000;
      
      if (transferAmount <= 0) {
        console.error('Insufficient balance for transfer');
        return;
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: beneficiaryKey,
          lamports: transferAmount
        })
      );

      const signature = await sendTransaction(transaction, connection);
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }
      
      console.log('Transfer completed:', signature);
      console.log(`Transferred ${transferAmount / LAMPORTS_PER_SOL} SOL to ${beneficiaryAddress}`);
      
      setIsActive(false);
      setTargetTime(null);
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
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, isActive, executeTransfer]);

  const checkIn = () => {
    if (!isActive) return;
    
    const savedSwitch = localStorage.getItem('deadManSwitch');
    if (!savedSwitch) return;
    
    const { originalDuration } = JSON.parse(savedSwitch);
    
    const newTargetTime = new Date();
    newTargetTime.setMilliseconds(newTargetTime.getMilliseconds() + originalDuration);
    setTargetTime(newTargetTime);
    
    localStorage.setItem('deadManSwitch', JSON.stringify({
      targetTime: newTargetTime.toISOString(),
      beneficiaryAddress,
      isActive: true,
      originalDuration
    }));
  };

  const activateSwitch = (days: number, minutes: number = 0) => {
    if (!beneficiaryAddress) {
      alert('Please enter a beneficiary address first');
      return;
    }

    const now = new Date();
    const newTargetTime = new Date();
    newTargetTime.setDate(newTargetTime.getDate() + days);
    newTargetTime.setMinutes(newTargetTime.getMinutes() + minutes);
    
    const originalDuration = newTargetTime.getTime() - now.getTime();
    
    setTargetTime(newTargetTime);
    setIsActive(true);
    
    localStorage.setItem('deadManSwitch', JSON.stringify({
      targetTime: newTargetTime.toISOString(),
      beneficiaryAddress,
      isActive: true,
      originalDuration
    }));
  };

  const handleCustomTimer = () => {
    const days = parseInt(customDays) || 0;
    const minutes = parseInt(customMinutes) || 0;
    
    if (days === 0 && minutes === 0) {
      alert('Please enter a valid time period');
      return;
    }
    
    activateSwitch(days, minutes);
    setCustomDays('');
    setCustomMinutes('');
  };

  useEffect(() => {
    const savedSwitch = localStorage.getItem('deadManSwitch');
    if (savedSwitch) {
      const { 
        targetTime: savedTime, 
        beneficiaryAddress: savedAddress, 
        isActive: savedActive, 
      } = JSON.parse(savedSwitch);
      
      setTargetTime(new Date(savedTime));
      setBeneficiaryAddress(savedAddress);
      setIsActive(savedActive);
    }
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
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

              <div className="mt-4 space-y-2">
                <h4 className="text-lg">Custom Timer (for testing)</h4>
                <div className="flex space-x-4">
                  <div>
                    <label className="block text-sm">Days:</label>
                    <input
                      type="number"
                      min="0"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      className="w-24 p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Minutes:</label>
                    <input
                      type="number"
                      min="0"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="w-24 p-2 border rounded"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCustomTimer}
                  className="bg-purple-500 text-white px-4 py-2 rounded w-full mt-2"
                >
                  Start Custom Timer
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded">
                <h3 className="text-xl mb-2">Switch Active</h3>
                <p className="text-2xl font-mono">{timeRemaining}</p>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={checkIn}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg w-full"
                >
                  Check In (Reset Timer)
                </button>
                <button 
                  onClick={() => {
                    setIsActive(false);
                    setTargetTime(null);
                    localStorage.removeItem('deadManSwitch');
                  }}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg w-full"
                >
                  Deactivate Switch
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeadManSwitch; 