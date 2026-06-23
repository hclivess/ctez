import { useMemo, useState } from 'react';
import { Box, Divider, HStack, Icon, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { FiArrowDownCircle, FiRepeat, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { useBaseStats, useCfmmStorage } from '../../hooks/queries';
import { AmountInput, GlassCard, LabelWithInfo, Loading } from '../ui';
import { fmt } from '../../lib/format';

/**
 * Compares two ways to raise tez from an oven:
 *  A) withdraw collateral directly, or
 *  B) mint ctez and sell it on the CFMM (slippage included).
 * The fair metric is "oven liquidation buffer consumed per tez raised".
 */
function Outcome({
  icon,
  title,
  highlight,
  rows,
  footer,
}: {
  icon: any;
  title: string;
  highlight?: boolean;
  rows: { label: string; info?: string; value: string; color?: string }[];
  footer?: string;
}) {
  return (
    <GlassCard
      p={5}
      borderColor={highlight ? 'rgba(43,220,171,0.4)' : undefined}
      bg={highlight ? 'rgba(43,220,171,0.06)' : undefined}
    >
      <HStack mb={3} spacing={2}>
        <Icon as={icon} color={highlight ? 'brand.300' : 'whiteAlpha.600'} />
        <Text fontWeight={700}>{title}</Text>
        {highlight && (
          <Box ml="auto" fontSize="2xs" fontWeight={800} color="brand.300" textTransform="uppercase">
            better
          </Box>
        )}
      </HStack>
      <VStack align="stretch" spacing={2.5}>
        {rows.map((r) => (
          <HStack key={r.label} justify="space-between" align="center">
            <LabelWithInfo label={r.label} info={r.info} color="whiteAlpha.500" fontSize="sm" />
            <Text fontWeight={700} fontSize="sm" color={r.color}>
              {r.value}
            </Text>
          </HStack>
        ))}
      </VStack>
      {footer && (
        <Text mt={3} fontSize="xs" color="whiteAlpha.500">
          {footer}
        </Text>
      )}
    </GlassCard>
  );
}

export default function RaiseTezCalculator() {
  const { data: cfmm } = useCfmmStorage();
  const { data: stats } = useBaseStats();
  const [amount, setAmount] = useState('');

  const calc = useMemo(() => {
    if (!cfmm || !stats) return null;
    const X = Number(amount) || 0;
    if (X <= 0) return null;

    const cash = cfmm.cashPool.toNumber(); // tez pool (mutez)
    const token = cfmm.tokenPool.toNumber(); // ctez pool (mutez)
    const targetNorm = Number(stats.currentTarget); // tez per ctez
    const spot = token > 0 ? cash / token : 0;
    const Xm = X * 1e6;

    // Can't pull more tez than (most of) the pool holds.
    const feasible = Xm < cash * 0.98;

    let mintCtez = 0;
    let effPrice = 0;
    let impact = 0;
    let bufferB = 0;
    if (feasible) {
      // invert ctez->tez CFMM (0.05% fee) to find ctez needed to net X tez
      const Mm = (Xm * token * 10000) / (9995 * (cash - Xm));
      mintCtez = Mm / 1e6;
      effPrice = mintCtez > 0 ? X / mintCtez : 0;
      impact = spot > 0 ? (1 - effPrice / spot) * 100 : 0;
      bufferB = mintCtez * targetNorm * (16 / 15);
    }
    const bufferA = X; // withdrawing X tez consumes X tez of buffer
    const savingsPct = bufferA > 0 ? ((bufferA - bufferB) / bufferA) * 100 : 0;
    const mintWins = feasible && bufferB < bufferA;

    return { X, feasible, mintCtez, effPrice, impact, bufferA, bufferB, savingsPct, spot, mintWins };
  }, [cfmm, stats, amount]);

  if (!cfmm || !stats) return <Loading label="Loading pool…" />;

  return (
    <GlassCard p={6} maxW="640px" mx="auto">
      <Text fontWeight={700} fontSize="lg">
        Raise tez: withdraw vs mint &amp; sell
      </Text>
      <Text fontSize="sm" color="whiteAlpha.600" mt={1} mb={5}>
        See which is more efficient for the amount you need. The fair comparison is how much oven
        liquidation buffer each method burns — minting &amp; selling wins while ctez trades above target,
        but only until pool slippage eats the premium.
      </Text>

      <AmountInput
        token="tez"
        value={amount}
        onChange={setAmount}
        balanceLabel="Tez you want to raise"
      />

      {calc && (
        <Box mt={5}>
          {!calc.feasible ? (
            <GlassCard p={4} bg="rgba(249,115,22,0.08)" borderColor="rgba(249,115,22,0.25)">
              <HStack spacing={2}>
                <Icon as={FiAlertTriangle} color="orange.300" />
                <Text fontSize="sm" color="whiteAlpha.800">
                  That's too large for the CFMM pool (~{fmt((cfmm.cashPool.toNumber() / 1e6), 0)} tez).
                  A swap that big would drain it — <b>withdraw collateral</b> instead.
                </Text>
              </HStack>
            </GlassCard>
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Outcome
                  icon={FiArrowDownCircle}
                  title="Withdraw collateral"
                  highlight={!calc.mintWins}
                  rows={[
                    { label: 'Tez raised', value: `${fmt(calc.X, 4)} ꜩ`, color: 'tez.400' },
                    {
                      label: 'Buffer used',
                      info: 'Oven liquidation buffer consumed — withdrawing X tez removes exactly X tez of buffer.',
                      value: `${fmt(calc.bufferA, 4)} ꜩ`,
                    },
                    { label: 'New debt', value: 'none', color: 'brand.300' },
                  ]}
                  footer="Clean exit — no ctez to repay later."
                />
                <Outcome
                  icon={FiRepeat}
                  title="Mint ctez & sell"
                  highlight={calc.mintWins}
                  rows={[
                    { label: 'Tez raised', value: `${fmt(calc.X, 4)} ꜩ`, color: 'tez.400' },
                    {
                      label: 'ctez to mint',
                      info: 'You mint this much ctez and immediately swap it to tez on the CFMM.',
                      value: `${fmt(calc.mintCtez, 4)}`,
                    },
                    {
                      label: 'Buffer used',
                      info: 'Minting M ctez consumes M × target × 16/15 tez of buffer.',
                      value: `${fmt(calc.bufferB, 4)} ꜩ`,
                    },
                    {
                      label: 'Price impact',
                      info: 'How far the thin pool moves the price against you on this sale. High impact erodes the advantage.',
                      value: `${fmt(calc.impact, 2)}%`,
                      color: calc.impact > 5 ? 'orange.300' : undefined,
                    },
                    { label: 'New debt', value: `+${fmt(calc.mintCtez, 4)} ctez`, color: 'orange.300' },
                  ]}
                  footer={`Effective sale price ${fmt(calc.effPrice, 4)} ꜩ/ctez (spot ${fmt(calc.spot, 4)}).`}
                />
              </SimpleGrid>

              <GlassCard
                mt={4}
                p={4}
                bg={calc.mintWins ? 'rgba(43,220,171,0.07)' : 'rgba(255,255,255,0.03)'}
              >
                <HStack spacing={2} align="start">
                  <Icon
                    as={calc.mintWins ? FiCheckCircle : FiArrowDownCircle}
                    color={calc.mintWins ? 'brand.300' : 'whiteAlpha.600'}
                    mt="2px"
                  />
                  <Text fontSize="sm" color="whiteAlpha.800">
                    {calc.mintWins ? (
                      <>
                        <b>Mint &amp; sell wins</b> for {fmt(calc.X, 2)} tez — it burns{' '}
                        <b>{fmt(calc.savingsPct, 1)}% less</b> oven buffer ({fmt(calc.bufferB, 2)} vs{' '}
                        {fmt(calc.bufferA, 2)} ꜩ). The trade-off: you take on {fmt(calc.mintCtez, 2)} ctez
                        of debt to repay later.
                      </>
                    ) : (
                      <>
                        <b>Withdraw wins</b> for {fmt(calc.X, 2)} tez — at this size, slippage drops your
                        effective price to {fmt(calc.effPrice, 4)} ꜩ/ctez, so mint &amp; sell would burn{' '}
                        <b>{fmt(-calc.savingsPct, 1)}% more</b> buffer ({fmt(calc.bufferB, 2)} vs{' '}
                        {fmt(calc.bufferA, 2)} ꜩ) and leave you with debt.
                      </>
                    )}
                  </Text>
                </HStack>
              </GlassCard>
            </>
          )}
        </Box>
      )}
    </GlassCard>
  );
}
