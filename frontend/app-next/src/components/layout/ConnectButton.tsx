import {
  Box,
  Button,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  useClipboard,
} from '@chakra-ui/react';
import { FiChevronDown, FiCopy, FiLogOut, FiCheck } from 'react-icons/fi';
import { useWallet } from '../../wallet/WalletProvider';
import { shortenAddress } from '../../lib/format';

export default function ConnectButton() {
  const { pkh, connect, connecting, disconnect } = useWallet();
  const { hasCopied, onCopy } = useClipboard(pkh ?? '');

  if (!pkh) {
    return (
      <Button variant="brand" onClick={connect} isLoading={connecting} loadingText="Connecting" px={5}>
        Connect wallet
      </Button>
    );
  }

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        variant="glass"
        rightIcon={<FiChevronDown />}
        pl={2}
        pr={3}
      >
        <HStack spacing={2}>
          <Box boxSize={6} borderRadius="full" bgGradient="linear(135deg, brand.300, tez.500)" flexShrink={0} />
          <Text fontFamily="mono" fontSize="sm">
            {shortenAddress(pkh, 4)}
          </Text>
        </HStack>
      </MenuButton>
      <MenuList bg="#11161d" borderColor="whiteAlpha.200" minW="220px">
        <Box px={3} py={2}>
          <Text fontSize="xs" color="whiteAlpha.500">
            Connected
          </Text>
          <Text fontFamily="mono" fontSize="sm" wordBreak="break-all">
            {shortenAddress(pkh, 8)}
          </Text>
        </Box>
        <MenuDivider borderColor="whiteAlpha.200" />
        <MenuItem
          bg="transparent"
          _hover={{ bg: 'whiteAlpha.100' }}
          icon={<Icon as={hasCopied ? FiCheck : FiCopy} />}
          onClick={onCopy}
        >
          {hasCopied ? 'Copied' : 'Copy address'}
        </MenuItem>
        <MenuItem
          bg="transparent"
          _hover={{ bg: 'whiteAlpha.100' }}
          icon={<Icon as={FiLogOut} />}
          color="red.300"
          onClick={disconnect}
        >
          Disconnect
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
