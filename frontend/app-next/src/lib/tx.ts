import { useToast } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';

/** Best-effort human-readable message from a Taquito / Beacon / contract error. */
export function parseError(e: unknown): string {
  if (!e) return 'Unknown error';
  const anyE = e as { message?: string; description?: string; name?: string };
  const msg = anyE.message || anyE.description || String(e);
  if (/abort|reject|denied|UserAbort|NotGranted|cancell?ed/i.test(msg)) return 'Rejected in wallet';
  const code = msg.match(/"int":"(-?\d+)"/) || msg.match(/failed with[^0-9-]*(-?\d+)/i);
  if (code) return `Contract rejected the operation (code ${code[1]})`;
  return msg.length > 180 ? `${msg.slice(0, 180)}…` : msg;
}

type OpLike = { confirmation?: (n?: number) => Promise<unknown>; opHash?: string };

/**
 * Wraps a wallet operation with loading/success/error toasts, awaits one
 * confirmation, then invalidates all queries so balances refresh.
 */
export function useTx() {
  const toast = useToast();
  const qc = useQueryClient();

  return async function run(label: string, fn: () => Promise<OpLike | string>): Promise<boolean> {
    const id = toast({
      title: `${label}…`,
      description: 'Confirm the transaction in your wallet',
      status: 'loading',
      duration: null,
      isClosable: false,
    });
    try {
      const op = await fn();
      if (op && typeof op !== 'string' && typeof op.confirmation === 'function') {
        toast.update(id, {
          title: `${label}: awaiting confirmation`,
          description: 'Waiting for the operation to be included on-chain…',
          status: 'loading',
          duration: null,
        });
        await op.confirmation(1);
      }
      toast.update(id, {
        title: `${label} confirmed`,
        description: undefined,
        status: 'success',
        duration: 7000,
        isClosable: true,
      });
      await qc.invalidateQueries();
      return true;
    } catch (e) {
      toast.update(id, {
        title: `${label} failed`,
        description: parseError(e),
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
      return false;
    }
  };
}
