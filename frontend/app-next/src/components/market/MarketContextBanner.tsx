import { Box, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { FiTrendingUp, FiTrendingDown, FiZap } from 'react-icons/fi';
import { useBaseStats } from '../../hooks/queries';
import { marketContext } from '../../lib/market';
import { GlassCard } from '../ui';
import { fmt } from '../../lib/format';

function Hint({ icon, color, children }: { icon: any; color: string; children: React.ReactNode }) {
  return (
    <HStack align="start" spacing={2.5} fontSize="sm">
      <Box color={color} mt="2px" flexShrink={0}>
        <Icon as={icon} />
      </Box>
      <Text color="whiteAlpha.700">{children}</Text>
    </HStack>
  );
}

export default function MarketContextBanner() {
  const { data: stats } = useBaseStats();
  if (!stats) return null;

  const target = Number(stats.currentTarget);
  const price = Number(stats.currentPrice);
  const mc = marketContext(target, price);
  const above = mc.premiumPct >= 0;

  return (
    <GlassCard
      p={5}
      mb={6}
      bgGradient={
        above
          ? 'linear(135deg, rgba(43,220,171,0.08), rgba(42,124,246,0.05))'
          : 'linear(135deg, rgba(249,115,22,0.08), rgba(239,68,68,0.05))'
      }
    >
      <HStack mb={3} spacing={2}>
        <Icon as={above ? FiTrendingUp : FiTrendingDown} color={above ? 'brand.300' : 'orange.300'} />
        <Text fontWeight={700}>
          ctez is trading{' '}
          <Box as="span" color={above ? 'brand.300' : 'orange.300'}>
            {above ? '+' : ''}
            {fmt(mc.premiumPct, 2)}%
          </Box>{' '}
          {above ? 'above' : 'below'} its target peg
        </Text>
      </HStack>

      <VStack align="stretch" spacing={2}>
        {mc.mintFavored ? (
          <Hint icon={FiTrendingUp} color="brand.300">
            <b>Minting & selling is favourable</b> — you can mint ctez and sell it above the peg
            ({fmt(price, 4)} vs target {fmt(target, 4)} tez). Repaying is relatively expensive: buying
            ctez to burn costs more than the debt's target value.
          </Hint>
        ) : (
          <Hint icon={FiTrendingDown} color="orange.300">
            <b>Repaying is cheap</b> — ctez trades below its target ({fmt(price, 4)} vs {fmt(target, 4)} tez),
            so you can buy it back cheaply to cancel debt. Minting & selling is less attractive right now.
          </Hint>
        )}
        <Hint icon={FiZap} color={mc.liquidationProfitable ? 'brand.300' : 'whiteAlpha.500'}>
          Liquidations pay a <b>3.2% bonus</b> over target. Buying ctez to liquidate is currently{' '}
          <b>{mc.liquidationProfitable ? 'profitable' : 'unprofitable'}</b> — breakeven{' '}
          {fmt(mc.liquidationBreakevenPrice, 4)} tez, market {fmt(price, 4)} tez. (If you already hold
          ctez, liquidating an undercollateralised oven always yields the bonus.)
        </Hint>
      </VStack>
    </GlassCard>
  );
}
