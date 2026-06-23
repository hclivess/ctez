import { Box, Button, Flex, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { FiZap } from 'react-icons/fi';
import { AllOvenDatum } from '../../interfaces';
import { ovenHealth, isLiquidatable, type OvenMetrics } from '../../lib/oven';
import { type MarketContext, liquidationProfit } from '../../lib/market';
import { GlassCard, AddressChip, Pill } from '../ui';
import { fmt } from '../../lib/format';

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box>
      <Text fontSize="2xs" color="whiteAlpha.500">
        {label}
      </Text>
      <Text fontWeight={700} fontSize="sm" color={color}>
        {value}
      </Text>
    </Box>
  );
}

export default function OvenRow({
  oven,
  m,
  market,
  canLiquidate,
  onLiquidate,
}: {
  oven: AllOvenDatum;
  m: OvenMetrics;
  market: MarketContext;
  canLiquidate: boolean;
  onLiquidate: (o: AllOvenDatum) => void;
}) {
  const liq = isLiquidatable(m);
  const health = ovenHealth(m.collateralRatioPct);
  const ratioStr = Number.isFinite(m.collateralRatioPct) ? `${fmt(m.collateralRatioPct, 1)}%` : '∞';

  const maxByCollateral = market.targetNorm > 0 ? m.tez / (market.targetNorm * (32 / 31)) : 0;
  const maxQ = Math.max(Math.min(m.ctezOutstanding, maxByCollateral), 0);
  const reward = maxQ * market.targetNorm * (32 / 31);
  const profit = liquidationProfit(maxQ, market.targetNorm, market.marketPrice);

  return (
    <GlassCard p={4}>
      <Flex direction={{ base: 'column', md: 'row' }} align={{ md: 'center' }} gap={3}>
        <HStack flex="0 0 auto" minW="130px" spacing={3}>
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
            #{oven.key.id}
          </Flex>
          <AddressChip address={oven.key.owner} />
        </HStack>

        <SimpleGrid columns={{ base: 3, md: 4 }} flex={1} spacing={3} w="100%">
          <Cell label="Collateral" value={`${fmt(m.tez, 2)} ꜩ`} />
          <Cell label="Debt" value={fmt(m.ctezOutstanding, 2)} />
          <Cell label="Ratio" value={ratioStr} color={health.color} />
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
            onClick={() => onLiquidate(oven)}
            isDisabled={!liq || !canLiquidate}
          >
            Liquidate
          </Button>
        </Box>
      </Flex>

      {liq && (
        <Flex
          mt={3}
          pt={3}
          borderTop="1px solid rgba(255,255,255,0.06)"
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={2}
          fontSize="xs"
        >
          <Text color="whiteAlpha.600">
            Burn up to <b>{fmt(maxQ, 2)} ctez</b> → receive ≈ <b>{fmt(reward, 2)} tez</b> (incl. 3.2% bonus)
          </Text>
          <Text color={profit >= 0 ? 'brand.300' : 'orange.300'} fontWeight={600}>
            {profit >= 0 ? 'Profit' : 'Net cost'} ≈ {fmt(Math.abs(profit), 2)} tez
            <Box as="span" color="whiteAlpha.500" fontWeight={400}>
              {' '}
              if you buy the ctez at market
            </Box>
          </Text>
        </Flex>
      )}
    </GlassCard>
  );
}
