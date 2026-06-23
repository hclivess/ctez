import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AllOvenDatum } from '../../interfaces';
import { liquidate } from '../../contracts/ctez';
import { useWallet } from '../../wallet/WalletProvider';
import { useUserBalance } from '../../hooks/queries';
import { computeOvenMetrics, ovenHealth } from '../../lib/oven';
import { useTx } from '../../lib/tx';
import { AmountInput } from '../ui';
import { fmt, shortenAddress } from '../../lib/format';

export default function LiquidateModal({
  isOpen,
  onClose,
  oven,
  rawTarget,
  rawDrift,
}: {
  isOpen: boolean;
  onClose: () => void;
  oven: AllOvenDatum | null;
  rawTarget: number;
  rawDrift: number;
}) {
  const { pkh } = useWallet();
  const { data: balance } = useUserBalance(pkh);
  const runTx = useTx();
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) setAmount('');
  }, [isOpen, oven?.value.address]);

  const targetNorm = rawTarget / 2 ** 48;
  const m = useMemo(
    () =>
      oven ? computeOvenMetrics(oven.value.tez_balance, oven.value.ctez_outstanding, rawTarget, rawDrift) : null,
    [oven, rawTarget, rawDrift],
  );

  // A liquidator burning q ctez extracts q * target * 32/31 tez. Bound q by the
  // oven's debt, the collateral available, and the liquidator's ctez balance.
  const max = useMemo(() => {
    if (!m) return 0;
    const maxByCollateral = targetNorm > 0 ? m.tez / (targetNorm * (32 / 31)) : 0;
    return Math.max(Math.min(m.ctezOutstanding, maxByCollateral, balance?.ctez ?? 0), 0);
  }, [m, balance, targetNorm]);

  if (!oven || !m) return null;

  const amt = Number(amount) || 0;
  const reward = amt * targetNorm * (32 / 31); // tez collateral received
  const health = ovenHealth(m.collateralRatioPct);
  const invalid = !amount || amt <= 0 || amt > max + 1e-9;

  const submit = async () => {
    if (!pkh) return;
    setBusy(true);
    const ok = await runTx(`Liquidate oven #${oven.key.id}`, () =>
      liquidate(Number(oven.key.id), oven.key.owner, amt, pkh),
    );
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="#0e131a" border="1px solid rgba(255,255,255,0.08)" borderRadius="2xl">
        <ModalHeader>
          <Text>Liquidate oven #{oven.key.id}</Text>
          <Text fontSize="xs" color="whiteAlpha.500" fontWeight={400}>
            owner {shortenAddress(oven.key.owner, 4)} · {shortenAddress(oven.value.address, 4)}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text fontSize="sm" color="whiteAlpha.600">
              This oven is undercollateralised. Send ctez to burn its debt and claim its tez
              collateral at a <b>32/31 (~3.2%) bonus</b>. You can liquidate up to the amount the
              collateral can cover.
            </Text>

            <VStack align="stretch" spacing={2} fontSize="sm">
              <HStack justify="space-between">
                <Text color="whiteAlpha.500">Collateral</Text>
                <Text fontWeight={600}>{fmt(m.tez, 4)} tez</Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="whiteAlpha.500">Debt</Text>
                <Text fontWeight={600}>{fmt(m.ctezOutstanding, 4)} ctez</Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="whiteAlpha.500">Collateral ratio</Text>
                <Text fontWeight={700} color={health.color}>
                  {Number.isFinite(m.collateralRatioPct) ? `${fmt(m.collateralRatioPct, 1)}%` : '∞'} ·{' '}
                  {health.label}
                </Text>
              </HStack>
            </VStack>

            <Divider borderColor="whiteAlpha.100" />

            <Box>
              <Text fontSize="xs" color="whiteAlpha.500" mb={1.5}>
                ctez to burn
              </Text>
              <AmountInput
                token="ctez"
                value={amount}
                onChange={setAmount}
                onMax={() => setAmount(String(Number(max.toFixed(6))))}
                balanceLabel={`Max liquidatable: ${fmt(max, 6)} ctez · your balance ${fmt(balance?.ctez, 4)}`}
              />
            </Box>

            {amt > 0 && (
              <HStack
                justify="space-between"
                bg="rgba(43,220,171,0.08)"
                border="1px solid rgba(43,220,171,0.20)"
                borderRadius="xl"
                px={4}
                py={3}
              >
                <Text fontSize="sm" color="whiteAlpha.700">
                  You receive
                </Text>
                <Text fontWeight={700} color="brand.300">
                  ≈ {fmt(reward, 6)} tez
                </Text>
              </HStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghostline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="brand" onClick={submit} isLoading={busy} isDisabled={invalid}>
            Liquidate
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
