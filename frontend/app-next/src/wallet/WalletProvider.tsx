import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useToast } from '@chakra-ui/react';
import {
  connectWallet as beaconConnect,
  disconnectWallet as beaconDisconnect,
  getActivePkh,
  getWallet,
} from './beacon';
import { setWalletProvider } from '../contracts/client';
import { NETWORK } from '../utils/globals';

interface WalletContextValue {
  pkh?: string;
  network: string;
  connecting: boolean;
  ready: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>({
  network: NETWORK,
  connecting: false,
  ready: false,
  connect: async () => undefined,
  disconnect: async () => undefined,
});

export const useWallet = (): WalletContextValue => useContext(WalletContext);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [pkh, setPkh] = useState<string | undefined>(undefined);
  const [connecting, setConnecting] = useState(false);
  const [ready, setReady] = useState(false);
  const toast = useToast();

  // Restore an existing Beacon session on load (Taquito is already initialised
  // at module load via lib/init).
  useEffect(() => {
    (async () => {
      try {
        const existing = await getActivePkh();
        if (existing) {
          setWalletProvider(getWallet());
          setPkh(existing);
        }
      } catch {
        /* no active session */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const address = await beaconConnect();
      setWalletProvider(getWallet());
      setPkh(address);
    } catch (err) {
      toast({
        title: 'Wallet connection cancelled',
        description: err instanceof Error ? err.message : undefined,
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setConnecting(false);
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    await beaconDisconnect();
    setPkh(undefined);
  }, []);

  const value = useMemo(
    () => ({ pkh, network: NETWORK, connecting, ready, connect, disconnect }),
    [pkh, connecting, ready, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
