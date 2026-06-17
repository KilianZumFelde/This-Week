import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../lib/tokens';

// ─── Health level definitions (keyed on DB enum values) ───────────────────────

export type HealthLevelKey =
  | 'behind'
  | 'slightly_behind'
  | 'on_track'
  | 'ahead'
  | 'well_ahead';

export type HealthLevel = {
  key: HealthLevelKey;
  label: string;
  pos: number;
  color: string;
};

export const HEALTH_LEVELS: HealthLevel[] = [
  { key: 'behind',         label: 'Behind',          pos: 0.08, color: colors.brick },
  { key: 'slightly_behind',label: 'Slightly behind', pos: 0.30, color: '#b58a72' },
  { key: 'on_track',       label: 'On track',        pos: 0.50, color: colors.text2 },
  { key: 'ahead',          label: 'Ahead',           pos: 0.72, color: colors.sage },
  { key: 'well_ahead',     label: 'Well ahead',      pos: 0.92, color: colors.gold },
];

export function healthByKey(k: HealthLevelKey | string): HealthLevel {
  return HEALTH_LEVELS.find((l) => l.key === k) ?? HEALTH_LEVELS[2];
}

// ─── Track segment colors ──────────────────────────────────────────────────────
// Pre-computed from the web prototype's color-mix() values (oklab ≈ linear RGB):
// seg1: color-mix(brick 42%, surface2) → #62453e
// seg2: color-mix(brick 20%, surface2) → #473731
// seg3: surface-hi → #3a3431
// seg4: color-mix(sage 30%, surface2)  → #4c4d3e
// seg5: color-mix(gold 40%, surface2)  → #716041

const TRACK_SEG_COLORS = ['#62453e', '#473731', '#3a3431', '#4c4d3e', '#716041'];

// ─── Track ────────────────────────────────────────────────────────────────────

type TrackProps = {
  pos?: number;
  size?: 'lg' | 'sm';
  muted?: boolean;
};

export function Track({ pos = 0.5, size = 'lg', muted = false }: TrackProps) {
  const lg = size === 'lg';
  const trackH = lg ? 8 : 5;
  const markerH = trackH + (lg ? 12 : 8);
  const markerW = lg ? 9 : 7;

  return (
    <View style={{ position: 'relative', width: '100%', paddingVertical: lg ? 7 : 5 }}>
      {/* Segments */}
      <View style={{ flexDirection: 'row', gap: 2, height: trackH }}>
        {TRACK_SEG_COLORS.map((c, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: muted ? colors.surfaceHi : c,
              opacity: muted ? 0.5 : 1,
              borderRadius: 2,
              borderTopLeftRadius: i === 0 ? trackH : 2,
              borderBottomLeftRadius: i === 0 ? trackH : 2,
              borderTopRightRadius: i === 4 ? trackH : 2,
              borderBottomRightRadius: i === 4 ? trackH : 2,
            }}
          />
        ))}
      </View>

      {/* Marker */}
      {!muted && (
        <View
          style={{
            position: 'absolute',
            left: `${pos * 100}%` as unknown as number,
            top: '50%' as unknown as number,
            width: markerW,
            height: markerH,
            borderRadius: 99,
            backgroundColor: colors.accent,
            transform: [{ translateX: -markerW / 2 }, { translateY: -(markerH / 2) }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          }}
        />
      )}
    </View>
  );
}

// ─── Labeled track (size="lg" only) ───────────────────────────────────────────

type LabeledTrackProps = {
  healthKey: HealthLevelKey | string | null;
  muted?: boolean;
};

export function LabeledTrack({ healthKey, muted = false }: LabeledTrackProps) {
  const level = healthKey ? healthByKey(healthKey) : null;
  return (
    <View>
      <Track pos={level?.pos ?? 0.5} size="lg" muted={muted || !level} />
      {level && !muted && (
        <Text style={[styles.levelLabel, { color: level.color }]}>{level.label}</Text>
      )}
    </View>
  );
}

// ─── HealthDots (8-week trend) ────────────────────────────────────────────────

type HealthDotsProps = {
  weeks: (HealthLevelKey | string | null)[];
};

export function HealthDots({ weeks }: HealthDotsProps) {
  const lastKey = weeks[weeks.length - 1];
  const lastLvl = lastKey ? healthByKey(lastKey) : null;

  return (
    <View>
      {lastLvl && (
        <View style={styles.dotsHeader}>
          <Text style={styles.dotsThisWeek}>This week</Text>
          <Text style={[styles.dotsLevel, { color: lastLvl.color }]}>{lastLvl.label}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        {weeks.map((k, i) => {
          const lvl = k ? healthByKey(k) : null;
          const now = i === weeks.length - 1;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: now ? 18 : 7,
                borderRadius: 3,
                backgroundColor: lvl ? lvl.color : colors.surfaceHi,
                opacity: now ? 1 : (lvl ? 0.45 : 0.3),
              }}
            />
          );
        })}
      </View>

      <View style={styles.dotsFooter}>
        <Text style={styles.dotsFooterText}>8 weeks ago</Text>
        <Text style={[styles.dotsFooterText, styles.dotsNow]}>now ↑</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  levelLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 6,
  },
  dotsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dotsThisWeek: {
    fontSize: 12,
    color: colors.text3,
  },
  dotsLevel: {
    fontSize: 13,
    fontWeight: '600',
  },
  dotsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dotsFooterText: {
    fontSize: 10.5,
    color: colors.text3,
    letterSpacing: 0.04 * 10.5,
  },
  dotsNow: {
    color: colors.text2,
    fontWeight: '600',
  },
});
