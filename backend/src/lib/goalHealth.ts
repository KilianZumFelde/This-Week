export type HealthLevelValue = 'behind' | 'slightly_behind' | 'on_track' | 'ahead' | 'well_ahead';
export type ProgressAnswer = 'a_lot' | 'some' | 'barely' | 'nothing';
export type ConfidenceAnswer = 'yes' | 'maybe' | 'no';

// progress × confidence → health_level (requirements-lens.md §Business rules mapping table)
const HEALTH_MAP: Record<ProgressAnswer, Record<ConfidenceAnswer, HealthLevelValue>> = {
  a_lot:   { yes: 'well_ahead',     maybe: 'ahead',          no: 'on_track'       },
  some:    { yes: 'ahead',          maybe: 'on_track',       no: 'slightly_behind' },
  barely:  { yes: 'on_track',       maybe: 'slightly_behind', no: 'behind'         },
  nothing: { yes: 'slightly_behind', maybe: 'behind',         no: 'behind'         },
};

export function computeHealthLevel(
  progress: ProgressAnswer,
  confidence: ConfidenceAnswer,
): HealthLevelValue {
  return HEALTH_MAP[progress][confidence];
}
