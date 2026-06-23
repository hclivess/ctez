import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Progress,
  SimpleGrid,
  Text,
  Tooltip,
  VStack,
  Wrap,
} from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';
import { AllOvenDatum } from '../../interfaces';
import { computeOvenMetrics, ovenHealth } from '../../lib/oven';
import { type MarketContext } from '../../lib/market';
import { fmt } from '../../lib/format';
import { GlassCard, AddressChip, Pill, LabelWithInfo } from '../ui';
import type { OvenAction } from './OvenActionModal';

function Metric({
  label,
  value,
  sub,
  info,
}: {
  label: string;
  value: string;
  sub?: string;
  info?: string;
}) {
  return (
    <Box>
      <LabelWithInfo label={label} info={info} color="whiteAlpha.500" fontSize="xs" />
      <Text fontWeight={700} fontSize="md">
        {value}
      </Text>
      {sub && (
        <Text fontSize="2xs" color="whiteAlpha.400">
          {sub}
        </Text>
      )}
    </Box>
  );
}

export default function OvenCard({
  oven,
  rawTarget,
  rawDrift,
  market,
  onAction,
}: {
  oven: AllOvenDatum;
  rawTarget: number;
  rawDrift: number;
  market: MarketContext;
  onAction: (oven: AllOvenDatum, action: OvenAction) => void;
}) {
  const m = computeOvenMetrics(oven.value.tez_balance, oven.value.ctez_outstanding, rawTarget, rawDrift);
  const repayAllCost = m.ctezOutstanding * market.marketPrice;
  const health = ovenHealth(m.collateralRatioPct);
  const ratioStr = Number.isFinite(m.collateralRatioPct) ? `${fmt(m.collateralRatioPct, 1)}%` : '∞';

  return (
    <GlassCard p={5}>
      <Flex justify="space-between" align="start" mb={4}>
        <HStack spacing={3} align="center">
          <Flex
            boxSize={10}
            borderRadius="xl"
            bgGradient="linear(135deg, brand.400, tez.500)"
            align="center"
            justify="center"
            color="#04130d"
            fontWeight={800}
          >
            #{oven.key.id}
          </Flex>
          <Box>
            <Text fontWeight={700} lineHeight={1}>
              Oven #{oven.key.id}
            </Text>
            <Box mt={1}>
              <AddressChip address={oven.value.address} />
            </Box>
          </Box>
        </HStack>
        <VStack align="end" spacing={1}>
          <Pill color={health.color} bg="whiteAlpha.100">
            {m.atRisk && <Box as={FiAlertTriangle} display="inline" mr={1} mb="-2px" />}
            {health.label}
          </Pill>
          <Tooltip
            label="Collateral ratio = tez collateral ÷ debt valued at the target price. Liquidation happens below ~106.67%. Higher is safer."
            placement="top"
            hasArrow
            maxW="280px"
          >
            <Text fontSize="xs" color="whiteAlpha.500" cursor="help">
              ratio {ratioStr}
            </Text>
          </Tooltip>
        </VStack>
      </Flex>

      <SimpleGrid columns={2} spacingY={4} spacingX={3} mb={4}>
        <Metric
          label="Collateral"
          value={`${fmt(m.tez, 4)} tez`}
          info="The tez locked in this oven, backing your ctez debt."
        />
        <Metric
          label="Outstanding"
          value={`${fmt(m.ctezOutstanding, 4)} ctez`}
          info="The ctez you've minted from this oven — your debt. Repay (burn) it to free up collateral."
        />
        <Metric
          label="Mintable headroom"
          value={`${fmt(m.remainingMintable, 4)} ctez`}
          info="Additional ctez you can still mint against this collateral before hitting the limit."
        />
        <Metric
          label="Liquidation target"
          value={Number.isFinite(m.liquidationTarget) ? fmt(m.liquidationTarget, 6) : '—'}
          sub={`current ${fmt(m.currentTarget, 6)} tez/ctez`}
          info="If the target price rises to this level (it drifts upward over time), this oven becomes liquidatable at its current collateral and debt. The bigger the gap above the current target, the safer."
        />
      </SimpleGrid>

      <Box mb={4}>
        <HStack justify="space-between" mb={1.5}>
          <LabelWithInfo
            label="Mint utilization"
            info="How much of your maximum mintable ctez you've already used. Above ~85% you're close to the limit and at higher liquidation risk."
            color="whiteAlpha.500"
            fontSize="xs"
          />
          <Text fontSize="xs" color="whiteAlpha.600">
            {fmt(m.utilizationPct, 0)}%
          </Text>
        </HStack>
        <Progress
          value={m.utilizationPct}
          size="sm"
          borderRadius="full"
          bg="whiteAlpha.100"
          sx={{
            '& > div': {
              background:
                m.utilizationPct > 85
                  ? 'linear-gradient(90deg,#f97316,#ef4444)'
                  : 'linear-gradient(90deg,#2bdcab,#2a7cf6)',
            },
          }}
        />
      </Box>

      {m.ctezOutstanding > 0 && (
        <HStack
          justify="space-between"
          mb={4}
          px={3}
          py={2}
          borderRadius="lg"
          bg="whiteAlpha.50"
          fontSize="xs"
        >
          <LabelWithInfo
            label="Repay all"
            info="Approx. tez to buy back and burn your entire ctez debt at the current market price (ignores swap slippage). It's cheap when ctez trades below its target peg."
            color="whiteAlpha.500"
            fontSize="xs"
          />
          <Text fontWeight={600}>
            ≈ {fmt(repayAllCost, 4)} tez{' '}
            <Box as="span" color={market.repayFavored ? 'brand.300' : 'whiteAlpha.500'} fontWeight={700}>
              {market.repayFavored ? '· cheap now' : '· pricey now'}
            </Box>
          </Text>
        </HStack>
      )}

      <Divider borderColor="whiteAlpha.100" mb={4} />

      <Wrap spacing={2}>
        <Button size="sm" variant="brand" onClick={() => onAction(oven, 'deposit')}>
          Deposit
        </Button>
        <Button size="sm" variant="glass" onClick={() => onAction(oven, 'withdraw')}>
          Withdraw
        </Button>
        <Button size="sm" variant="glass" onClick={() => onAction(oven, 'mint')}>
          Mint
        </Button>
        <Button size="sm" variant="glass" onClick={() => onAction(oven, 'burn')}>
          Repay
        </Button>
        <Button size="sm" variant="ghostline" onClick={() => onAction(oven, 'delegate')}>
          Delegate
        </Button>
      </Wrap>
    </GlassCard>
  );
}
