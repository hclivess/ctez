import axios from 'axios';
import { CFMM_ADDRESS, CTEZ_ADDRESS, TZKT_API, TZKT_PORT } from '../utils/globals';

const BASE = `${TZKT_API}:${TZKT_PORT}/v1`;
const SCALE = 2 ** 48;
const YEAR_SECONDS = 365.25 * 24 * 3600;

export interface HistoryPoint {
  t: number; // unix ms
  target: number; // tez per ctez (the peg)
  price: number; // tez per ctez (CFMM market)
  premium: number; // %
  annualDrift: number; // %
  tvl: number; // tez in the pool (2× cash side)
}

/** Run `fn` over `items` with bounded concurrency. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      out[idx] = await fn(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * Build a daily-ish time series of target, market price, premium, drift and
 * pool liquidity directly from TzKT — no external analytics backend.
 *
 * Strategy: two anchor queries (head + a block ~`days` ago) give a level↔time
 * mapping; we interpolate `points` evenly-spaced levels and read ctez + cfmm
 * storage at each (TzKT returns storage as of the nearest prior change).
 */
export async function getCtezHistory(days = 30, points = 30): Promise<HistoryPoint[]> {
  const head = (await axios.get(`${BASE}/head`)).data;
  const headLevel: number = head.level;
  const headTime = new Date(head.timestamp).getTime();

  const startISO = new Date(headTime - days * 864e5).toISOString();
  const anchorRes = (
    await axios.get(`${BASE}/blocks`, {
      params: { 'timestamp.le': startISO, 'sort.desc': 'level', limit: 1, select: 'level,timestamp' },
    })
  ).data;
  const anchor = anchorRes?.[0];
  const startLevel: number = anchor?.level ?? Math.max(headLevel - 1, 1);
  const startTime = anchor ? new Date(anchor.timestamp).getTime() : headTime - days * 864e5;

  const samples = Array.from({ length: points }, (_, i) => {
    const frac = points === 1 ? 1 : i / (points - 1);
    return {
      level: Math.round(startLevel + frac * (headLevel - startLevel)),
      t: Math.round(startTime + frac * (headTime - startTime)),
    };
  });

  const rows = await mapLimit(samples, 8, async ({ level, t }) => {
    try {
      const [cz, cf] = await Promise.all([
        axios.get(`${BASE}/contracts/${CTEZ_ADDRESS}/storage`, { params: { level } }),
        axios.get(`${BASE}/contracts/${CFMM_ADDRESS}/storage`, { params: { level } }),
      ]);
      const target = Number(cz.data.target) / SCALE;
      const drift = Number(cz.data.drift);
      const cash = Number(cf.data.cashPool);
      const token = Number(cf.data.tokenPool);
      const price = token > 0 ? cash / token : 0;
      return {
        t,
        target,
        price,
        premium: target > 0 ? (price / target - 1) * 100 : 0,
        annualDrift: ((1 + drift / SCALE) ** YEAR_SECONDS - 1) * 100,
        tvl: (cash * 2) / 1e6,
      } as HistoryPoint;
    } catch {
      return null;
    }
  });

  return rows.filter((r): r is HistoryPoint => !!r);
}
