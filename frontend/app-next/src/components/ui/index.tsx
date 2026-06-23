import {
  Box,
  BoxProps,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Text,
  Tooltip,
  VStack,
  useClipboard,
  type InputProps,
} from '@chakra-ui/react';
import { type ReactNode } from 'react';
import { FiCheck, FiCopy } from 'react-icons/fi';
import { glassStyle } from '../../theme';
import { shortenAddress } from '../../lib/format';

export function GlassCard({ children, ...props }: BoxProps & { children: ReactNode }) {
  return (
    <Box
      bg={glassStyle.bg}
      border={glassStyle.border}
      backdropFilter={glassStyle.backdropFilter}
      borderRadius="2xl"
      boxShadow="0 8px 30px rgba(0,0,0,0.25)"
      transition="border-color 0.2s ease, transform 0.2s ease"
      _hover={{ borderColor: 'rgba(255,255,255,0.14)' }}
      {...props}
    >
      {children}
    </Box>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = 'whiteAlpha.900',
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
  icon?: ReactNode;
}) {
  return (
    <GlassCard p={5}>
      <HStack justify="space-between" align="start">
        <Text fontSize="sm" color="whiteAlpha.600" fontWeight={500}>
          {label}
        </Text>
        {icon && <Box color="brand.300">{icon}</Box>}
      </HStack>
      <Text mt={2} fontSize="2xl" fontWeight={700} color={accent} lineHeight={1.1}>
        {value}
      </Text>
      {sub && (
        <Text mt={1} fontSize="xs" color="whiteAlpha.500">
          {sub}
        </Text>
      )}
    </GlassCard>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      justify="space-between"
      align={{ base: 'start', md: 'center' }}
      gap={4}
      mb={6}
    >
      <Box>
        <Text
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight={800}
          letterSpacing="-0.02em"
          bgGradient="linear(to-r, white, whiteAlpha.700)"
          bgClip="text"
        >
          {title}
        </Text>
        {subtitle && (
          <Text mt={1} color="whiteAlpha.600" fontSize="sm" maxW="2xl">
            {subtitle}
          </Text>
        )}
      </Box>
      {actions && <HStack>{actions}</HStack>}
    </Flex>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <Center py={16}>
      <VStack spacing={3}>
        <Spinner thickness="3px" speed="0.7s" color="brand.300" size="lg" emptyColor="whiteAlpha.200" />
        {label && (
          <Text color="whiteAlpha.500" fontSize="sm">
            {label}
          </Text>
        )}
      </VStack>
    </Center>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <GlassCard p={10}>
      <VStack spacing={3} textAlign="center">
        {icon && (
          <Center boxSize={14} borderRadius="full" bg="whiteAlpha.100" color="brand.300" fontSize="2xl">
            {icon}
          </Center>
        )}
        <Text fontSize="lg" fontWeight={700}>
          {title}
        </Text>
        {description && (
          <Text color="whiteAlpha.600" fontSize="sm" maxW="md">
            {description}
          </Text>
        )}
        {action && <Box pt={2}>{action}</Box>}
      </VStack>
    </GlassCard>
  );
}

export function AddressChip({ address, label }: { address: string; label?: string }) {
  const { hasCopied, onCopy } = useClipboard(address);
  return (
    <Tooltip label={hasCopied ? 'Copied' : address} placement="top">
      <HStack
        as="button"
        onClick={onCopy}
        spacing={1.5}
        px={2.5}
        py={1}
        borderRadius="lg"
        bg="whiteAlpha.100"
        _hover={{ bg: 'whiteAlpha.200' }}
        fontFamily="mono"
        fontSize="xs"
        color="whiteAlpha.800"
      >
        <Text>{label ?? shortenAddress(address, 4)}</Text>
        <Icon as={hasCopied ? FiCheck : FiCopy} color={hasCopied ? 'brand.300' : 'whiteAlpha.500'} />
      </HStack>
    </Tooltip>
  );
}

export function TokenBadge({ token }: { token: 'tez' | 'ctez' }) {
  const isTez = token === 'tez';
  return (
    <HStack
      spacing={1.5}
      px={2.5}
      py={1}
      borderRadius="full"
      bg={isTez ? 'rgba(42,124,246,0.15)' : 'rgba(43,220,171,0.15)'}
      color={isTez ? 'tez.400' : 'brand.300'}
      fontWeight={700}
      fontSize="sm"
      flexShrink={0}
    >
      <Text>{isTez ? 'ꜩ' : '◈'}</Text>
      <Text>{isTez ? 'tez' : 'ctez'}</Text>
    </HStack>
  );
}

export function Pill({ children, color = 'whiteAlpha.800', bg = 'whiteAlpha.100' }: {
  children: ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <Box
      px={2.5}
      py={0.5}
      borderRadius="full"
      bg={bg}
      color={color}
      fontSize="xs"
      fontWeight={700}
      display="inline-block"
    >
      {children}
    </Box>
  );
}

export function AmountInput({
  token,
  value,
  onChange,
  onMax,
  balanceLabel,
  ...rest
}: {
  token?: 'tez' | 'ctez';
  value: string;
  onChange: (v: string) => void;
  onMax?: () => void;
  balanceLabel?: ReactNode;
} & Omit<InputProps, 'onChange' | 'value'>) {
  return (
    <Box>
      <InputGroup size="lg">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.0"
          inputMode="decimal"
          type="number"
          bg="rgba(0,0,0,0.25)"
          border="1px solid rgba(255,255,255,0.08)"
          borderRadius="xl"
          fontSize="lg"
          fontWeight={600}
          _hover={{ borderColor: 'whiteAlpha.300' }}
          _focusVisible={{ borderColor: 'brand.400', boxShadow: 'none' }}
          pr={token ? '7.5rem' : undefined}
          {...rest}
        />
        <InputRightElement width="auto" pr={2} h="100%">
          <HStack spacing={2}>
            {onMax && (
              <Button size="xs" variant="ghostline" onClick={onMax}>
                MAX
              </Button>
            )}
            {token && <TokenBadge token={token} />}
          </HStack>
        </InputRightElement>
      </InputGroup>
      {balanceLabel && (
        <Text mt={1.5} fontSize="xs" color="whiteAlpha.500" textAlign="right">
          {balanceLabel}
        </Text>
      )}
    </Box>
  );
}
