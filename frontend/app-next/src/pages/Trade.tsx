import { useState } from 'react';
import { Box, Button, HStack } from '@chakra-ui/react';
import { PageHeader } from '../components/ui';
import Swap from '../components/trade/Swap';
import Liquidity from '../components/trade/Liquidity';
import RaiseTezCalculator from '../components/trade/RaiseTezCalculator';

const TABS = [
  { key: 'swap', label: 'Swap' },
  { key: 'liquidity', label: 'Liquidity' },
  { key: 'calculator', label: 'Calculator' },
] as const;
type Tab = (typeof TABS)[number]['key'];

export default function Trade() {
  const [tab, setTab] = useState<Tab>('swap');
  return (
    <Box>
      <PageHeader
        title="Trade"
        subtitle="Swap tez and ctez, provide liquidity, or compare ways to raise tez."
      />
      <HStack justify="center" mb={6} spacing={2}>
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'brand' : 'glass'}
            onClick={() => setTab(t.key)}
            px={6}
          >
            {t.label}
          </Button>
        ))}
      </HStack>
      {tab === 'swap' && <Swap />}
      {tab === 'liquidity' && <Liquidity />}
      {tab === 'calculator' && <RaiseTezCalculator />}
    </Box>
  );
}
