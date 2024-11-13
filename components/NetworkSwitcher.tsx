"use client";

import { FC } from 'react';
import { useNetworkConfiguration } from '@/contexts/NetworkConfigurationProvider';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { toast } from "sonner";

export const NetworkSwitcher: FC = () => {
  const { networkConfiguration } = useNetworkConfiguration();

  const handleNetworkSwitch = () => {
    toast.error("Mainnet functionality is under development");
  };

  return (
    <button
      className="px-4 py-2 text-sm font-medium text-white bg-zinc-900/50 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
      onClick={handleNetworkSwitch}
    >
      {networkConfiguration === WalletAdapterNetwork.Devnet ? 'Devnet' : 'Mainnet'}
    </button>
  );
}; 