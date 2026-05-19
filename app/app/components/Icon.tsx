import { Feather } from '@expo/vector-icons';

// Thin wrapper mapping prototype icon names → Feather names.
const MAP: Record<string, string> = {
  home: 'home',
  inbox: 'inbox',
  target: 'target',
  'bar-chart': 'bar-chart-2',
  'bar-chart-2': 'bar-chart-2',
  mic: 'mic',
  plus: 'plus',
  settings: 'settings',
  'chevron-down': 'chevron-down',
  chevDown: 'chevron-down',
  'chevron-up': 'chevron-up',
  chevUp: 'chevron-up',
  'chevron-right': 'chevron-right',
  chevRight: 'chevron-right',
  x: 'x',
  check: 'check',
  link: 'link-2',
  bell: 'bell',
  calendar: 'calendar',
  sparkles: 'zap',
  flame: 'trending-up',
  pause: 'pause',
  refresh: 'refresh-cw',
  arrow: 'arrow-right',
  drag: 'menu',
  waveform: 'activity',
  target2: 'target',
  inbox2: 'inbox',
};

import type { ComponentProps } from 'react';

type FeatherName = ComponentProps<typeof Feather>['name'];

type Props = {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, color = 'currentColor' }: Props) {
  const featherName = (MAP[name] ?? name) as FeatherName;
  return <Feather name={featherName} size={size} color={color} />;
}
