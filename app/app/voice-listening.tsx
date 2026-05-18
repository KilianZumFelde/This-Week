import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
} from 'expo-speech-recognition';
import { colors } from '../lib/tokens';
import { Icon } from './components/Icon';
import { api } from '../lib/api';
import { useCaptureStore, CaptureItem } from '../lib/stores/capture-store';
import { useReminderInputStore } from '../lib/stores/reminder-input-store';
import { useThemes } from '../lib/hooks/useThemes';
import { useGoals } from '../lib/hooks/useGoals';

type Phase = 'listening' | 'processing' | 'error';

export default function VoiceListening() {
  const router = useRouter();
  const { mode, ctx } = useLocalSearchParams<{ mode?: string; ctx?: string }>();
  const insets = useSafeAreaInsets();
  const { data: themes } = useThemes();
  const { data: goals } = useGoals();
  const setCapture = useCaptureStore((s) => s.setCapture);
  const setReminderInput = useReminderInputStore((s) => s.set);

  const isReminderMode = mode === 'reminder';

  const [phase, setPhase] = useState<Phase>('listening');
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Pulse ring animations
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.timing(pulse1, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop1.start();

    const t = setTimeout(() => {
      const loop2 = Animated.loop(
        Animated.timing(pulse2, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      );
      loop2.start();
    }, 1200);

    return () => {
      loop1.stop();
      clearTimeout(t);
    };
  }, []);

  const ring1Scale = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.45] });
  const ring1Opacity = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });
  const ring2Scale = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.45] });
  const ring2Opacity = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });

  // Start listening on mount
  useEffect(() => {
    startListening();
    return () => {
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  async function startListening() {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      setErrorMsg('Microphone permission denied.');
      setPhase('error');
      return;
    }
    setTranscript('');
    setPhase('listening');
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSpeechRecognitionEvent('result', (event: any) => {
    const t = event.results?.[0]?.transcript ?? '';
    setTranscript(t);
  });

  useSpeechRecognitionEvent('end', () => {
    // Recognition ended naturally — keep transcript, let user confirm
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSpeechRecognitionEvent('error', (event: any) => {
    const code = event?.error ?? '';
    if (code === 'no-speech') {
      return;
    }
    setErrorMsg('Speech recognition failed. Try again.');
    setPhase('error');
  });

  async function handleConfirm() {
    ExpoSpeechRecognitionModule.stop();
    const text = transcript.trim();
    if (!text) {
      router.back();
      return;
    }

    if (isReminderMode) {
      const context = (ctx === 'quick-add' ? 'quick-add' : 'task-detail') as 'task-detail' | 'quick-add';
      setReminderInput(text, context);
      router.back();
      return;
    }

    setPhase('processing');

    const activeGoals = (goals ?? []).filter((g) => g.status === 'active');
    const primaryGoal = activeGoals.find((g) => g.goal_type === 'primary') ?? null;

    try {
      const result = await api.post<{ items: CaptureItem[] }>('/ai/capture', {
        transcript: text,
        context: {
          themes: (themes ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color })),
          active_primary_goal: primaryGoal
            ? { id: primaryGoal.id, title: primaryGoal.title, theme_id: primaryGoal.theme_id }
            : null,
        },
      });

      setCapture(text, result.items);
      router.replace('/quick-add?fromVoice=1');
    } catch {
      setErrorMsg('Could not parse your voice input. Try again.');
      setPhase('error');
    }
  }

  function handleCancel() {
    ExpoSpeechRecognitionModule.abort();
    router.back();
  }

  function handleRetry() {
    setErrorMsg('');
    startListening();
  }

  return (
    <View style={styles.root}>
      {/* Dark overlay — approximates blur(20px) from prototype */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
        {/* Orb with pulse rings */}
        <View style={styles.orbContainer}>
          <Animated.View
            style={[styles.pulseRing, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]}
          />
          <Animated.View
            style={[styles.pulseRing, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]}
          />
          <View style={styles.orb}>
            {phase === 'processing' ? (
              <ActivityIndicator size="large" color="#1a1816" />
            ) : (
              <Icon name="mic" size={42} color="#1a1816" />
            )}
          </View>
        </View>

        {/* Status text */}
        {phase === 'listening' && (
          <Text style={styles.heading}>Listening…</Text>
        )}
        {phase === 'processing' && (
          <Text style={styles.heading}>Thinking…</Text>
        )}
        {phase === 'error' && (
          <Text style={styles.heading}>Something went wrong</Text>
        )}

        {/* Transcript preview or error */}
        {phase === 'listening' && transcript.length > 0 && (
          <Text style={styles.transcript} numberOfLines={4}>
            "{transcript}"
          </Text>
        )}
        {phase === 'listening' && transcript.length === 0 && (
          <Text style={styles.hint}>
            {isReminderMode ? 'Say when to remind you…' : 'Say what you want to add…'}
          </Text>
        )}
        {phase === 'error' && (
          <Text style={styles.hint}>{errorMsg}</Text>
        )}

        {/* Controls */}
        {phase !== 'processing' && (
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={phase === 'error' ? handleRetry : handleCancel}
              activeOpacity={0.7}
            >
              <Icon name="x" size={20} color={colors.text2} />
            </TouchableOpacity>

            {phase === 'listening' && (
              <TouchableOpacity
                style={[styles.controlBtn, !transcript.trim() && styles.controlBtnDim]}
                onPress={handleConfirm}
                activeOpacity={0.7}
              >
                <Icon name="check" size={22} color={transcript.trim() ? colors.text : colors.text3} />
              </TouchableOpacity>
            )}

            {phase === 'error' && (
              <TouchableOpacity style={styles.controlBtn} onPress={handleRetry} activeOpacity={0.7}>
                <Icon name="refresh-cw" size={20} color={colors.text2} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const ORB_SIZE = 160;
const RING_SIZE = ORB_SIZE + 32;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,18,16,0.82)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  orbContainer: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    // Approximate the radial gradient from prototype via shadow
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(200,120,86,0.30)',
  },
  heading: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.22,
    marginTop: 36,
  },
  transcript: {
    fontSize: 14,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
  },
  hint: {
    fontSize: 13,
    color: colors.text3,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },
  controls: {
    flexDirection: 'row',
    gap: 22,
    alignItems: 'center',
    marginTop: 40,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnDim: {
    opacity: 0.5,
  },
});
