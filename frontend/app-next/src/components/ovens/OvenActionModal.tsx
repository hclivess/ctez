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
  Select,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AllOvenDatum } from '../../interfaces';
import { deposit, withdraw, mintOrBurn, delegate } from '../../contracts/ctez';
import { useWallet } from '../../wallet/WalletProvider';
import { useUserBalance, useDelegates } from '../../hooks/queries';
import { computeOvenMetrics, ovenHealth } from '../../lib/oven';
import { useTx } from '../../lib/tx';
import { AmountInput } from '../ui';
import { fmt, shortenAddress } from '../../lib/format';

export type OvenAction = 'deposit' | 'withdraw' | 'mint' | 'burn' | 'delegate';

const META: Record<OvenAction, { title: string; token: 'tez' | 'ctez'; verb: string; help: string }> = {
  deposit: { title: 'Deposit tez', token: 'tez', verb: 'Deposit', help: 'Add tez collateral to strengthen your oven.' },
  withdraw: { title: 'Withdraw tez', token: 'tez', verb: 'Withdraw', help: 'Remove tez collateral — keep enough to stay above the liquidation threshold.' },
  mint: { title: 'Mint ctez', token: 'ctez', verb: 'Mint', help: 'Borrow ctez against your oven collateral.' },
  burn: { title: 'Repay ctez', token: 'ctez', verb: 'Repay', help: 'Burn ctez to reduce your outstanding debt.' },
  delegate: { title: 'Set delegate', token: 'tez', verb: 'Set baker', help: 'Choose the baker your oven delegates its tez to.' },
};

export default function OvenActionModal({
  isOpen,
  onClose,
  oven,
  action,
  rawTarget,
  rawDrift,
}: {
  isOpen: boolean;
  onClose: () => void;
  oven: AllOvenDatum | null;
  action: OvenAction;
  rawTarget: number;
  rawDrift: number;
}) {
  const { pkh } = useWallet();
  const { data: balance } = useUserBalance(pkh);
  const { data: delegates } = useDelegates();
  const runTx = useTx();
  const [amount, setAmount] = useState('');
  const [baker, setBaker] = useState('');
  const [busy, setBusy] = useState(false);

  const meta = META[action];

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setBaker('');
    }
  }, [isOpen, action, oven?.value.address]);

  const metrics = useMemo(
    () =>
      oven ? computeOvenMetrics(oven.value.tez_balance, oven.value.ctez_outstanding, rawTarget, rawDrift) : null,
    [oven, rawTarget, rawDrift],
  );

  const max = useMemo(() => {
    if (!metrics) return 0;
    switch (action) {
      case 'deposit':
        return balance?.xtz ?? 0;
      case 'withdraw':
        return Math.max(metrics.tez - metrics.ctezOutstanding * metrics.currentTarget * (16 / 15), 0);
      case 'mint':
        return metrics.remainingMintable;
      case 'burn':
        return Math.min(metrics.ctezOutstanding, balance?.ctez ?? 0);
      default:
        return 0;
    }
  }, [metrics, action, balance]);

  const projected = useMemo(() => {
    if (!oven || !metrics || action === 'delegate') return null;
    const amt = Number(amount) || 0;
    const tezMutez = Number(oven.value.tez_balance);
    const ctezMutez = Number(oven.value.ctez_outstanding);
    const dMutez = amt * 1e6;
    const newTez = action === 'deposit' ? tezMutez + dMutez : action === 'withdraw' ? tezMutez - dMutez : tezMutez;
    const newCtez = action === 'mint' ? ctezMutez + dMutez : action === 'burn' ? ctezMutez - dMutez : ctezMutez;
    return computeOvenMetrics(Math.max(newTez, 0), Math.max(newCtez, 0), rawTarget, rawDrift);
  }, [oven, metrics, action, amount, rawTarget, rawDrift]);

  if (!oven) return null;

  const amt = Number(amount);
  const invalid =
    action !== 'delegate' && (!amount || Number.isNaN(amt) || amt <= 0 || amt > max + 1e-9);
  const delegateInvalid = action === 'delegate' && (!baker || !baker.startsWith('tz'));

  const submit = async () => {
    setBusy(true);
    const ok = await runTx(`${meta.verb} ${action === 'delegate' ? '' : amount + (meta.token === 'tez' ? ' tez' : ' ctez')}`.trim(), () => {
      switch (action) {
        case 'deposit':
          return deposit(oven.value.address, amt);
        case 'withdraw':
          return withdraw(Number(oven.key.id), amt, pkh as string);
        case 'mint':
          return mintOrBurn(Number(oven.key.id), amt);
        case 'burn':
          return mintOrBurn(Number(oven.key.id), -amt);
        case 'delegate':
          return delegate(oven.value.address, baker);
        default:
          throw new Error('unknown action');
      }
    });
    setBusy(false);
    if (ok) onClose();
  };

  const health = projected ? ovenHealth(projected.collateralRatioPct) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="#0e131a" border="1px solid rgba(255,255,255,0.08)" borderRadius="2xl">
        <ModalHeader>
          <Text>{meta.title}</Text>
          <Text fontSize="xs" color="whiteAlpha.500" fontWeight={400}>
            Oven #{oven.key.id} · {shortenAddress(oven.value.address, 4)}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text fontSize="sm" color="whiteAlpha.600">
              {meta.help}
            </Text>

            {action === 'delegate' ? (
              <Box>
                <Text fontSize="xs" color="whiteAlpha.500" mb={1.5}>
                  Baker
                </Text>
                <Select
                  placeholder="Select a baker"
                  value={baker}
                  onChange={(e) => setBaker(e.target.value)}
                  bg="rgba(0,0,0,0.25)"
                  borderColor="whiteAlpha.200"
                >
                  {(delegates ?? []).map((d) => (
                    <option key={d.address} value={d.address} style={{ background: '#0e131a' }}>
                      {d.name ? `${d.name} · ${shortenAddress(d.address, 4)}` : d.address}
                    </option>
                  ))}
                </Select>
              </Box>
            ) : (
              <AmountInput
                token={meta.token}
                value={amount}
                onChange={setAmount}
                onMax={() => setAmount(String(Number(max.toFixed(6))))}
                balanceLabel={`Max: ${fmt(max, 6)} ${meta.token}`}
              />
            )}

            {projected && metrics && (
              <>
                <Divider borderColor="whiteAlpha.100" />
                <VStack align="stretch" spacing={2} fontSize="sm">
                  <HStack justify="space-between">
                    <Text color="whiteAlpha.500">Collateral after</Text>
                    <Text fontWeight={600}>{fmt(projected.tez, 4)} tez</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="whiteAlpha.500">Debt after</Text>
                    <Text fontWeight={600}>{fmt(projected.ctezOutstanding, 4)} ctez</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="whiteAlpha.500">Collateral ratio</Text>
                    <Text fontWeight={700} color={health?.color}>
                      {Number.isFinite(projected.collateralRatioPct)
                        ? `${fmt(projected.collateralRatioPct, 1)}%`
                        : '∞'}{' '}
                      {health ? `· ${health.label}` : ''}
                    </Text>
                  </HStack>
                </VStack>
              </>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghostline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={submit}
            isLoading={busy}
            isDisabled={action === 'delegate' ? delegateInvalid : invalid}
          >
            {meta.verb}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
