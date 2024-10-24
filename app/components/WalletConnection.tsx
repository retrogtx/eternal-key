import { FC, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const WalletConnection: FC = () => {
  const { publicKey, disconnect } = useWallet();

  const handleDisconnect = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

  return (
    <div>
      {publicKey ? (
        <div>
          <p>Connected: {publicKey.toBase58()}</p>
          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      ) : (
        <WalletMultiButton />
      )}
    </div>
  );
};

export default WalletConnection;
