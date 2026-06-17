import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../lib/tokens';
import { Icon } from './Icon';

type Props = {
  visible: boolean;
  milestoneTitle: string;
  onAddNext: () => void;
  onDismiss: () => void;
};

export function SetNextMilestone({ visible, milestoneTitle, onAddNext, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const shortTitle = milestoneTitle.length > 40 ? milestoneTitle.slice(0, 38) + '…' : milestoneTitle;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onDismiss} activeOpacity={1} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.grip} />

          {/* Check + title */}
          <View style={styles.header}>
            <View style={styles.checkCircle}>
              <Icon name="check" size={18} color={colors.sage} />
            </View>
            <Text style={styles.headerText}>Nice — {shortTitle} done.</Text>
          </View>

          <Text style={styles.body}>
            You're best with one or two milestones in front of you. Set the next one?
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onDismiss} activeOpacity={0.7}>
              <Text style={styles.btnGhostText}>Not now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onAddNext} activeOpacity={0.8}>
              <Icon name="plus" size={16} color="#1a1816" />
              <Text style={styles.btnPrimaryText}>Add next milestone</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,18,16,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
  },
  grip: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text3,
    opacity: 0.35,
    alignSelf: 'center',
    marginBottom: 18,
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sageDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    fontFamily: 'Georgia',
    fontSize: 19,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  body: {
    fontSize: 14,
    color: colors.text2,
    lineHeight: 21,
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: radius.md,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.hairline2,
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  btnPrimary: {
    flex: 1.5,
    backgroundColor: colors.accent,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1816',
  },
});
