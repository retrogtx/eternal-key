'use client';

import React, { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Transaction, 
  PublicKey, 
  SystemProgram, 
  Keypair,
  VersionedTransaction,
  TransactionMessage,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { IDL } from '../types/dead-man-switch';

// Update this with your actual deployed program ID
const PROGRAM_ID = new PublicKey('8hK7vGkWap7CwfWnZG8igqz5uxevUDTbhoeuCcwgvpYq');

// Create a custom wallet adapter that matches Anchor's requirements
class CustomWallet {
  constructor(
    private _publicKey: PublicKey,
    private _signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>,
    private _signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>
  ) {}

  get publicKey() {
    return this._publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    return this._signTransaction(tx);
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return this._signAllTransactions(txs);
  }

  get payer() {
    return Keypair.generate();
  }
}

// Add this interface near the top of the file with other imports
interface ProgramError {
  message: string;
  logs?: string[];
  [key: string]: unknown;
}

const DeadManSwitch: FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [program, setProgram] = useState<Program<typeof IDL> | null>(null);
  const [targetTime, setTargetTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [customDays, setCustomDays] = useState<string>('');
  const [customMinutes, setCustomMinutes] = useState<string>('');

  // Initialize the program when wallet connects
  useEffect(() => {
    if (!publicKey || !connection || !signTransaction || !signAllTransactions) return;

    const wallet = new CustomWallet(publicKey, signTransaction, signAllTransactions);

    const provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );

    const program = new Program(IDL, PROGRAM_ID, provider);
    setProgram(program);
  }, [publicKey, connection, signTransaction, signAllTransactions]);

  const activateSwitch = async (days: number, minutes: number = 0) => {
    if (!beneficiaryAddress || !program || !publicKey || !connection || !signTransaction) {
      console.error('Missing required parameters');
      return;
    }

    try {
      // Create switch account with seed to ensure uniqueness
      const seed = new Date().getTime().toString();
      const [switchPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(seed), publicKey.toBuffer()],
        PROGRAM_ID
      );

      const newTargetTime = new Date();
      newTargetTime.setDate(newTargetTime.getDate() + days);
      newTargetTime.setMinutes(newTargetTime.getMinutes() + minutes);

      const { blockhash } = await connection.getLatestBlockhash();

      // Create switch account using PDA
      const createSwitchAccountIx = await program.methods
        .createSwitch(
          new BN(newTargetTime.getTime() / 1000),
          new PublicKey(beneficiaryAddress),
          seed
        )
        .accounts({
          owner: publicKey,
          switch: switchPubkey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // Transfer SOL to beneficiary
      const transferIx = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(beneficiaryAddress),
        lamports: LAMPORTS_PER_SOL
      });

      const messageV0 = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: [createSwitchAccountIx, transferIx]
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);

      setTargetTime(newTargetTime);
      setIsActive(true);
      
      localStorage.setItem('deadManSwitch', JSON.stringify({
        targetTime: newTargetTime.toISOString(),
        beneficiaryAddress,
        isActive: true,
        switchPublicKey: switchPubkey.toString()
      }));

    } catch (error: unknown) {
      const programError = error as ProgramError;
      console.error('Detailed error:', programError);
      alert(`Failed to activate switch: ${programError.message}`);
    }
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
    if (!targetTime || !isActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Time expired');
        setIsActive(false);
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
  }, [targetTime, isActive]);

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
              <h3 className="text-xl">Custom Timer</h3>
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
                Start Timer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded">
                <h3 className="text-xl mb-2">Switch Active</h3>
                <p className="text-2xl font-mono">{timeRemaining}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeadManSwitch;