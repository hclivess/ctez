import { useMemo, useState } from 'react';
import { Box, Button, SimpleGrid } from '@chakra-ui/react';
import { FiPlus, FiLayers } from 'react-icons/fi';
import { useWallet } from '../wallet/WalletProvider';
import { useBaseStats, useUserOvens } from '../hooks/queries';
import { PageHeader, Loading, EmptyState, StatCard } from '../components/ui';
import OvenCard from '../components/ovens/OvenCard';
import OvenActionModal, { type OvenAction } from '../components/ovens/OvenActionModal';
import CreateOvenModal from '../components/ovens/CreateOvenModal';
import ConnectButton from '../components/layout/ConnectButton';
import { AllOvenDatum } from '../interfaces';
import { fmt } from '../lib/format';

export default function Ovens() {
  const { pkh } = useWallet();
  const { data: stats } = useBaseStats();
  const { data: ovens, isLoading } = useUserOvens(pkh);
  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<{ oven: AllOvenDatum; action: OvenAction } | null>(null);

  const rawTarget = stats?.originalTarget ?? 0;
  const rawDrift = stats?.drift ?? 0;

  const totals = useMemo(() => {
    const list = ovens ?? [];
    return {
      count: list.length,
      tez: list.reduce((a, o) => a + Number(o.value.tez_balance) / 1e6, 0),
      ctez: list.reduce((a, o) => a + Number(o.value.ctez_outstanding) / 1e6, 0),
    };
  }, [ovens]);

  return (
    <Box>
      <PageHeader
        title="Ovens"
        subtitle="Open ovens, deposit tez collateral, and mint ctez against it."
        actions={
          pkh ? (
            <Button variant="brand" leftIcon={<FiPlus />} onClick={() => setCreateOpen(true)}>
              Create oven
            </Button>
          ) : undefined
        }
      />

      {!pkh ? (
        <EmptyState
          icon={<FiLayers />}
          title="Connect your wallet"
          description="Connect a Tezos wallet to view, create, and manage your ovens."
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
                onAction={(o, action) => setActive({ oven: o, action })}
              />
            ))}
          </SimpleGrid>
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
    </Box>
  );
}
