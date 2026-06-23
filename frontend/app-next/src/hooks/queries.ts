import { useQuery } from '@tanstack/react-query';
import { getBaseStats, getUserLQTData } from '../api/contracts';
import { getUserBalance } from '../api/user';
import { getAllOvens, getUserOvens, getCtezStorage } from '../contracts/ctez';
import { getCfmmStorage } from '../contracts/cfmm';
import { getDelegates, getOvenBakerInfo } from '../api/tzkt';
import { ensureContracts } from '../lib/init';

const withContracts = <T>(fn: () => Promise<T>) => async (): Promise<T> => {
  await ensureContracts();
  return fn();
};

export const useBaseStats = () =>
  useQuery({
    queryKey: ['baseStats'],
    queryFn: withContracts(() => getBaseStats()),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

export const useCtezStorage = () =>
  useQuery({ queryKey: ['ctezStorage'], queryFn: withContracts(() => getCtezStorage()) });

export const useCfmmStorage = () =>
  useQuery({
    queryKey: ['cfmmStorage'],
    queryFn: withContracts(() => getCfmmStorage()),
    refetchInterval: 60_000,
  });

export const useUserBalance = (pkh?: string) =>
  useQuery({
    queryKey: ['userBalance', pkh],
    queryFn: withContracts(() => getUserBalance(pkh as string)),
    enabled: !!pkh,
  });

export const useUserOvens = (pkh?: string) =>
  useQuery({
    queryKey: ['userOvens', pkh],
    queryFn: withContracts(() => getUserOvens(pkh as string)),
    enabled: !!pkh,
  });

export const useAllOvens = () =>
  useQuery({ queryKey: ['allOvens'], queryFn: withContracts(() => getAllOvens()) });

export const useUserLQT = (pkh?: string) =>
  useQuery({
    queryKey: ['userLqt', pkh],
    queryFn: withContracts(() => getUserLQTData(pkh as string)),
    enabled: !!pkh,
  });

export const useDelegates = () =>
  useQuery({ queryKey: ['delegates'], queryFn: () => getDelegates(), staleTime: 5 * 60_000 });

export const useOvenBaker = (ovenAddress?: string, owner?: string) =>
  useQuery({
    queryKey: ['ovenBaker', ovenAddress],
    queryFn: () => getOvenBakerInfo(ovenAddress as string, owner as string),
    enabled: !!ovenAddress && !!owner,
    staleTime: 5 * 60_000,
  });
