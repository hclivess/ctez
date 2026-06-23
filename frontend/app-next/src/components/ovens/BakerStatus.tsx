import { Box, HStack, Icon, Skeleton, Text, Tooltip } from '@chakra-ui/react';
import { FiCheckCircle, FiAlertCircle, FiXCircle } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { useOvenBaker } from '../../hooks/queries';
import { shortenAddress } from '../../lib/format';
import { Pill } from '../ui';

export default function BakerStatus({ ovenAddress, owner }: { ovenAddress: string; owner: string }) {
  const { data, isLoading } = useOvenBaker(ovenAddress, owner);

  if (isLoading) return <Skeleton height="34px" borderRadius="lg" mb={4} startColor="whiteAlpha.100" endColor="whiteAlpha.200" />;
  if (!data) return null;

  const { delegate, lastReward, rewardCount30d } = data;

  let color = 'orange.300';
  let badge = 'No baker';
  let icon = FiXCircle;
  let name = '—';
  let detail =
    'This oven is not delegated, so it earns no baking rewards. Use “Delegate” to pick a baker.';

  if (delegate) {
    name = delegate.alias || shortenAddress(delegate.address, 4);
    const earning = rewardCount30d > 0;
    if (earning && lastReward) {
      color = 'brand.300';
      badge = 'Getting paid';
      icon = FiCheckCircle;
      detail = `${rewardCount30d} reward payment${rewardCount30d > 1 ? 's' : ''} received in the last 30 days. Last: ${formatDistanceToNow(
        new Date(lastReward.timestamp),
        { addSuffix: true },
      )} (+${lastReward.amount.toFixed(4)} ꜩ).`;
    } else if (delegate.active) {
      color = 'yellow.300';
      badge = 'No payouts';
      icon = FiAlertCircle;
      detail =
        'Delegated to an active baker, but no reward payments have arrived in the last 30 days — many bakers don’t pay smart-contract (KT1) delegators. Consider a baker that pays KT1 accounts.';
    } else {
      color = 'orange.300';
      badge = 'Inactive baker';
      icon = FiAlertCircle;
      detail =
        'The baker is deactivated and is not producing or paying rewards. Re-delegate to an active baker.';
    }
  }

  return (
    <Tooltip label={detail} placement="top" hasArrow maxW="300px">
      <HStack
        justify="space-between"
        mb={4}
        px={3}
        py={2}
        borderRadius="lg"
        bg="whiteAlpha.50"
        cursor="help"
      >
        <HStack spacing={2} minW={0}>
          <Box color={color} flexShrink={0}>
            <Icon as={icon} />
          </Box>
          <Text fontSize="xs" color="whiteAlpha.600" noOfLines={1}>
            Baker:{' '}
            <Box as="span" color="whiteAlpha.800" fontWeight={600}>
              {name}
            </Box>
            {delegate && !delegate.active ? ' · inactive' : ''}
          </Text>
        </HStack>
        <Pill color={color} bg="whiteAlpha.100">
          {badge}
        </Pill>
      </HStack>
    </Tooltip>
  );
}
