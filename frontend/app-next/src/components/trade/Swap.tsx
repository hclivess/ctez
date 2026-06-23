import { useMemo, useState } from 'react';
import { Box, Button, Center, Flex, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { FiArrowDown } from 'react-icons/fi';
import { useWallet } from '../../wallet/WalletProvider';
import { useCfmmStorage, useUserBalance } from '../../hooks/queries';
import { cashToToken, tokenToCash } from '../../contracts/cfmm';
import { useTx } from '../../lib/tx';
import { AmountInput, GlassCard } from '../ui';
import ConnectButton from '../layout/ConnectButton';
import { fmt } from '../../lib/format';
import { DEFAULT_DEADLINE, DEFAULT_SLIPPAGE } from '../../utils/globals';

type Dir = 'tezToCtez' | 'ctezToTez';
const SLIPPAGES = [0.5, 1, 2];

export default function Swap() {
  const { pkh } = useWallet();
  const { data: cfmm } = useCfmmStorage();
  const { data: balance } = useUserBalance(pkh);
  const runTx = useTx();
  const [dir, setDir] = useState<Dir>('tezToCtez');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [busy, setBusy] = useState(false);

  const inToken = dir === 'tezToCtez' ? 'tez' : 'ctez';
  const outToken = dir === 'tezToCtez' ? 'ctez' : 'tez';
  const inBal = dir === 'tezToCtez' ? balance?.xtz : balance?.ctez;

  const { out, rate, impact } = useMemo(() => {
    if (!cfmm || !amount || Number(amount) <= 0) return { out: 0, rate: 0, impact: 0 };
    const cashPool = cfmm.cashPool.toNumber();
    const tokenPool = cfmm.tokenPool.toNumber();
    const amtMutez = Number(amount) * 1e6;
    let outMutez = 0;
    let spot = 0;
    if (dir === 'tezToCtez') {
      outMutez = (amtMutez * 9995 * tokenPool) / (cashPool * 10000 + amtMutez * 9995);
      spot = tokenPool / cashPool;
    } else {
      outMutez = (amtMutez * 9995 * cashPool) / (tokenPool * 10000 + amtMutez * 9995);
      spot = cashPool / tokenPool;
    }
    const outv = outMutez / 1e6;
    const exec = outv / Number(amount);
    return { out: outv, rate: exec, impact: spot > 0 ? Math.abs(1 - exec / spot) * 100 : 0 };
  }, [cfmm, amount, dir]);

  const minReceived = out * (1 - slippage / 100);
  const amt = Number(amount);
  const invalid = !amount || amt <= 0 || amt > (inBal ?? 0) + 1e-9;

  const submit = async () => {
    if (!pkh) return;
    setBusy(true);
    const deadline = new Date(Date.now() + DEFAULT_DEADLINE * 60_000);
    const ok = await runTx(`Swap ${amount} ${inToken} → ${outToken}`, () =>
      dir === 'tezToCtez'
        ? cashToToken({ to: pkh, minTokensBought: minReceived, deadline, amount: amt })
        : tokenToCash({ to: pkh, tokensSold: amt, minCashBought: minReceived, deadline }, pkh),
    );
    setBusy(false);
    if (ok) setAmount('');
  };

  return (
    <GlassCard p={6} maxW="440px" mx="auto">
      <VStack align="stretch" spacing={1}>
        <Text fontSize="xs" color="whiteAlpha.500" mb={1}>
          You pay
        </Text>
        <AmountInput
          token={inToken}
          value={amount}
          onChange={setAmount}
          onMax={() => setAmount(String(Number((inBal ?? 0).toFixed(6))))}
          balanceLabel={`Balance: ${fmt(inBal, 6)} ${inToken}`}
        />

        <Center my={1}>
          <Button
            size="sm"
            variant="glass"
            borderRadius="full"
            onClick={() => {
              setDir((d) => (d === 'tezToCtez' ? 'ctezToTez' : 'tezToCtez'));
              setAmount('');
            }}
            aria-label="Flip"
          >
            <Icon as={FiArrowDown} />
          </Button>
        </Center>

        <Text fontSize="xs" color="whiteAlpha.500" mb={1}>
          You receive (estimated)
        </Text>
        <Box
          bg="rgba(0,0,0,0.25)"
          border="1px solid rgba(255,255,255,0.08)"
          borderRadius="xl"
          px={4}
          py={3}
        >
          <Flex justify="space-between" align="center">
            <Text fontSize="lg" fontWeight={700} color={out > 0 ? 'white' : 'whiteAlpha.400'}>
              {fmt(out, 6)}
            </Text>
            <Text fontWeight={700} color={outToken === 'tez' ? 'tez.400' : 'brand.300'}>
              {outToken === 'tez' ? 'ꜩ tez' : '◈ ctez'}
            </Text>
          </Flex>
        </Box>

        <HStack justify="space-between" mt={3} fontSize="xs" color="whiteAlpha.500">
          <Text>Slippage tolerance</Text>
          <HStack spacing={1}>
            {SLIPPAGES.map((s) => (
              <Button
                key={s}
                size="xs"
                variant={slippage === s ? 'brand' : 'ghostline'}
                onClick={() => setSlippage(s)}
              >
                {s}%
              </Button>
            ))}
          </HStack>
        </HStack>

        {out > 0 && (
          <VStack align="stretch" spacing={1.5} mt={3} fontSize="xs" color="whiteAlpha.600">
            <HStack justify="space-between">
              <Text>Rate</Text>
              <Text>
                1 {inToken} ≈ {fmt(rate, 6)} {outToken}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Minimum received</Text>
              <Text>
                {fmt(minReceived, 6)} {outToken}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Price impact</Text>
              <Text color={impact > 2 ? 'orange.300' : 'whiteAlpha.700'}>{fmt(impact, 2)}%</Text>
            </HStack>
          </VStack>
        )}

        <Box mt={5}>
          {!pkh ? (
            <Center>
              <ConnectButton />
            </Center>
          ) : (
            <Button w="100%" variant="brand" size="lg" onClick={submit} isLoading={busy} isDisabled={invalid}>
              {invalid && amt > (inBal ?? 0) ? `Insufficient ${inToken}` : 'Swap'}
            </Button>
          )}
        </Box>
      </VStack>
    </GlassCard>
  );
}
