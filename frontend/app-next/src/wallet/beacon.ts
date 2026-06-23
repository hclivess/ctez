import { BeaconWallet } from '@taquito/beacon-wallet';
import { APP_NAME, NETWORK } from '../utils/globals';

// Taquito v24's @taquito/beacon-wallet bundles its own Beacon fork
// (@ecadlabs/beacon-*). We no longer depend on @airgap/beacon-sdk.
// v24's connect flow renders an in-page modal (no about:blank popup) and
// ships the relay-node health-check fix — this is what resolves the old
// "Connect wallet opens an empty tab" bug from beacon-sdk 3.0.0.
//
// Beacon's NetworkType is a plain string enum (MAINNET === 'mainnet'), so we
// pass the string value directly and avoid the @ecadlabs/beacon-types ESM
// subpath, which has an extensionless-import resolution quirk under Node.
type BeaconNetworkType = 'mainnet' | 'ghostnet';

const beaconNetwork = (n: string): { type: BeaconNetworkType } => ({
  type: n === 'ghostnet' ? 'ghostnet' : 'mainnet',
});

let walletInstance: BeaconWallet | null = null;

export const getWallet = (): BeaconWallet => {
  if (!walletInstance) {
    walletInstance = new BeaconWallet({
      name: APP_NAME,
      network: beaconNetwork(NETWORK),
    } as never);
  }
  return walletInstance;
};

/** Returns the address of an already-paired account, or undefined. */
export const getActivePkh = async (): Promise<string | undefined> => {
  const account = await getWallet().client.getActiveAccount();
  return account?.address;
};

/** Opens the Beacon pairing modal and returns the connected address. */
export const connectWallet = async (): Promise<string> => {
  const wallet = getWallet();
  // Network is configured on the wallet at construction; recent Beacon versions
  // reject a `network` property passed to requestPermissions().
  await wallet.requestPermissions();
  return wallet.getPKH();
};

/** Clears the active account (lets the user pick a different wallet next time). */
export const disconnectWallet = async (): Promise<void> => {
  await getWallet().clearActiveAccount();
};
