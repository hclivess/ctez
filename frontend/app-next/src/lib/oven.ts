import BigNumber from 'bignumber.js';
import { getOvenMaxCtez } from '../utils/ovenUtils';
import { isMonthFromLiquidation } from '../api/contracts';

export interface OvenMetrics {
  tez: number; // collateral, decimal tez
  ctezOutstanding: number; // debt, decimal ctez
  maxMintable: number; // max ctez this collateral can back
  remainingMintable: number; // headroom still mintable
  collateralRatioPct: number; // tez / (ctez * target) * 100; Infinity if no debt
  liquidationTarget: number; // target (tez/ctez) at which the oven becomes liquidatable
  currentTarget: number; // normalised target (tez per ctez)
  utilizationPct: number; // ctezOutstanding / maxMintable * 100
  atRisk: boolean; // within ~1 month of liquidation at the current drift
}

/**
 * Collateral economics for a single oven. ctez liquidates when
 * tez_collateral < ctez_outstanding * target * (16/15). `rawTarget`/`rawDrift`
 * are the on-chain values scaled by 2^48.
 */
export function computeOvenMetrics(
  tezBalanceMutez: string | number,
  ctezOutstandingMutez: string | number,
  rawTarget: number,
  rawDrift: number,
): OvenMetrics {
  const tez = new BigNumber(tezBalanceMutez).shiftedBy(-6).toNumber();
  const ctezOutstanding = new BigNumber(ctezOutstandingMutez).shiftedBy(-6).toNumber();
  const target = rawTarget / 2 ** 48;
  const { max, remaining } = getOvenMaxCtez(tezBalanceMutez, ctezOutstandingMutez, rawTarget);
  const debtInTez = ctezOutstanding * target;

  const collateralRatioPct = ctezOutstanding > 0 ? (tez / debtInTez) * 100 : Infinity;
  const liquidationTarget = ctezOutstanding > 0 ? (tez * 15) / (ctezOutstanding * 16) : Infinity;
  const utilizationPct = max > 0 ? Math.min((ctezOutstanding / max) * 100, 100) : 0;
  const atRisk =
    ctezOutstanding > 0 && isMonthFromLiquidation(ctezOutstanding, rawTarget, tez, rawDrift);

  return {
    tez,
    ctezOutstanding,
    maxMintable: max,
    remainingMintable: Math.max(remaining, 0),
    collateralRatioPct,
    liquidationTarget,
    currentTarget: target,
    utilizationPct,
    atRisk,
  };
}

/** Liquidation threshold: an oven is liquidatable below ~106.67% (16/15). */
export const LIQUIDATION_RATIO_PCT = (16 / 15) * 100;

export const isLiquidatable = (m: OvenMetrics): boolean =>
  m.ctezOutstanding > 0 && m.collateralRatioPct < LIQUIDATION_RATIO_PCT;

/** UI risk bucket from collateral ratio (liquidation threshold ≈ 106.67%). */
export function ovenHealth(collateralRatioPct: number): {
  label: string;
  color: string;
} {
  if (!Number.isFinite(collateralRatioPct)) return { label: 'No debt', color: 'gray.400' };
  if (collateralRatioPct >= 200) return { label: 'Safe', color: 'brand.300' };
  if (collateralRatioPct >= 140) return { label: 'Watch', color: 'yellow.300' };
  if (collateralRatioPct >= 115) return { label: 'Risky', color: 'orange.300' };
  return { label: 'Critical', color: 'red.400' };
}
