import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Progress,
  SimpleGrid,
  Text,
  VStack,
  Wrap,
} from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';
import { AllOvenDatum } from '../../interfaces';
import { computeOvenMetrics, ovenHealth } from '../../lib/oven';
import { fmt } from '../../lib/format';
import { GlassCard, AddressChip, Pill } from '../ui';
import type { OvenAction } from './OvenActionModal';

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Box>
      <Text fontSize="xs" color="whiteAlpha.500">
        {label}
      </Text>
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
  onAction,
}: {
  oven: AllOvenDatum;
  rawTarget: number;
  rawDrift: number;
  onAction: (oven: AllOvenDatum, action: OvenAction) => void;
}) {
  const m = computeOvenMetrics(oven.value.tez_balance, oven.value.ctez_outstanding, rawTarget, rawDrift);
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
          <Text fontSize="xs" color="whiteAlpha.500">
            ratio {ratioStr}
          </Text>
        </VStack>
      </Flex>

      <SimpleGrid columns={2} spacingY={4} spacingX={3} mb={4}>
        <Metric label="Collateral" value={`${fmt(m.tez, 4)} tez`} />
        <Metric label="Outstanding" value={`${fmt(m.ctezOutstanding, 4)} ctez`} />
        <Metric label="Mintable headroom" value={`${fmt(m.remainingMintable, 4)} ctez`} />
        <Metric
          label="Liquidation target"
          value={Number.isFinite(m.liquidationTarget) ? fmt(m.liquidationTarget, 6) : '—'}
          sub={`current ${fmt(m.currentTarget, 6)} tez/ctez`}
        />
      </SimpleGrid>

      <Box mb={4}>
        <HStack justify="space-between" mb={1.5}>
          <Text fontSize="xs" color="whiteAlpha.500">
            Mint utilization
          </Text>
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
