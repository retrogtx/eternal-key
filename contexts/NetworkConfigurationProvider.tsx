"use client";

import { createContext, FC, ReactNode, useContext, useState } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

interface NetworkConfigurationContextState {
  networkConfiguration: WalletAdapterNetwork;
  setNetworkConfiguration: (network: WalletAdapterNetwork) => void;
}

const NetworkConfigurationContext = createContext<NetworkConfigurationContextState>({} as NetworkConfigurationContextState);

export function useNetworkConfiguration() {
  return useContext(NetworkConfigurationContext);
}

export const NetworkConfigurationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [networkConfiguration, setNetworkConfiguration] = useState<WalletAdapterNetwork>(WalletAdapterNetwork.Devnet);

  return (
    <NetworkConfigurationContext.Provider value={{ networkConfiguration, setNetworkConfiguration }}>
      {children}
    </NetworkConfigurationContext.Provider>
  );
}; 