import { useMemo, useState } from 'react';
import { Box, Button, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { FiZap, FiShield } from 'react-icons/fi';
import { useWallet } from '../wallet/WalletProvider';
import { useAllOvens, useBaseStats } from '../hooks/queries';
import { PageHeader, Loading, EmptyState, StatCard } from '../components/ui';
import { computeOvenMetrics, isLiquidatable } from '../lib/oven';
import { marketContext } from '../lib/market';
import OvenRow from '../components/ovens/OvenRow';
import LiquidateModal from '../components/ovens/LiquidateModal';
import MarketContextBanner from '../components/market/MarketContextBanner';
import { AllOvenDatum } from '../interfaces';

type Filter = 'liquidatable' | 'risk' | 'all';
const MAX_ROWS = 100;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'liquidatable', label: 'Liquidatable' },
  { key: 'risk', label: 'At risk' },
  { key: 'all', label: 'All' },
];

export default function Liquidations() {
  const { pkh } = useWallet();
  const { data: stats } = useBaseStats();
  const { data: allOvens, isLoading } = useAllOvens();
  const [filter, setFilter] = useState<Filter>('liquidatable');
  const [target, setTarget] = useState<AllOvenDatum | null>(null);

  const rawTarget = stats?.originalTarget ?? 0;
  const rawDrift = stats?.drift ?? 0;
  const market = marketContext(Number(stats?.currentTarget ?? 0), Number(stats?.currentPrice ?? 0));

  const rows = useMemo(() => {
    if (!allOvens || !rawTarget) return [];
    return allOvens
      .filter((o) => o.active && Number(o.value.ctez_outstanding) > 0)
      .map((o) => {
        const m = computeOvenMetrics(o.value.tez_balance, o.value.ctez_outstanding, rawTarget, rawDrift);
        return { o, m, liq: isLiquidatable(m) };
      })
      .sort((a, b) => a.m.collateralRatioPct - b.m.collateralRatioPct);
  }, [allOvens, rawTarget, rawDrift]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      liquidatable: rows.filter((r) => r.liq).length,
      risk: rows.filter((r) => !r.liq && r.m.atRisk).length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const f =
      filter === 'liquidatable'
        ? rows.filter((r) => r.liq)
        : filter === 'risk'
          ? rows.filter((r) => r.m.atRisk)
          : rows;
    return f.slice(0, MAX_ROWS);
  }, [rows, filter]);

  return (
    <Box>
      <PageHeader
        title="Liquidations"
        subtitle="Every oven in the protocol, sorted by risk. Liquidate undercollateralised ovens to burn their debt and claim collateral at a 32/31 (~3.2%) bonus."
      />

      {isLoading || !stats ? (
        <Loading label="Scanning all ovens…" />
      ) : (
        <>
          <MarketContextBanner />

          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={6}>
            <StatCard
              label="Open ovens"
              value={counts.total}
              info="Active ovens that currently carry ctez debt (ovens with no debt can't be liquidated)."
            />
            <StatCard
              label="Liquidatable now"
              value={counts.liquidatable}
              accent={counts.liquidatable > 0 ? 'red.400' : 'brand.300'}
              icon={<FiZap />}
              info="Ovens already below the ~106.67% threshold. Anyone can liquidate these right now for the collateral + 3.2% bonus."
            />
            <StatCard
              label="At risk"
              value={counts.risk}
              accent={counts.risk > 0 ? 'orange.300' : 'whiteAlpha.900'}
              icon={<FiShield />}
              info="Ovens still safe but within roughly one month of liquidation at the current drift if nothing changes."
            />
          </SimpleGrid>

          <HStack mb={5} spacing={2}>
            {FILTERS.map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={filter === f.key ? 'brand' : 'glass'}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
            {!pkh && (
              <Text fontSize="xs" color="whiteAlpha.500" pl={2}>
                Connect a wallet to liquidate.
              </Text>
            )}
          </HStack>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<FiShield />}
              title={filter === 'liquidatable' ? 'No liquidatable ovens' : 'Nothing here'}
              description={
                filter === 'liquidatable'
                  ? 'Every oven is currently above the liquidation threshold. Check back as the target drifts.'
                  : 'No ovens match this filter right now.'
              }
            />
          ) : (
            <VStack align="stretch" spacing={3}>
              {filtered.map((r) => (
                <OvenRow
                  key={r.o.value.address}
                  oven={r.o}
                  m={r.m}
                  market={market}
                  canLiquidate={!!pkh}
                  onLiquidate={setTarget}
                />
              ))}
              {(filter === 'all' ? rows.length : filtered.length) > MAX_ROWS && (
                <Text fontSize="xs" color="whiteAlpha.400" textAlign="center" pt={2}>
                  Showing the {MAX_ROWS} riskiest ovens.
                </Text>
              )}
            </VStack>
          )}
        </>
      )}

      <LiquidateModal
        isOpen={!!target}
        onClose={() => setTarget(null)}
        oven={target}
        rawTarget={rawTarget}
        rawDrift={rawDrift}
      />
    </Box>
  );
}
