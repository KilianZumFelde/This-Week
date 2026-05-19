import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../../lib/tokens';

// Static muted card placeholder — no animation per spec
export function SkeletonCard({ height = 64 }: { height?: number }) {
  return <View style={[styles.card, { height }]} />;
}

export function SkeletonRow() {
  return <View style={styles.row} />;
}

export function ScreenError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.errorWrap}>
      <Text style={styles.errorText}>Couldn't load. Pull down to retry.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: 8,
    opacity: 0.6,
  },
  row: {
    height: 64,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: 8,
    opacity: 0.6,
  },
  errorWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: colors.text3,
  },
});
