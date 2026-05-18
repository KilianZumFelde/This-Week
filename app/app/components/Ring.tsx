import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '../../lib/tokens';

// SVG progress ring — matches the Ring component in docs/ui/components.jsx exactly.

type Props = {
  value: number;
  target: number;
  size?: number;
  stroke?: number;
  dim?: boolean;
};

export function Ring({ value, target, size = 44, stroke = 4, dim = false }: Props) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(value / Math.max(target, 1), 1);
  const dash = circumference * pct;
  const hit = value >= target;
  const progressColor = dim ? colors.text3 : hit ? colors.gold : colors.accentStrong;
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = size > 50 ? 13 : 11;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={colors.surfaceHi}
        strokeWidth={stroke}
      />
      {/* Progress arc — rotated -90° so it starts at top */}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={progressColor}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        rotation={-90}
        origin={`${cx}, ${cy}`}
      />
      {/* Center label */}
      <SvgText
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="600"
        fill={colors.text}
      >
        {value}/{target}
      </SvgText>
    </Svg>
  );
}
