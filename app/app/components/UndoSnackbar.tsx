import { View, Text, TouchableOpacity, StyleSheet, Animated, useAnimatedValue } from 'react-native';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUndoStore } from '../../lib/stores/undo-store';
import { colors, radius } from '../../lib/tokens';

export function UndoSnackbar() {
  const { action, execute, dismiss } = useUndoStore();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (action) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [action]);

  if (!action && (opacity as unknown as { _value: number })._value === 0) return null;

  return (
    <Animated.View
      style={[
        styles.snackbar,
        {
          bottom: 92 + Math.max(14, insets.bottom),
          opacity,
        },
      ]}
      pointerEvents={action ? 'box-none' : 'none'}
    >
      <Text style={styles.label} numberOfLines={1}>
        {action?.label ?? ''}
      </Text>
      <TouchableOpacity onPress={execute} style={styles.undoBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.undoText}>Undo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceHi,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 20,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  undoBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  undoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentStrong,
    letterSpacing: 0.1,
  },
});
