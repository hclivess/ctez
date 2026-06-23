import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiPlus, FiLayers, FiSearch } from 'react-icons/fi';
import { useWallet } from '../wallet/WalletProvider';
import { useBaseStats, useUserOvens, useAllOvens } from '../hooks/queries';
import { PageHeader, Loading, EmptyState, StatCard } from '../components/ui';
import OvenCard from '../components/ovens/OvenCard';
import OvenRow from '../components/ovens/OvenRow';
import OvenActionModal, { type OvenAction } from '../components/ovens/OvenActionModal';
import LiquidateModal from '../components/ovens/LiquidateModal';
import CreateOvenModal from '../components/ovens/CreateOvenModal';
import MarketContextBanner from '../components/market/MarketContextBanner';
import ConnectButton from '../components/layout/ConnectButton';
import { computeOvenMetrics } from '../lib/oven';
import { marketContext } from '../lib/market';
import { AllOvenDatum } from '../interfaces';
import { fmt } from '../lib/format';

type Tab = 'mine' | 'all';
const MAX_ALL = 80;

export default function Ovens() {
  const { pkh } = useWallet();
  const { data: stats } = useBaseStats();
  const { data: ovens, isLoading } = useUserOvens(pkh);
  const { data: allOvens, isLoading: allLoading } = useAllOvens();
  const [tab, setTab] = useState<Tab>('mine');
  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<{ oven: AllOvenDatum; action: OvenAction } | null>(null);
  const [liqTarget, setLiqTarget] = useState<AllOvenDatum | null>(null);
  const [search, setSearch] = useState('');

  const rawTarget = stats?.originalTarget ?? 0;
  const rawDrift = stats?.drift ?? 0;
  const market = marketContext(Number(stats?.currentTarget ?? 0), Number(stats?.currentPrice ?? 0));

  const totals = useMemo(() => {
    const list = ovens ?? [];
    return {
      count: list.length,
      tez: list.reduce((a, o) => a + Number(o.value.tez_balance) / 1e6, 0),
      ctez: list.reduce((a, o) => a + Number(o.value.ctez_outstanding) / 1e6, 0),
    };
  }, [ovens]);

  const allRows = useMemo(() => {
    if (!allOvens || !rawTarget) return [];
    let list = allOvens.filter((o) => o.active);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.key.owner.toLowerCase().includes(q) ||
          o.value.address.toLowerCase().includes(q) ||
          String(o.key.id) === q,
      );
    }
    return list
      .map((o) => ({ o, m: computeOvenMetrics(o.value.tez_balance, o.value.ctez_outstanding, rawTarget, rawDrift) }))
      .sort((a, b) => a.m.collateralRatioPct - b.m.collateralRatioPct);
  }, [allOvens, rawTarget, rawDrift, search]);

  return (
    <Box>
      <PageHeader
        title="Ovens"
        subtitle="Open ovens, deposit tez collateral, and mint ctez against it — or browse every oven in the protocol."
        actions={
          pkh ? (
            <Button variant="brand" leftIcon={<FiPlus />} onClick={() => setCreateOpen(true)}>
              Create oven
            </Button>
          ) : undefined
        }
      />

      <HStack mb={6} spacing={2}>
        <Button size="sm" variant={tab === 'mine' ? 'brand' : 'glass'} onClick={() => setTab('mine')}>
          My ovens{ovens?.length ? ` (${ovens.length})` : ''}
        </Button>
        <Button size="sm" variant={tab === 'all' ? 'brand' : 'glass'} onClick={() => setTab('all')}>
          All ovens
        </Button>
      </HStack>

      {stats && <MarketContextBanner />}

      {tab === 'mine' ? (
        !pkh ? (
          <EmptyState
            icon={<FiLayers />}
            title="Connect your wallet"
            description="Connect a Tezos wallet to view, create, and manage your ovens. You can still browse every oven under “All ovens”."
            action={<ConnectButton />}
          />
        ) : isLoading || !stats ? (
          <Loading label="Loading your ovens…" />
        ) : (ovens?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<FiLayers />}
            title="No ovens yet"
            description="Create your first oven to start collateralising tez and minting ctez."
            action={
              <Button variant="brand" leftIcon={<FiPlus />} onClick={() => setCreateOpen(true)}>
                Create oven
              </Button>
            }
          />
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={6}>
              <StatCard label="Your ovens" value={totals.count} />
              <StatCard label="Total collateral" value={`${fmt(totals.tez, 2)} tez`} accent="tez.400" />
              <StatCard label="Total outstanding" value={`${fmt(totals.ctez, 2)} ctez`} accent="brand.300" />
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
              {ovens!.map((oven) => (
                <OvenCard
                  key={oven.value.address}
                  oven={oven}
                  rawTarget={rawTarget}
                  rawDrift={rawDrift}
                  market={market}
                  onAction={(o, action) => setActive({ oven: o, action })}
                />
              ))}
            </SimpleGrid>
          </>
        )
      ) : allLoading || !stats ? (
        <Loading label="Loading all ovens…" />
      ) : (
        <>
          <InputGroup mb={5} maxW="420px">
            <InputLeftElement pointerEvents="none" color="whiteAlpha.400">
              <FiSearch />
            </InputLeftElement>
            <Input
              placeholder="Search by owner address or oven #"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg="rgba(0,0,0,0.25)"
              borderColor="whiteAlpha.200"
            />
          </InputGroup>
          {allRows.length === 0 ? (
            <EmptyState icon={<FiLayers />} title="No ovens found" description="Try a different search." />
          ) : (
            <VStack align="stretch" spacing={3}>
              {allRows.slice(0, MAX_ALL).map((r) => (
                <OvenRow
                  key={r.o.value.address}
                  oven={r.o}
                  m={r.m}
                  market={market}
                  canLiquidate={!!pkh}
                  onLiquidate={setLiqTarget}
                />
              ))}
              {allRows.length > MAX_ALL && (
                <Text fontSize="xs" color="whiteAlpha.400" textAlign="center" pt={2}>
                  Showing {MAX_ALL} of {allRows.length} ovens (riskiest first). Search to narrow down.
                </Text>
              )}
            </VStack>
          )}
        </>
      )}

      <CreateOvenModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <OvenActionModal
        isOpen={!!active}
        onClose={() => setActive(null)}
        oven={active?.oven ?? null}
        action={active?.action ?? 'deposit'}
        rawTarget={rawTarget}
        rawDrift={rawDrift}
      />
      <LiquidateModal
        isOpen={!!liqTarget}
        onClose={() => setLiqTarget(null)}
        oven={liqTarget}
        rawTarget={rawTarget}
        rawDrift={rawDrift}
      />
    </Box>
  );
}
