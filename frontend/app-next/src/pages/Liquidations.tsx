import { useMemo, useState } from 'react';
import { Box, Button, Flex, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { FiZap, FiShield } from 'react-icons/fi';
import { useWallet } from '../wallet/WalletProvider';
import { useAllOvens, useBaseStats } from '../hooks/queries';
import {
  PageHeader,
  Loading,
  EmptyState,
  StatCard,
  GlassCard,
  AddressChip,
  Pill,
  LabelWithInfo,
} from '../components/ui';
import { computeOvenMetrics, ovenHealth, isLiquidatable, type OvenMetrics } from '../lib/oven';
import LiquidateModal from '../components/ovens/LiquidateModal';
import { AllOvenDatum } from '../interfaces';
import { fmt } from '../lib/format';

type Filter = 'liquidatable' | 'risk' | 'all';
const MAX_ROWS = 100;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'liquidatable', label: 'Liquidatable' },
  { key: 'risk', label: 'At risk' },
  { key: 'all', label: 'All' },
];

function Row({
  data,
  canLiquidate,
  onLiquidate,
}: {
  data: { o: AllOvenDatum; m: OvenMetrics; liq: boolean };
  canLiquidate: boolean;
  onLiquidate: (o: AllOvenDatum) => void;
}) {
  const { o, m, liq } = data;
  const health = ovenHealth(m.collateralRatioPct);
  const ratioStr = Number.isFinite(m.collateralRatioPct) ? `${fmt(m.collateralRatioPct, 1)}%` : '∞';
  return (
    <GlassCard p={4}>
      <Flex direction={{ base: 'column', md: 'row' }} align={{ md: 'center' }} gap={3}>
        <HStack flex="0 0 auto" minW="120px" spacing={3}>
          <Flex
            boxSize={9}
            borderRadius="lg"
            bgGradient={liq ? 'linear(135deg, #f97316, #ef4444)' : 'linear(135deg, brand.400, tez.500)'}
            align="center"
            justify="center"
            color="#04130d"
            fontWeight={800}
            fontSize="sm"
          >
            #{o.key.id}
          </Flex>
          <AddressChip address={o.key.owner} />
        </HStack>

        <SimpleGrid columns={{ base: 3, md: 4 }} flex={1} spacing={3} w="100%">
          <Box>
            <Text fontSize="2xs" color="whiteAlpha.500">
              Collateral
            </Text>
            <Text fontWeight={700} fontSize="sm">
              {fmt(m.tez, 2)} ꜩ
            </Text>
          </Box>
          <Box>
            <Text fontSize="2xs" color="whiteAlpha.500">
              Debt
            </Text>
            <Text fontWeight={700} fontSize="sm">
              {fmt(m.ctezOutstanding, 2)}
            </Text>
          </Box>
          <Box>
            <Text fontSize="2xs" color="whiteAlpha.500">
              Ratio
            </Text>
            <Text fontWeight={700} fontSize="sm" color={health.color}>
              {ratioStr}
            </Text>
          </Box>
          <Box display={{ base: 'none', md: 'block' }}>
            <Text fontSize="2xs" color="whiteAlpha.500">
              Status
            </Text>
            <Pill color={health.color} bg="whiteAlpha.100">
              {liq ? 'Liquidatable' : health.label}
            </Pill>
          </Box>
        </SimpleGrid>

        <Box flex="0 0 auto">
          <Button
            size="sm"
            variant={liq ? 'brand' : 'ghostline'}
            leftIcon={<FiZap />}
            onClick={() => onLiquidate(o)}
            isDisabled={!liq || !canLiquidate}
          >
            Liquidate
          </Button>
        </Box>
      </Flex>
    </GlassCard>
  );
}

export default function Liquidations() {
  const { pkh } = useWallet();
  const { data: stats } = useBaseStats();
  const { data: allOvens, isLoading } = useAllOvens();
  const [filter, setFilter] = useState<Filter>('liquidatable');
  const [target, setTarget] = useState<AllOvenDatum | null>(null);

  const rawTarget = stats?.originalTarget ?? 0;
  const rawDrift = stats?.drift ?? 0;

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
              info="Ovens already below the ~106.67% threshold. Anyone can liquidate these right now."
            />
            <StatCard
              label="At risk"
              value={counts.risk}
              accent={counts.risk > 0 ? 'orange.300' : 'whiteAlpha.900'}
              icon={<FiShield />}
              info="Ovens still solvent but within roughly one month of liquidation at the current drift if nothing changes."
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
                <Row
                  key={r.o.value.address}
                  data={r}
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
