import { type ReactNode } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { GlassCard } from '../ui';
import { HistoryPoint } from '../../api/history';
import { fmt } from '../../lib/format';

const axisTick = { fill: 'rgba(255,255,255,0.45)', fontSize: 11 };
const GRID = 'rgba(255,255,255,0.06)';

function ChartTooltip({ active, payload, label, unit, dp }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      bg="#11161d"
      border="1px solid rgba(255,255,255,0.1)"
      borderRadius="lg"
      px={3}
      py={2}
      fontSize="xs"
      boxShadow="0 8px 24px rgba(0,0,0,0.4)"
    >
      <Text color="whiteAlpha.500" mb={1.5}>
        {format(new Date(label), 'MMM d, yyyy · HH:mm')}
      </Text>
      {payload.map((p: any) => (
        <HStack key={p.dataKey} justify="space-between" spacing={5}>
          <HStack spacing={1.5}>
            <Box boxSize={2} borderRadius="full" bg={p.color} />
            <Text color="whiteAlpha.700">{p.name}</Text>
          </HStack>
          <Text fontWeight={700}>
            {fmt(p.value, dp ?? 4)}
            {unit ? ` ${unit}` : ''}
          </Text>
        </HStack>
      ))}
    </Box>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <GlassCard p={5}>
      <Text fontWeight={700}>{title}</Text>
      {subtitle && (
        <Text fontSize="xs" color="whiteAlpha.500">
          {subtitle}
        </Text>
      )}
      <Box mt={4}>{children}</Box>
    </GlassCard>
  );
}

export function PriceTargetChart({ data }: { data: HistoryPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="t"
          tick={axisTick}
          tickFormatter={(t) => format(new Date(t), 'MMM d')}
          minTickGap={32}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={axisTick}
          domain={['auto', 'auto']}
          tickFormatter={(v) => Number(v).toFixed(3)}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<ChartTooltip unit="ꜩ" dp={5} />} />
        <Line type="monotone" dataKey="target" name="Target" stroke="#4ee4b7" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="price" name="Market" stroke="#2a7cf6" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SeriesChart({
  data,
  dataKey,
  color,
  name,
  unit,
  dp = 1,
  area = false,
}: {
  data: HistoryPoint[];
  dataKey: keyof HistoryPoint;
  color: string;
  name: string;
  unit?: string;
  dp?: number;
  area?: boolean;
}) {
  const gradId = `grad-${dataKey}`;
  return (
    <ResponsiveContainer width="100%" height={220}>
      {area ? (
        <AreaChart data={data} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="t" tick={axisTick} tickFormatter={(t) => format(new Date(t), 'MMM d')} minTickGap={32} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} domain={['auto', 'auto']} tickFormatter={(v) => fmt(v, dp)} axisLine={false} tickLine={false} width={52} />
          <Tooltip content={<ChartTooltip unit={unit} dp={dp} />} />
          <Area type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} fill={`url(#${gradId})`} />
        </AreaChart>
      ) : (
        <LineChart data={data} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="t" tick={axisTick} tickFormatter={(t) => format(new Date(t), 'MMM d')} minTickGap={32} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} domain={['auto', 'auto']} tickFormatter={(v) => fmt(v, dp)} axisLine={false} tickLine={false} width={52} />
          <Tooltip content={<ChartTooltip unit={unit} dp={dp} />} />
          <Line type="monotone" dataKey={dataKey} name={name} stroke={color} dot={false} strokeWidth={2} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
