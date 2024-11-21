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
import { IDL } from '@/types/dead-man-switch';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePickerDemo } from '@/components/custom-date-picker';
import { differenceInMinutes, addDays, addMonths, addYears } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface ExtendDuration {
  days: number;
  months: number;
  years: number;
}

const DeadManSwitch: FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [program, setProgram] = useState<Program<typeof IDL> | null>(null);
  const [escrows, setEscrows] = useState<EscrowInfo[]>([]);
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [duration, setDuration] = useState<number>(0);
  const [extendDuration, setExtendDuration] = useState<ExtendDuration>({
    days: 0,
    months: 0,
    years: 0
  });
  const [depositAmount, setDepositAmount] = useState<number>(1);

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

  useEffect(() => {
    if (program && publicKey && connection) {
      fetchEscrows();
    }
  }, [program, publicKey, connection]);

  useEffect(() => {
    if (selectedDate) {
      const now = new Date();
      const diffInMinutes = differenceInMinutes(selectedDate, now);
      setDuration(diffInMinutes > 0 ? diffInMinutes : 0);
    }
  }, [selectedDate]);

  const formatTimeRemaining = (deadline: number) => {
    const now = Date.now() / 1000;
    const remaining = deadline - now;
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remaining % (60 * 60)) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatSolBalance = (lamports: number) => {
    return `${(lamports / LAMPORTS_PER_SOL).toFixed(2)} SOL`;
  };

  const fetchEscrows = async () => {
    if (!program || !publicKey || !connection) return;

    try {
      const ownerEscrows = await program.account.escrow.all([
        {
          memcmp: {
            offset: 8,
            bytes: publicKey.toBase58()
          }
        }
      ]);

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

  const activateSwitch = async (seconds: number) => {
    if (!program || !publicKey || !connection) {
      toast.error('Please connect your wallet first.');
      return;
    }

    try {
      const balance = await connection.getBalance(publicKey);
      const amountInLamports = depositAmount * LAMPORTS_PER_SOL;
      
      if (balance < amountInLamports) {
        toast.error(`Insufficient funds. You need at least ${depositAmount} SOL. Current balance: ${(balance / LAMPORTS_PER_SOL).toFixed(2)} SOL.`);
        return;
      }

      const slot = await connection.getSlot();
      const currentTime = await connection.getBlockTime(slot);
      if (!currentTime) throw new Error("Couldn't get block time");

      const deadline = currentTime + seconds;
      const seed = new Date().getTime().toString();

      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), publicKey.toBuffer(), Buffer.from(seed)],
        PROGRAM_ID
      );

      toast.info('Please approve both the transactions.');

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

      await program.methods
        .deposit(new BN(amountInLamports))
        .accounts({
          owner: publicKey,
          escrow: escrowPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await fetchEscrows();
      toast.success('Escrow created successfully.');

    } catch (error) {
      console.error('Error creating escrow:', error);
      toast.error('Failed to create escrow.');
    }
  };

  const handleDateSelection = async () => {
    if (!beneficiaryAddress || beneficiaryAddress.trim() === '') {
      toast.error('Please enter a beneficiary address.');
      return;
    }

    if (!selectedDate) {
      toast.error('Please select a deadline date.');
      return;
    }

    if (duration <= 0) {
      toast.error('Selected date must be in the future.');
      return;
    }

    if (!PublicKey.isOnCurve(beneficiaryAddress)) {
      toast.error('Invalid beneficiary address format.');
      return;
    }

    const seconds = duration * 60;
    await activateSwitch(seconds);
    setSelectedDate(undefined);
  };

  const calculateTotalSeconds = (duration: ExtendDuration): number => {
    const now = new Date();
    const future = addYears(
      addMonths(
        addDays(now, duration.days),
        duration.months
      ),
      duration.years
    );
    return Math.floor((future.getTime() - now.getTime()) / 1000);
  };

  const handleCheckIn = async (escrowPubkey: PublicKey) => {
    if (!program || !publicKey) return;

    try {
      const { days, months, years } = extendDuration;
      if (days === 0 && months === 0 && years === 0) {
        toast.error('Please enter at least one duration value.');
        return;
      }

      const slot = await connection.getSlot();
      const currentTime = await connection.getBlockTime(slot);
      if (!currentTime) throw new Error("Couldn't get block time");

      const extensionSeconds = calculateTotalSeconds(extendDuration);
      const newDeadline = currentTime + extensionSeconds;

      await program.methods
        .checkin(new BN(newDeadline))
        .accounts({
          owner: publicKey,
          escrow: escrowPubkey,
        })
        .rpc();

      setExtendDuration({ days: 0, months: 0, years: 0 });
      
      await fetchEscrows();
      toast.success('Successfully checked in.');
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in. See console for details.');
    }
  };

  const cancelEscrow = async (escrowPubkey: PublicKey) => {
    if (!program || !publicKey) {
      toast.error('Wallet not connected.');
      return;
    }

    try {
      toast.info('Please approve the transaction in your wallet.');
      
      await program.methods
        .cancel()
        .accounts({
          owner: publicKey,
          escrow: escrowPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await fetchEscrows();
      toast.success('Escrow cancelled successfully. Funds returned.');
    } catch (error) {
      toast.error(`Failed to cancel escrow. See console for details. ${error}`);
    }
  };

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
      toast.success('Funds claimed successfully.');
    } catch (error) {
      console.error('Error claiming funds:', error);
      toast.error('Failed to claim funds.');
    }
  };

  const DurationInputs: FC<{
    duration: ExtendDuration;
    onChange: (duration: ExtendDuration) => void;
  }> = ({ duration, onChange }) => {
    const handleChange = (field: keyof ExtendDuration, value: string) => {
      const numValue = parseInt(value) || 0;
      onChange({ ...duration, [field]: numValue });
    };

    return (
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Days
          </label>
          <input
            type="number"
            min="0"
            value={duration.days || ''}
            onChange={(e) => handleChange('days', e.target.value)}
            className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                     text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Months
          </label>
          <input
            type="number"
            min="0"
            value={duration.months || ''}
            onChange={(e) => handleChange('months', e.target.value)}
            className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                     text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Years
          </label>
          <input
            type="number"
            min="0"
            value={duration.years || ''}
            onChange={(e) => handleChange('years', e.target.value)}
            className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                     text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {publicKey && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Time-Locked Succession</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Set up automatic transfer of funds if you don&apos;t check in regularly
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 shadow-lg border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6">Create New Escrow</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Beneficiary Address
                </label>
                <input
                  type="text"
                  value={beneficiaryAddress}
                  onChange={(e) => setBeneficiaryAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg 
                           text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter Solana address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg 
                           text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter amount in SOL"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-200">
                  Select Deadline Date
                </label>
                <DatePickerDemo 
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                />
                {duration > 0 && (
                  <p className="text-sm text-zinc-400 mt-2">
                    Duration: {duration} minutes
                  </p>
                )}
                <Button
                  onClick={handleDateSelection}
                  variant="default"
                  size="lg"
                  className={cn(
                    "w-full mt-4 bg-gradient-to-r from-gray-500 to-gray-600",
                    "hover:from-gray-600 hover:to-gray-700",
                    "shadow-lg hover:shadow-gray-500/25",
                    "border border-white/10",
                    "transition-all duration-300 ease-out",
                    "font-semibold text-base",
                    "disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed",
                    "group relative overflow-hidden"
                  )}
                  disabled={!selectedDate || !beneficiaryAddress || !depositAmount || duration <= 0}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span>Create Switch</span>
                    <svg 
                      className="w-5 h-5 transition-transform group-hover:translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors duration-300" />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 shadow-lg border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6">Your Escrows</h3>
            
            {escrows.length === 0 ? (
              <p className="text-gray-400">No escrows found</p>
            ) : (
              <div className="space-y-6">
                {escrows.map((escrow) => (
                  <div 
                    key={escrow.pubkey.toString()} 
                    className="bg-white/5 backdrop-blur rounded-lg p-6 border border-white/10"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-white">Escrow</h4>
                          <StatusBadge deadline={escrow.account.deadline} />
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-300">
                            <span className="text-gray-400">Beneficiary:</span> {escrow.account.beneficiary.toString()}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-400">Balance:</span> {formatSolBalance(escrow.balance)}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-400">Last Check-in:</span> {new Date(escrow.account.lastCheckin.toNumber() * 1000).toLocaleString()}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-400">Deadline:</span> {new Date(escrow.account.deadline.toNumber() * 1000).toLocaleString()}
                          </p>
                          <p className="text-white font-medium">
                            Time Remaining: {escrow.timeRemaining}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {escrow.account.beneficiary.toString() === publicKey?.toString() ? (
                          <Button
                            onClick={() => {
                              if (escrow.account.deadline.toNumber() <= Date.now() / 1000) {
                                claimEscrow(escrow.pubkey, escrow.account.beneficiary);
                              } else {
                                toast.error(`Cannot claim yet. Time remaining: ${escrow.timeRemaining}.`);
                              }
                            }}
                            variant="default"
                            size="lg"
                            className={cn(
                              "w-32 bg-gradient-to-r",
                              escrow.account.deadline.toNumber() <= Date.now() / 1000
                                ? "from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500"
                                : "from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700",
                              "shadow-lg hover:shadow-gray-500/25",
                              "border border-white/10",
                              "transition-all duration-300 ease-out",
                              "font-semibold text-base",
                              "group relative overflow-hidden"
                            )}
                          >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              <span>Claim</span>
                              {escrow.account.deadline.toNumber() <= Date.now() / 1000 && (
                                <svg 
                                  className="w-5 h-5 transition-transform group-hover:translate-x-1" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                  />
                                </svg>
                              )}
                            </span>
                            <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors duration-300" />
                          </Button>
                        ) : escrow.account.owner.toString() === publicKey?.toString() && (
                          <>
                            <DurationInputs
                              duration={extendDuration}
                              onChange={setExtendDuration}
                            />
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleCheckIn(escrow.pubkey)}
                                variant="default"
                                size="lg"
                                className={cn(
                                  "w-32 bg-gradient-to-r from-blue-500 to-blue-600",
                                  "hover:from-blue-600 hover:to-blue-700",
                                  "shadow-lg hover:shadow-blue-500/25",
                                  "border border-white/10",
                                  "transition-all duration-300 ease-out",
                                  "font-semibold text-base",
                                  "disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed",
                                  "group relative overflow-hidden"
                                )}
                                disabled={!extendDuration.days && !extendDuration.months && !extendDuration.years}
                              >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                  <span>Check In</span>
                                  <svg 
                                    className="w-5 h-5 transition-transform group-hover:translate-x-1" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </span>
                                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors duration-300" />
                              </Button>
                              
                              <Button
                                onClick={() => cancelEscrow(escrow.pubkey)}
                                variant="default"
                                size="lg"
                                className={cn(
                                  "w-32 bg-gradient-to-r from-red-500 to-red-600",
                                  "hover:from-red-600 hover:to-red-700",
                                  "shadow-lg hover:shadow-red-500/25",
                                  "border border-white/10",
                                  "transition-all duration-300 ease-out",
                                  "font-semibold text-base",
                                  "group relative overflow-hidden"
                                )}
                              >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                  <span>Cancel</span>
                                  <svg 
                                    className="w-5 h-5 transition-transform group-hover:translate-x-1" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </span>
                                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors duration-300" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => activateSwitch(15)}
              variant="default"
              size="lg"
              className={cn(
                "flex-1 bg-gradient-to-r from-purple-500 to-purple-600",
                "hover:from-purple-600 hover:to-purple-700",
                "shadow-lg hover:shadow-purple-500/25",
                "border border-white/10",
                "transition-all duration-300 ease-out",
                "font-semibold text-base",
                "group relative overflow-hidden"
              )}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>15s Escrow for testing</span>
                <svg 
                  className="w-5 h-5 transition-transform group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors duration-300" />
            </Button>
            
            <Button
              onClick={() => activateSwitch(30)}
              variant="default"
              size="lg"
              className={cn(
                "flex-1 bg-gradient-to-r from-purple-500 to-purple-600",
                "hover:from-purple-600 hover:to-purple-700",
                "shadow-lg hover:shadow-purple-500/25",
                "border border-white/10",
                "transition-all duration-300 ease-out",
                "font-semibold text-base",
                "group relative overflow-hidden"
              )}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>30s Escrow for testing</span>
                <svg 
                  className="w-5 h-5 transition-transform group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors duration-300" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadManSwitch;