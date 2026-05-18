import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, fonts } from '../lib/tokens';

export default function NewWeek() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>NEW WEEK</Text>
        <Text style={styles.heading}>New week,{'\n'}fresh start.</Text>
        <Text style={styles.sub}>You know what to do.</Text>
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace('/(tabs)')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Let's go</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 20,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 48,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -1.2,
    lineHeight: 54,
    marginBottom: 16,
  },
  sub: {
    fontSize: 17,
    color: colors.text2,
    lineHeight: 24,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
