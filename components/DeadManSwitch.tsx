'use client';

import React, { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Transaction, 
  PublicKey, 
  SystemProgram, 
  Keypair,
  VersionedTransaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { IDL } from '../types/dead-man-switch';

const PROGRAM_ID = new PublicKey('8hK7vGkWap7CwfWnZG8igqz5uxevUDTbhoeuCcwgvpYq');

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

// Add this interface to define the switch account type
interface SwitchAccount {
    publicKey: PublicKey;
    account: {
        owner: PublicKey;
        beneficiary: PublicKey;
        deadline: BN;
        isActive: boolean;
        bump: number;
        seed: string;
    };
}

// Add this interface to define the switch account data structure
interface SwitchAccountData {
    owner: PublicKey;
    beneficiary: PublicKey;
    deadline: BN;
    isActive: boolean;
    bump: number;
    seed: string;
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

    // Verify program connection
    console.log('Program ID:', PROGRAM_ID.toString());
    console.log('Connected to program:', program.programId.toString());
  }, [publicKey, connection, signTransaction, signAllTransactions]);

  const activateSwitch = async (days: number, minutes: number = 0) => {
    if (!beneficiaryAddress || !program || !publicKey || !connection || !signTransaction) {
      console.error('Missing required parameters');
      return;
    }

    try {
      const balance = await connection.getBalance(publicKey);
      if (balance < LAMPORTS_PER_SOL) {
        alert(`Insufficient funds. You need at least 1 SOL. Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
        return;
      }

      const seed = new Date().getTime().toString();
      const [switchPubkey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("switch"), 
          publicKey.toBuffer(),
          Buffer.from(seed)
        ],
        PROGRAM_ID
      );

      const newTargetTime = new Date();
      newTargetTime.setDate(newTargetTime.getDate() + days);
      newTargetTime.setMinutes(newTargetTime.getMinutes() + minutes);

      console.log('Creating switch account:', switchPubkey.toString());
      console.log('Owner:', publicKey.toString());
      console.log('Beneficiary:', beneficiaryAddress);

      // Create switch and lock funds
      const tx = await program.methods
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
        .rpc();

      console.log('Switch created:', tx);
      await checkSwitchBalance(switchPubkey);

      setTargetTime(newTargetTime);
      setIsActive(true);
      
      localStorage.setItem('deadManSwitch', JSON.stringify({
        targetTime: newTargetTime.toISOString(),
        beneficiaryAddress,
        isActive: true,
        switchPublicKey: switchPubkey.toString(),
        seed: seed
      }));

      alert(`1 SOL locked in switch. Will transfer to ${beneficiaryAddress} if you don't check in within ${days} days and ${minutes} minutes.`);
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
            setTimeRemaining('Transfer in progress...');
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

  const cancelSwitch = async () => {
    if (!program || !publicKey) return;

    try {
        const switchData = JSON.parse(localStorage.getItem('deadManSwitch') || '{}');
        
        if (!switchData.switchPublicKey) {
            console.error('No active switch found');
            return;
        }

        await program.methods
            .cancelSwitch()
            .accounts({
                owner: publicKey,
                switch: new PublicKey(switchData.switchPublicKey),
            })
            .rpc();

        setIsActive(false);
        setTargetTime(null);
        localStorage.removeItem('deadManSwitch');
        alert('Switch cancelled successfully');
    } catch (error) {
        console.error('Error cancelling switch:', error);
        alert('Failed to cancel switch');
    }
};

  useEffect(() => {
    if (!program || !publicKey || !connection) return;

    const checkDeadline = async () => {
        try {
            const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
                filters: [
                    {
                        memcmp: {
                            offset: 8,
                            bytes: publicKey.toBase58()
                        }
                    }
                ]
            });

            for (const account of accounts) {
                try {
                    // Properly type the fetched account data
                    const switchAccount = await program.account.deadManSwitch.fetch(
                        account.pubkey
                    ) as SwitchAccountData;

                    if (switchAccount.isActive) {
                        const now = new Date().getTime() / 1000;
                        
                        if (now >= switchAccount.deadline.toNumber()) {
                            console.log('Executing transfer for switch:', account.pubkey.toString());
                            
                            await program.methods
                                .executeTransfer()
                                .accounts({
                                    switch: account.pubkey,
                                    owner: switchAccount.owner.toBase58(),  // Now TypeScript knows this is a PublicKey
                                    beneficiary: switchAccount.beneficiary.toBase58(),  // Now TypeScript knows this is a PublicKey
                                    systemProgram: SystemProgram.programId,
                                })
                                .rpc();

                            console.log('Transfer executed successfully');
                        }
                    }
                } catch (err) {
                    console.error('Error processing account:', err);
                }
            }
        } catch (error) {
            console.error('Error checking switches:', error);
        }
    };

    const interval = setInterval(checkDeadline, 30000);
    return () => clearInterval(interval);
}, [program, publicKey, connection]);

  // Move checkSwitchBalance here
  const checkSwitchBalance = async (switchPubkey: PublicKey) => {
    if (!connection) return;
    
    const balance = await connection.getBalance(switchPubkey);
    console.log('Switch Account:', switchPubkey.toString());
    console.log('Switch Balance:', balance / LAMPORTS_PER_SOL, 'SOL');
    return balance;
  };

  const forceExecuteTransfer = async () => {
    if (!program || !publicKey || !connection) return;

    try {
        const switchData = JSON.parse(localStorage.getItem('deadManSwitch') || '{}');
        const switchPubkey = new PublicKey(switchData.switchPublicKey);

        console.log('Switch Account:', switchPubkey.toString());
        const beforeBalance = await connection.getBalance(switchPubkey);
        console.log('Switch Balance Before:', beforeBalance / LAMPORTS_PER_SOL, 'SOL');

        await program.methods
            .executeTransfer()
            .accounts({
                switch: switchPubkey,
                owner: publicKey,
                beneficiary: new PublicKey(beneficiaryAddress),
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        const afterBalance = await connection.getBalance(switchPubkey);
        console.log('Switch Balance After:', afterBalance / LAMPORTS_PER_SOL, 'SOL');
        
        const beneficiaryBalance = await connection.getBalance(new PublicKey(beneficiaryAddress));
        console.log('Beneficiary Balance:', beneficiaryBalance / LAMPORTS_PER_SOL, 'SOL');

    } catch (error) {
        console.error('Error:', error);
    }
};

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
              <button
                onClick={cancelSwitch}
                className="bg-red-500 text-white px-4 py-2 rounded w-full mt-4"
              >
                Cancel Switch
              </button>
              <button
                onClick={forceExecuteTransfer}
                className="bg-red-500 text-white px-4 py-2 rounded w-full mt-2"
              >
                Force Execute Transfer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeadManSwitch;