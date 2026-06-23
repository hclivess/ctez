import { useState } from 'react';
import { Box, Button, HStack } from '@chakra-ui/react';
import { PageHeader } from '../components/ui';
import Swap from '../components/trade/Swap';
import Liquidity from '../components/trade/Liquidity';

export default function Trade() {
  const [tab, setTab] = useState<'swap' | 'liquidity'>('swap');
  return (
    <Box>
      <PageHeader title="Trade" subtitle="Swap tez and ctez, or provide liquidity to the CFMM." />
      <HStack justify="center" mb={6} spacing={2}>
        {(['swap', 'liquidity'] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? 'brand' : 'glass'}
            onClick={() => setTab(t)}
            textTransform="capitalize"
            px={6}
          >
            {t}
          </Button>
        ))}
      </HStack>
      {tab === 'swap' ? <Swap /> : <Liquidity />}
    </Box>
  );
}
