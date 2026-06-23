import {
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { type ReactNode } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { FiGrid, FiLayers, FiRepeat, FiHelpCircle, FiMenu, FiZap } from 'react-icons/fi';
import Logo from '../brand/Logo';
import ConnectButton from './ConnectButton';
import { useWallet } from '../../wallet/WalletProvider';

const NAV = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/ovens', label: 'Ovens', icon: FiLayers, end: false },
  { to: '/liquidations', label: 'Liquidations', icon: FiZap, end: false },
  { to: '/trade', label: 'Trade', icon: FiRepeat, end: false },
  { to: '/faq', label: 'FAQ', icon: FiHelpCircle, end: false },
];

function NavItem({ to, label, icon, end, onClick }: (typeof NAV)[number] & { onClick?: () => void }) {
  return (
    <RouterNavLink to={to} end={end} onClick={onClick}>
      {({ isActive }) => (
        <HStack
          spacing={3}
          px={4}
          py={2.5}
          borderRadius="xl"
          color={isActive ? 'white' : 'whiteAlpha.600'}
          bg={isActive ? 'whiteAlpha.100' : 'transparent'}
          borderLeft="3px solid"
          borderColor={isActive ? 'brand.300' : 'transparent'}
          _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
          transition="all 0.15s ease"
          fontWeight={600}
        >
          <Icon as={icon} boxSize={5} />
          <Text>{label}</Text>
        </HStack>
      )}
    </RouterNavLink>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { network } = useWallet();
  return (
    <Flex direction="column" h="100%" px={4} py={6}>
      <Box px={2} mb={8}>
        <Logo />
      </Box>
      <VStack align="stretch" spacing={1} flex={1}>
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} onClick={onNavigate} />
        ))}
      </VStack>
      <VStack align="stretch" spacing={3} pt={4}>
        <HStack
          justify="space-between"
          px={4}
          py={2.5}
          borderRadius="xl"
          bg="whiteAlpha.50"
          border="1px solid rgba(255,255,255,0.06)"
        >
          <Text fontSize="xs" color="whiteAlpha.500">
            Network
          </Text>
          <HStack spacing={1.5}>
            <Box boxSize={2} borderRadius="full" bg="brand.300" />
            <Text fontSize="xs" fontWeight={700} textTransform="capitalize">
              {network}
            </Text>
          </HStack>
        </HStack>
        <RouterNavLink to="/faq" onClick={onNavigate}>
          <HStack
            spacing={1.5}
            px={4}
            fontSize="xs"
            color="whiteAlpha.500"
            _hover={{ color: 'whiteAlpha.800' }}
          >
            <Icon as={FiHelpCircle} />
            <Text>How ctez works</Text>
          </HStack>
        </RouterNavLink>
      </VStack>
    </Flex>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex minH="100vh">
      {/* Desktop sidebar */}
      <Box
        as="aside"
        display={{ base: 'none', lg: 'block' }}
        w="260px"
        flexShrink={0}
        position="sticky"
        top={0}
        h="100vh"
        borderRight="1px solid rgba(255,255,255,0.06)"
        bg="rgba(10,14,18,0.6)"
        backdropFilter="blur(8px)"
      >
        <SidebarContent />
      </Box>

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="#0a0e12" maxW="260px">
          <DrawerBody p={0}>
            <SidebarContent onNavigate={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main column */}
      <Flex direction="column" flex={1} minW={0}>
        <Flex
          as="header"
          position="sticky"
          top={0}
          zIndex={10}
          align="center"
          justify="space-between"
          px={{ base: 4, md: 8 }}
          py={4}
          borderBottom="1px solid rgba(255,255,255,0.06)"
          bg="rgba(8,11,15,0.7)"
          backdropFilter="blur(12px)"
        >
          <HStack spacing={3}>
            <IconButton
              aria-label="Open menu"
              icon={<FiMenu />}
              variant="ghost"
              display={{ base: 'inline-flex', lg: 'none' }}
              onClick={onOpen}
            />
            <Box display={{ base: 'block', lg: 'none' }}>
              <Logo compact />
            </Box>
          </HStack>
          <ConnectButton />
        </Flex>

        <Box as="main" flex={1} px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }} maxW="1200px" w="100%" mx="auto">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
