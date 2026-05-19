import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
} from 'expo-speech-recognition';
import { colors } from '../../lib/tokens';
import { Icon } from './Icon';

type Phase = 'listening' | 'error';

type Props = {
  visible: boolean;
  onConfirm: (transcript: string) => void;
  onCancel: () => void;
};

export function VoiceReminderModal({ visible, onConfirm, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('listening');
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const loop1Ref = useRef<Animated.CompositeAnimation | null>(null);
  const loop2Ref = useRef<Animated.CompositeAnimation | null>(null);

  function startPulse() {
    pulse1.setValue(0);
    pulse2.setValue(0);
    loop1Ref.current = Animated.loop(
      Animated.timing(pulse1, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop1Ref.current.start();
    const t = setTimeout(() => {
      loop2Ref.current = Animated.loop(
        Animated.timing(pulse2, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      );
      loop2Ref.current.start();
    }, 1200);
    return t;
  }

  function stopPulse() {
    loop1Ref.current?.stop();
    loop2Ref.current?.stop();
  }

  useEffect(() => {
    if (!visible) return;
    setTranscript('');
    setPhase('listening');
    setErrorMsg('');
    const t = startPulse();
    startListening();
    return () => {
      clearTimeout(t);
      stopPulse();
      ExpoSpeechRecognitionModule.abort();
    };
  }, [visible]);

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
    if (!visible) return;
    const t = event.results?.[0]?.transcript ?? '';
    setTranscript(t);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSpeechRecognitionEvent('error', (event: any) => {
    if (!visible) return;
    const code = event?.error ?? '';
    if (code === 'no-speech') return;
    setErrorMsg('Speech recognition failed. Try again.');
    setPhase('error');
  });

  function handleConfirm() {
    ExpoSpeechRecognitionModule.stop();
    const text = transcript.trim();
    if (text) {
      onConfirm(text);
    } else {
      onCancel();
    }
  }

  function handleRetry() {
    setErrorMsg('');
    startListening();
  }

  const ring1Scale = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.45] });
  const ring1Opacity = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });
  const ring2Scale = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.45] });
  const ring2Opacity = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.root}>
        <View style={styles.overlay} />
        <View style={styles.content}>
          {/* Orb */}
          <View style={styles.orbContainer}>
            <Animated.View
              style={[styles.pulseRing, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]}
            />
            <Animated.View
              style={[styles.pulseRing, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]}
            />
            <View style={styles.orb}>
              <Icon name="mic" size={42} color="#1a1816" />
            </View>
          </View>

          {/* Status */}
          <Text style={styles.heading}>
            {phase === 'listening' ? 'Listening…' : 'Something went wrong'}
          </Text>

          {phase === 'listening' && transcript.length > 0 && (
            <Text style={styles.transcript} numberOfLines={4}>"{transcript}"</Text>
          )}
          {phase === 'listening' && transcript.length === 0 && (
            <Text style={styles.hint}>Say when to remind you…</Text>
          )}
          {phase === 'error' && (
            <Text style={styles.hint}>{errorMsg}</Text>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={phase === 'error' ? handleRetry : onCancel}
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
        </View>
      </View>
    </Modal>
  );
}

const ORB_SIZE = 160;
const RING_SIZE = ORB_SIZE + 32;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,18,16,0.9)',
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
