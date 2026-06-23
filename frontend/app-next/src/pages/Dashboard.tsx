import { Box, Button, Flex, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiArrowUpRight, FiTrendingUp, FiTarget, FiDroplet, FiActivity } from 'react-icons/fi';
import { useWallet } from '../wallet/WalletProvider';
import { useBaseStats, useUserBalance, useUserOvens } from '../hooks/queries';
import { GlassCard, Loading, PageHeader, StatCard } from '../components/ui';
import ConnectButton from '../components/layout/ConnectButton';
import { fmt, fmtCompact } from '../lib/format';

function Hero() {
  return (
    <GlassCard
      p={{ base: 6, md: 8 }}
      mb={6}
      bgGradient="linear(135deg, rgba(43,220,171,0.10), rgba(42,124,246,0.06))"
    >
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ md: 'center' }} gap={6}>
        <Box maxW="2xl">
          <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight={800} letterSpacing="-0.02em">
            Your portal to ctez
          </Text>
          <Text mt={2} color="whiteAlpha.700">
            ctez is a tez derivative backed by tez. Lock collateral in an oven, mint ctez, and trade it
            on the CFMM — all non-custodial, straight from your wallet.
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button as={RouterLink} to="/ovens" variant="brand" rightIcon={<FiArrowUpRight />}>
            Open an oven
          </Button>
          <Button as={RouterLink} to="/trade" variant="glass">
            Trade
          </Button>
        </HStack>
      </Flex>
    </GlassCard>
  );
}

function Position() {
  const { pkh } = useWallet();
  const { data: balance } = useUserBalance(pkh);
  const { data: ovens } = useUserOvens(pkh);

  if (!pkh) {
    return (
      <GlassCard p={8}>
        <VStack spacing={3} textAlign="center">
          <Text fontWeight={700} fontSize="lg">
            Connect to see your position
          </Text>
          <Text color="whiteAlpha.600" fontSize="sm" maxW="md">
            Track your tez and ctez balances, collateral locked in ovens, and outstanding debt.
          </Text>
          <Box pt={1}>
            <ConnectButton />
          </Box>
        </VStack>
      </GlassCard>
    );
  }

  return (
    <Box>
      <Text fontSize="sm" fontWeight={700} color="whiteAlpha.700" mb={3} textTransform="uppercase" letterSpacing="0.06em">
        Your position
      </Text>
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <StatCard label="Wallet tez" value={fmt(balance?.xtz, 4)} accent="tez.400" />
        <StatCard label="Wallet ctez" value={fmt(balance?.ctez, 4)} accent="brand.300" />
        <StatCard label="Tez in ovens" value={fmt(balance?.tezInOvens, 4)} />
        <StatCard label="Ovens" value={ovens?.length ?? 0} />
      </SimpleGrid>
    </Box>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useBaseStats();
  const premium = Number(stats?.premium ?? 0);

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="ctez protocol overview and your position." />
      <Hero />

      {isLoading || !stats ? (
        <Loading label="Reading on-chain state…" />
      ) : (
        <VStack align="stretch" spacing={8}>
          <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} spacing={4}>
            <StatCard
              label="Target price"
              value={fmt(stats.currentTarget, 6)}
              sub="tez per ctez"
              icon={<FiTarget />}
            />
            <StatCard
              label="Market price"
              value={fmt(stats.currentPrice, 6)}
              sub="CFMM tez per ctez"
              icon={<FiActivity />}
            />
            <StatCard
              label="Premium"
              value={`${premium >= 0 ? '+' : ''}${fmt(premium, 2)}%`}
              sub="market vs target"
              accent={premium >= 0 ? 'brand.300' : 'orange.300'}
              icon={<FiTrendingUp />}
            />
            <StatCard
              label="Annual drift"
              value={`${Number(stats.currentAnnualDrift) >= 0 ? '+' : ''}${fmt(stats.currentAnnualDrift, 2)}%`}
              sub="current annualised"
            />
            <StatCard
              label="CFMM liquidity"
              value={`${fmtCompact(stats.totalLiquidity)} ꜩ`}
              sub="total value"
              icon={<FiDroplet />}
            />
          </SimpleGrid>

          <Position />
        </VStack>
      )}
    </Box>
  );
}
