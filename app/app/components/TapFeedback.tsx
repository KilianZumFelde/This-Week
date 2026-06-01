import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type HitSlop = { top?: number; bottom?: number; left?: number; right?: number };

type Props = {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  hitSlop?: HitSlop;
};

export function TapFeedback({ children, onPress, disabled = false, hitSlop }: Props) {
  const scale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0);
  const rippleScale = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(
      withSpring(1.18, { damping: 4, stiffness: 400 }),
      withSpring(1.0, { damping: 10, stiffness: 300 }),
    );
    rippleScale.value = 0;
    rippleOpacity.value = 0.3;
    rippleScale.value = withTiming(1, { duration: 380 });
    rippleOpacity.value = withTiming(0, { duration: 380 });
    onPress();
  }

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.container}>
        <Pressable
          onPress={disabled ? undefined : handlePress}
          hitSlop={hitSlop}
        >
          {children}
        </Pressable>
        <Animated.View style={[styles.ripple, rippleStyle]} pointerEvents="none" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    alignSelf: 'center',
  },
});
