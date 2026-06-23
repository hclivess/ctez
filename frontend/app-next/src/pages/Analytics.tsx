import { useState } from 'react';
import { Box, Button, HStack, SimpleGrid, VStack } from '@chakra-ui/react';
import { useCtezHistory } from '../hooks/queries';
import { PageHeader, Loading, EmptyState } from '../components/ui';
import { ChartCard, PriceTargetChart, SeriesChart } from '../components/charts';
import MarketContextBanner from '../components/market/MarketContextBanner';
import { FiBarChart2 } from 'react-icons/fi';

const RANGES = [
  { d: 7, l: '7D' },
  { d: 30, l: '30D' },
  { d: 90, l: '90D' },
];

export default function Analytics() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useCtezHistory(days);

  return (
    <Box>
      <PageHeader
        title="Analytics"
        subtitle="ctez target vs market price and protocol stats over time, sampled on-chain from TzKT."
        actions={
          <HStack spacing={1}>
            {RANGES.map((r) => (
              <Button
                key={r.d}
                size="sm"
                variant={days === r.d ? 'brand' : 'glass'}
                onClick={() => setDays(r.d)}
              >
                {r.l}
              </Button>
            ))}
          </HStack>
        }
      />

      <MarketContextBanner />

      {isLoading ? (
        <Loading label="Sampling on-chain history…" />
      ) : isError || !data || data.length === 0 ? (
        <EmptyState
          icon={<FiBarChart2 />}
          title="Couldn't load history"
          description="The on-chain history could not be fetched right now. Try again in a moment."
        />
      ) : (
        <VStack align="stretch" spacing={5}>
          <ChartCard title="Target vs market price" subtitle="tez per ctez — the protocol peg vs the live CFMM price">
            <PriceTargetChart data={data} />
          </ChartCard>

          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={5}>
            <ChartCard title="Premium" subtitle="market vs target (%)">
              <SeriesChart data={data} dataKey="premium" color="#f0b429" name="Premium" unit="%" dp={2} />
            </ChartCard>
            <ChartCard title="Annualised drift" subtitle="rate the target is moving (%)">
              <SeriesChart data={data} dataKey="annualDrift" color="#9f7aea" name="Drift" unit="%" dp={2} />
            </ChartCard>
            <ChartCard title="CFMM liquidity" subtitle="total value in the pool (tez)">
              <SeriesChart data={data} dataKey="tvl" color="#2bdcab" name="Liquidity" unit="ꜩ" dp={0} area />
            </ChartCard>
          </SimpleGrid>
        </VStack>
      )}
    </Box>
  );
}
