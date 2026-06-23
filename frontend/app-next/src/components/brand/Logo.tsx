import { HStack, Box, Text } from '@chakra-ui/react';

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <HStack spacing={2.5} userSelect="none">
      <Box
        boxSize={8}
        borderRadius="lg"
        bgGradient="linear(135deg, brand.300, tez.500)"
        display="grid"
        placeItems="center"
        boxShadow="0 4px 16px rgba(43,220,171,0.35)"
        flexShrink={0}
      >
        <Text fontSize="lg" fontWeight={900} color="#04130d">
          ◈
        </Text>
      </Box>
      {!compact && (
        <Box lineHeight={1}>
          <Text fontWeight={800} fontSize="lg" letterSpacing="-0.02em">
            ctez
          </Text>
          <Text fontSize="2xs" color="whiteAlpha.500" letterSpacing="0.08em" textTransform="uppercase">
            Tezos DeFi
          </Text>
        </Box>
      )}
    </HStack>
  );
}
