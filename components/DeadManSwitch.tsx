'use client';

import React, { FC, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Transaction, 
  PublicKey, 
  SystemProgram, 
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
}

interface EscrowAccountData {
    owner: PublicKey;
    beneficiary: PublicKey;
    deadline: BN;
    lastCheckin: BN;
    bump: number;
    seed: string;
}

interface EscrowInfo {
  pubkey: PublicKey;
  account: EscrowAccountData;
  timeRemaining: string;
  balance: number;
  isOwner: boolean;
}

const DeadManSwitch: FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [program, setProgram] = useState<Program<typeof IDL> | null>(null);
  const [escrows, setEscrows] = useState<EscrowInfo[]>([]);
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>('');
  const [customDays, setCustomDays] = useState<string>('');

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

  // Fetch escrows only on initial load and when program/wallet is ready
  useEffect(() => {
    if (program && publicKey && connection) {
      fetchEscrows();
    }
  }, [program, publicKey, connection]);

  const formatTimeRemaining = (deadline: number) => {
    const now = Date.now() / 1000;
    const remaining = deadline - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remaining % (60 * 60)) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Add a function to format SOL balance
  const formatSolBalance = (lamports: number) => {
    return `${(lamports / LAMPORTS_PER_SOL).toFixed(2)} SOL`;
  };

  // Modify the fetchEscrows function to get all escrows
  const fetchEscrows = async () => {
    if (!program || !publicKey || !connection) return;

    try {
      // Get escrows where current user is owner
      const ownerEscrows = await program.account.escrow.all([
        {
          memcmp: {
            offset: 8,
            bytes: publicKey.toBase58()
          }
        }
      ]);

      // Get escrows where current user is beneficiary
      const beneficiaryEscrows = await program.account.escrow.all([
        {
          memcmp: {
            offset: 8 + 32,
            bytes: publicKey.toBase58()
          }
        }
      ]);

      const allEscrows = [...ownerEscrows, ...beneficiaryEscrows];
      
      const escrowsInfo: EscrowInfo[] = (await Promise.all(
        allEscrows.map(async ({ account, publicKey: pubkey }) => {
          try {
            const balance = await connection.getBalance(pubkey);
            const escrowData: EscrowAccountData = {
              owner: account.owner,
              beneficiary: account.beneficiary,
              deadline: account.deadline,
              lastCheckin: account.lastCheckin,
              bump: account.bump,
              seed: account.seed
            };
            
            return {
              pubkey,
              account: escrowData,
              timeRemaining: formatTimeRemaining(account.deadline.toNumber()),
              balance,
              isOwner: account.owner.equals(publicKey)
            };
          } catch (err) {
            console.error('Error checking escrow balance:', err);
            return null;
          }
        })
      )).filter((item): item is EscrowInfo => item !== null);

      setEscrows(escrowsInfo);
    } catch (error) {
      console.error('Error fetching escrows:', error);
    }
  };

  // Add status badge component
  const StatusBadge: FC<{ deadline: BN }> = ({ deadline }) => {
    const now = Math.floor(Date.now() / 1000);
    const isExpired = deadline.toNumber() <= now;
    
    return (
      <span className={`px-2 py-1 rounded text-sm ${
        isExpired 
          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      }`}>
        {isExpired ? 'Expired' : 'Active'}
      </span>
    );
  };

  // Update activateSwitch to refresh escrows after creation
  const activateSwitch = async (seconds: number) => {
    if (!beneficiaryAddress || !program || !publicKey || !connection) {
      console.error('Missing required parameters');
      return;
    }

    try {
      const balance = await connection.getBalance(publicKey);
      if (balance < LAMPORTS_PER_SOL) {
        alert(`Insufficient funds. You need at least 1 SOL. Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
        return;
      }

      // Get current time
      const slot = await connection.getSlot();
      const currentTime = await connection.getBlockTime(slot);
      if (!currentTime) throw new Error("Couldn't get block time");

      // Set deadline seconds from now
      const deadline = currentTime + seconds;

      // Generate unique seed
      const seed = new Date().getTime().toString();

      // Generate PDA for escrow with seed
      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), publicKey.toBuffer(), Buffer.from(seed)],
        PROGRAM_ID
      );

      console.log('Creating escrow with params:', {
        deadline,
        beneficiary: beneficiaryAddress,
        timeUntilDeadline: `${seconds} seconds`,
        seed,
        escrowPDA: escrowPDA.toString()
      });

      await program.methods
        .initialize(
          new BN(deadline),
          new PublicKey(beneficiaryAddress),
          seed
        )
        .accounts({
          owner: publicKey,
          escrow: escrowPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Deposit funds
      await program.methods
        .deposit(new BN(LAMPORTS_PER_SOL))
        .accounts({
          owner: publicKey,
          escrow: escrowPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Refresh escrows after successful creation
      await fetchEscrows();

    } catch (error) {
      console.error('Error creating escrow:', error);
      alert('Failed to create escrow. See console for details.');
    }
  };

  const handleCustomTimer = () => {
    const seconds = parseInt(customDays) || 0;
    
    if (seconds === 0) {
      alert('Please enter a valid time period');
      return;
    }
    
    activateSwitch(seconds);
    setCustomDays('');
  };

  // Update handleCheckIn to refresh after check-in
  const handleCheckIn = async (escrowPubkey: PublicKey) => {
    if (!program || !publicKey) return;

    try {
      // Get current time
      const slot = await connection.getSlot();
      const currentTime = await connection.getBlockTime(slot);
      if (!currentTime) throw new Error("Couldn't get block time");

      // Set new deadline 30 seconds from now
      const newDeadline = currentTime + 30;

      await program.methods
        .checkin(new BN(newDeadline))
        .accounts({
          owner: publicKey,
          escrow: escrowPubkey,
        })
        .rpc();

      await fetchEscrows();
      console.log('Successfully checked in');
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in');
    }
  };

  // Update cancelEscrow to refresh after cancellation
  const cancelEscrow = async (escrowPubkey: PublicKey) => {
    if (!program || !publicKey) return;

    try {
      await program.methods
        .cancel()
        .accounts({
          owner: publicKey,
          escrow: escrowPubkey,
        })
        .rpc();

      await fetchEscrows();
      alert('Escrow cancelled successfully');
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      alert('Failed to cancel escrow');
    }
  };

  // Add a claim function for beneficiaries
  const claimEscrow = async (escrowPubkey: PublicKey, beneficiaryPubkey: PublicKey) => {
    if (!program || !publicKey) return;

    try {
      await program.methods
        .claim()
        .accounts({
          beneficiary: beneficiaryPubkey,
          escrow: escrowPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await fetchEscrows();
      alert('Funds claimed successfully');
    } catch (error) {
      console.error('Error claiming funds:', error);
      alert('Failed to claim funds');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {publicKey && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl mb-2">Dead Man&apos;s Switch</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Set up automatic transfer of funds if you don&apos;t check in regularly.
            </p>
          </div>

          {/* Create New Escrow Section */}
          <div className="border-b pb-6">
            <h3 className="text-xl mb-4">Create New Escrow</h3>
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

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm">Seconds:</label>
                <input
                  type="number"
                  min="0"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-24 p-2 border rounded"
                  placeholder="Enter seconds"
                />
              </div>
              <button
                onClick={handleCustomTimer}
                className="bg-purple-500 text-white px-4 py-2 rounded w-full mt-2"
              >
                Create Custom Timer
              </button>
            </div>
          </div>

          {/* Active Escrows Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Your Escrows</h3>
              
              {escrows.length === 0 ? (
                <p className="text-gray-500">No escrows found</p>
              ) : (
                <div className="space-y-4">
                  {escrows.map((escrow) => (
                    <div 
                      key={escrow.pubkey.toString()} 
                      className="border dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">Escrow</h4>
                            <StatusBadge deadline={escrow.account.deadline} />
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <p className="text-gray-600 dark:text-gray-400">
                              Beneficiary: {escrow.account.beneficiary.toString()}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              Balance: {formatSolBalance(escrow.balance)}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              Last Check-in: {new Date(escrow.account.lastCheckin.toNumber() * 1000).toLocaleString()}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              Deadline: {new Date(escrow.account.deadline.toNumber() * 1000).toLocaleString()}
                            </p>
                            <p className="font-medium">
                              Time Remaining: {escrow.timeRemaining}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {escrow.account.deadline.toNumber() <= Date.now() / 1000 ? (
                            <button
                              onClick={() => claimEscrow(escrow.pubkey, escrow.account.beneficiary)}
                              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg w-32"
                            >
                              Claim
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleCheckIn(escrow.pubkey)}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg w-32"
                              >
                                Check In
                              </button>
                              
                              <button
                                onClick={() => cancelEscrow(escrow.pubkey)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg w-32"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-4">
            <button
              onClick={() => activateSwitch(15)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Create 15s Test Switch
            </button>
            
            <button
              onClick={() => activateSwitch(30)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Create 30s Test Switch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadManSwitch;