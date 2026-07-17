import type { BuiltInPassiveId, PassiveDefinition } from '../engine/types';

export const PASSIVE_DEFINITIONS = {
  prism_guard: {
    id: 'prism_guard',
    name: 'Prism Guard',
    description: 'Gain 2 Guard whenever Aurora creates an Aether gem with a match of five or more.',
    trigger: 'special_created',
    effects: [{ type: 'gain_guard', amount: 2 }],
  },
} satisfies Record<BuiltInPassiveId, PassiveDefinition>;
