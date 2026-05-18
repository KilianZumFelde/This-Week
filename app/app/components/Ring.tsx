import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../lib/tokens';

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
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
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
      </Svg>
      {/* Overlay text — avoids dominantBaseline which is unreliable on Android */}
      <Text style={{ fontSize, fontWeight: '600', color: colors.text }}>
        {value}/{target}
      </Text>
    </View>
  );
}
