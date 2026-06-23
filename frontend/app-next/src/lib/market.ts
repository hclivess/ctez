export interface MarketContext {
  targetNorm: number; // tez per ctez (the peg)
  marketPrice: number; // tez per ctez on the CFMM
  premiumPct: number; // (price/target - 1) * 100
  repayFavored: boolean; // ctez cheaper than target -> cheap to buy & burn
  mintFavored: boolean; // ctez richer than target -> mint & sell favored
  liquidationBreakevenPrice: number; // target * 32/31 — buy-to-liquidate profitable below this
  liquidationProfitable: boolean; // market price below the breakeven
}

/** Current market posture derived from the target peg and the CFMM price. */
export function marketContext(targetNorm: number, marketPrice: number): MarketContext {
  const premiumPct = targetNorm > 0 ? (marketPrice / targetNorm - 1) * 100 : 0;
  const liquidationBreakevenPrice = targetNorm * (32 / 31);
  return {
    targetNorm,
    marketPrice,
    premiumPct,
    repayFavored: marketPrice < targetNorm,
    mintFavored: marketPrice > targetNorm,
    liquidationBreakevenPrice,
    liquidationProfitable: marketPrice > 0 && marketPrice < liquidationBreakevenPrice,
  };
}

/**
 * Estimate the profit (in tez) from liquidating `qCtez` of an oven's debt,
 * assuming you market-buy the ctez at `marketPrice`. Receives q*target*32/31 tez.
 */
export function liquidationProfit(qCtez: number, targetNorm: number, marketPrice: number): number {
  const received = qCtez * targetNorm * (32 / 31);
  const cost = qCtez * marketPrice;
  return received - cost;
}

/** Tez cost to buy `qCtez` on the market (rough, ignores slippage). */
export function repayCost(qCtez: number, marketPrice: number): number {
  return qCtez * marketPrice;
}
