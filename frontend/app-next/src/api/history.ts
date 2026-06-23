import axios from 'axios';
import {
  CFMM_ADDRESS,
  CTEZ_ADDRESS,
  CTEZ_CONTRACT_BIGMAP,
  CTEZ_FA12_ADDRESS,
  TZKT_API,
  TZKT_PORT,
} from '../utils/globals';

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
  supply: number; // total ctez in circulation
  ovenCount: number; // cumulative ovens created
}

/** GET JSON with retry/backoff on TzKT rate-limit (429). */
async function getJson(url: string, params?: Record<string, unknown>, tries = 4): Promise<any> {
  for (let i = 0; i < tries; i++) {
    try {
      return (await axios.get(url, { params })).data;
    } catch (e: any) {
      if (e?.response?.status === 429 && i < tries - 1) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** i));
        continue;
      }
      throw e;
    }
  }
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
 * Build a daily-ish time series of target, market price, premium, drift, pool
 * liquidity, ctez supply and oven count directly from TzKT — no external
 * analytics backend.
 *
 * Two anchor queries (head + a block ~`days` ago) give a level↔time mapping; we
 * interpolate `points` evenly-spaced levels and read ctez / cfmm / fa1.2 storage
 * at each. Oven count comes from each oven's bigmap creation level.
 */
export async function getCtezHistory(days = 30, points = 28): Promise<HistoryPoint[]> {
  const head = await getJson(`${BASE}/head`);
  const headLevel: number = head.level;
  const headTime = new Date(head.timestamp).getTime();

  const startISO = new Date(headTime - days * 864e5).toISOString();
  const anchorRes = await getJson(`${BASE}/blocks`, {
    'timestamp.le': startISO,
    'sort.desc': 'level',
    limit: 1,
    select: 'level,timestamp',
  });
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

  // Every oven's creation level (ovens are never removed from the bigmap), so
  // the oven count at any level is simply how many were created by then.
  const ovenFirstLevels: number[] = (
    await getJson(`${BASE}/bigmaps/${CTEZ_CONTRACT_BIGMAP}/keys`, {
      select: 'firstLevel',
      limit: 10000,
    })
  )
    .map((x: unknown) => Number(x))
    .sort((a: number, b: number) => a - b);

  const rows = await mapLimit(samples, 3, async ({ level, t }) => {
    try {
      const [cz, cf, fa] = await Promise.all([
        getJson(`${BASE}/contracts/${CTEZ_ADDRESS}/storage`, { level }),
        getJson(`${BASE}/contracts/${CFMM_ADDRESS}/storage`, { level }),
        getJson(`${BASE}/contracts/${CTEZ_FA12_ADDRESS}/storage`, { level }),
      ]);
      const target = Number(cz.target) / SCALE;
      const drift = Number(cz.drift);
      const cash = Number(cf.cashPool);
      const token = Number(cf.tokenPool);
      const price = token > 0 ? cash / token : 0;
      return {
        t,
        target,
        price,
        premium: target > 0 ? (price / target - 1) * 100 : 0,
        annualDrift: ((1 + drift / SCALE) ** YEAR_SECONDS - 1) * 100,
        tvl: (cash * 2) / 1e6,
        supply: Number(fa.total_supply) / 1e6,
        ovenCount: ovenFirstLevels.reduce((n, l) => (l <= level ? n + 1 : n), 0),
      } as HistoryPoint;
    } catch {
      return null;
    }
  });

  return rows.filter((r): r is HistoryPoint => !!r);
}
