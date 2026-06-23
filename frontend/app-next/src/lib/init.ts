import { initTezos } from '../contracts/client';
import { initCTez } from '../contracts/ctez';
import { initCfmm } from '../contracts/cfmm';
import { CFMM_ADDRESS, CTEZ_ADDRESS, RPC_URL } from '../utils/globals';

// Initialise Taquito at module load (imported first in main.tsx) so on-chain
// reads work before any wallet is connected, regardless of React effect order.
initTezos(RPC_URL, '443');

let contractsPromise: Promise<unknown> | null = null;

/** Lazily initialise the ctez + cfmm contract handles exactly once. */
export function ensureContracts(): Promise<unknown> {
  if (!contractsPromise) {
    contractsPromise = Promise.all([
      CTEZ_ADDRESS ? initCTez(CTEZ_ADDRESS) : Promise.resolve(),
      CFMM_ADDRESS ? initCfmm(CFMM_ADDRESS) : Promise.resolve(),
    ]);
  }
  return contractsPromise;
}
