import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
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
import { create } from '../../contracts/ctez';
import { Depositor } from '../../interfaces';
import { useWallet } from '../../wallet/WalletProvider';
import { useDelegates, useUserBalance, useUserOvens } from '../../hooks/queries';
import { useTx } from '../../lib/tx';
import { AmountInput } from '../ui';
import { fmt, shortenAddress } from '../../lib/format';

export default function CreateOvenModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { pkh } = useWallet();
  const { data: delegates } = useDelegates();
  const { data: balance } = useUserBalance(pkh);
  const { data: userOvens } = useUserOvens(pkh);
  const runTx = useTx();
  const [baker, setBaker] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBaker('');
      setAmount('');
    }
  }, [isOpen]);

  const lastOvenId = useMemo(() => {
    const sorted = [...(userOvens ?? [])].sort((a, b) => Number(a.key.id) - Number(b.key.id));
    return Number(sorted[sorted.length - 1]?.key.id ?? 0);
  }, [userOvens]);

  const amt = Number(amount) || 0;
  const invalid = !baker || !baker.startsWith('tz') || amt > (balance?.xtz ?? 0) + 1e-9;

  const submit = async () => {
    if (!pkh) return;
    setBusy(true);
    const ok = await runTx('Create oven', () =>
      create(pkh, baker, Depositor.any, lastOvenId, undefined, amt),
    );
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="#0e131a" border="1px solid rgba(255,255,255,0.08)" borderRadius="2xl">
        <ModalHeader>Create a new oven</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text fontSize="sm" color="whiteAlpha.600">
              An oven holds your tez collateral and lets you mint ctez against it. Pick a baker so the
              collateral keeps earning, and optionally seed it with an initial deposit.
            </Text>

            <Box>
              <Text fontSize="xs" color="whiteAlpha.500" mb={1.5}>
                Baker (delegate)
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

            <Box>
              <Text fontSize="xs" color="whiteAlpha.500" mb={1.5}>
                Initial deposit (optional)
              </Text>
              <AmountInput
                token="tez"
                value={amount}
                onChange={setAmount}
                onMax={() => setAmount(String(Number((balance?.xtz ?? 0).toFixed(6))))}
                balanceLabel={`Balance: ${fmt(balance?.xtz, 4)} tez`}
              />
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghostline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="brand" onClick={submit} isLoading={busy} isDisabled={invalid}>
            Create oven
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
