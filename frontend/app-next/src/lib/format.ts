import BigNumber from 'bignumber.js';

export const shortenAddress = (addr?: string, size = 4): string =>
  addr ? `${addr.slice(0, size + 2)}…${addr.slice(-size)}` : '';

/** Locale number with a max number of decimals (trims trailing zeros). */
export const fmt = (value: number | string | null | undefined, dp = 2): string => {
  const n = Number(value);
  if (value == null || value === '' || Number.isNaN(n)) return '0';
  return n.toLocaleString('en-US', { maximumFractionDigits: dp });
};

/** Compact notation for big totals: 1.2M, 34.5K. */
export const fmtCompact = (value: number | string | null | undefined, dp = 2): string => {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return '0';
  return n.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: dp });
};

export const fmtPct = (value: number | string | null | undefined, dp = 2): string =>
  `${fmt(value, dp)}%`;

/** mutez/nat (1e6) -> decimal token amount */
export const fromMutez = (value: number | string, decimals = 6): number =>
  new BigNumber(value).shiftedBy(-decimals).toNumber();

export const isPositive = (value: number | string | null | undefined): boolean => Number(value) > 0;
