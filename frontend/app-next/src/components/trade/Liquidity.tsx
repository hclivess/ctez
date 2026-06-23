import { useMemo, useState } from 'react';
import { Box, Button, Center, HStack, Text, VStack } from '@chakra-ui/react';
import { useWallet } from '../../wallet/WalletProvider';
import { useCfmmStorage, useUserBalance, useUserLQT } from '../../hooks/queries';
import { addLiquidity, removeLiquidity } from '../../contracts/cfmm';
import { useTx } from '../../lib/tx';
import { AmountInput, GlassCard } from '../ui';
import ConnectButton from '../layout/ConnectButton';
import { fmt } from '../../lib/format';
import { DEFAULT_DEADLINE, DEFAULT_SLIPPAGE } from '../../utils/globals';

type Mode = 'add' | 'remove';

export default function Liquidity() {
  const { pkh } = useWallet();
  const { data: cfmm } = useCfmmStorage();
  const { data: balance } = useUserBalance(pkh);
  const { data: lqt } = useUserLQT(pkh);
  const runTx = useTx();
  const [mode, setMode] = useState<Mode>('add');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const slippage = DEFAULT_SLIPPAGE;

  const calc = useMemo(() => {
    if (!cfmm) return null;
    const cashPool = cfmm.cashPool.toNumber();
    const tokenPool = cfmm.tokenPool.toNumber();
    const lqtTotal = cfmm.lqtTotal.toNumber();
    const amt = Number(amount) || 0;
    if (mode === 'add') {
      const tezMutez = amt * 1e6;
      const ctezRequired = (tezMutez * tokenPool) / cashPool / 1e6;
      const lqtMinted = Math.floor((tezMutez * lqtTotal) / cashPool);
      return {
        ctezRequired,
        lqtMinted,
        maxTokensDeposited: ctezRequired * (1 + slippage / 100),
        minLqtMinted: Math.floor(lqtMinted * (1 - slippage / 100)),
      };
    }
    const lqtBurned = Math.floor(amt);
    const tez = (lqtBurned * cashPool) / lqtTotal / 1e6;
    const ctez = (lqtBurned * tokenPool) / lqtTotal / 1e6;
    return {
      lqtBurned,
      tezOut: tez,
      ctezOut: ctez,
      minCashWithdrawn: tez * (1 - slippage / 100),
      minTokensWithdrawn: ctez * (1 - slippage / 100),
    };
  }, [cfmm, amount, mode]);

  const amt = Number(amount) || 0;
  const invalid =
    mode === 'add'
      ? amt <= 0 ||
        amt > (balance?.xtz ?? 0) + 1e-9 ||
        (calc?.ctezRequired ?? 0) > (balance?.ctez ?? 0) + 1e-9
      : amt <= 0 || amt > (lqt?.lqt ?? 0) + 1e-9;

  const submit = async () => {
    if (!pkh || !calc) return;
    setBusy(true);
    const deadline = new Date(Date.now() + DEFAULT_DEADLINE * 60_000);
    const ok = await runTx(mode === 'add' ? 'Add liquidity' : 'Remove liquidity', () =>
      mode === 'add'
        ? addLiquidity({
            owner: pkh,
            deadline,
            minLqtMinted: calc.minLqtMinted as number,
            maxTokensDeposited: calc.maxTokensDeposited as number,
            amount: amt,
          })
        : removeLiquidity(
            {
              to: pkh,
              deadline,
              lqtBurned: calc.lqtBurned as number,
              minTokensWithdrawn: calc.minTokensWithdrawn as number,
              minCashWithdrawn: calc.minCashWithdrawn as number,
            },
            pkh,
          ),
    );
    setBusy(false);
    if (ok) setAmount('');
  };

  return (
    <GlassCard p={6} maxW="440px" mx="auto">
      <HStack bg="rgba(0,0,0,0.25)" borderRadius="xl" p={1} mb={5}>
        {(['add', 'remove'] as Mode[]).map((m) => (
          <Button
            key={m}
            flex={1}
            size="sm"
            variant={mode === m ? 'brand' : 'ghost'}
            onClick={() => {
              setMode(m);
              setAmount('');
            }}
            textTransform="capitalize"
          >
            {m}
          </Button>
        ))}
      </HStack>

      {mode === 'add' ? (
        <VStack align="stretch" spacing={3}>
          <Text fontSize="xs" color="whiteAlpha.500">
            Deposit tez (an equal value of ctez is added automatically)
          </Text>
          <AmountInput
            token="tez"
            value={amount}
            onChange={setAmount}
            onMax={() => setAmount(String(Number((balance?.xtz ?? 0).toFixed(6))))}
            balanceLabel={`Balance: ${fmt(balance?.xtz, 4)} tez`}
          />
          {calc && amt > 0 && (
            <VStack align="stretch" spacing={1.5} fontSize="xs" color="whiteAlpha.600">
              <HStack justify="space-between">
                <Text>ctez required</Text>
                <Text color={(calc.ctezRequired ?? 0) > (balance?.ctez ?? 0) ? 'orange.300' : undefined}>
                  {fmt(calc.ctezRequired, 6)} ctez
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text>LQT received</Text>
                <Text>{fmt(calc.lqtMinted, 0)}</Text>
              </HStack>
            </VStack>
          )}
        </VStack>
      ) : (
        <VStack align="stretch" spacing={3}>
          <Text fontSize="xs" color="whiteAlpha.500">
            Burn LQT to withdraw your share of the pool
          </Text>
          <AmountInput
            value={amount}
            onChange={setAmount}
            onMax={() => setAmount(String(Math.floor(lqt?.lqt ?? 0)))}
            balanceLabel={`LQT balance: ${fmt(lqt?.lqt, 0)} (${fmt(lqt?.lqtShare, 4)}% of pool)`}
          />
          {calc && amt > 0 && (
            <VStack align="stretch" spacing={1.5} fontSize="xs" color="whiteAlpha.600">
              <HStack justify="space-between">
                <Text>tez out (min)</Text>
                <Text>{fmt(calc.minCashWithdrawn, 6)} ꜩ</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>ctez out (min)</Text>
                <Text>{fmt(calc.minTokensWithdrawn, 6)} ctez</Text>
              </HStack>
            </VStack>
          )}
        </VStack>
      )}

      <Box mt={5}>
        {!pkh ? (
          <Center>
            <ConnectButton />
          </Center>
        ) : (
          <Button w="100%" variant="brand" size="lg" onClick={submit} isLoading={busy} isDisabled={invalid}>
            {mode === 'add' ? 'Add liquidity' : 'Remove liquidity'}
          </Button>
        )}
      </Box>
    </GlassCard>
  );
}
