import type { AbilityId, DuelRules, DuelState, ManaCost } from '../../engine/types';
import type { BattleUiState } from '../state';

export function renderAbilityRow(
  duel: DuelState,
  rules: DuelRules,
  ui: Readonly<BattleUiState>,
  canMove: boolean,
): string {
  const abilityIds = [...duel.player.abilityIds].sort(
    (a, b) => rules.abilities[a].presentation.order - rules.abilities[b].presentation.order,
  );
  return `
    <div class="spell-row" aria-label="Spells">
      ${abilityIds
        .map((abilityId, index) => {
          const ability = rules.abilities[abilityId];
          const canCast = canMove && canPayCost(duel.player, ability.cost);
          const charge = abilityCharge(duel.player, ability.cost);
          const gem = ability.presentation.gem;
          return `
            <button class="spell-button spell-${index + 1} spell-${gem} ${canCast ? 'is-ready' : 'is-locked'} ${ui.activeAbilityId === abilityId ? 'is-active' : ''}" type="button" data-spell="${abilityId}" style="--spell-charge: ${charge.percent};" ${canCast ? '' : 'disabled'}>
              <i class="spell-gem spell-gem-${gem}" aria-hidden="true">${ability.presentation.shortLabel}</i>
              <span>${compactCostLabel(ability.cost)}</span>
              <strong>${ability.name}</strong>
              <b>${ability.presentation.actionLabel}</b>
              <em>${canCast ? ability.presentation.readyHint : charge.label}</em>
              <i class="spell-meter" aria-hidden="true"></i>
            </button>
          `;
        })
        .join('')}
    </div>
  `;
}

export function abilityCostLabel(cost: ManaCost): string {
  return [
    cost.sun ? `${cost.sun} Sun` : '',
    cost.moon ? `${cost.moon} Moon` : '',
    cost.crown ? `${cost.crown} Crown` : '',
  ]
    .filter(Boolean)
    .join(' / ');
}

export function abilityRoleLabel(abilityId: AbilityId, rules: DuelRules): string {
  return rules.abilities[abilityId].presentation.roleLabel;
}

export function abilityTargetHint(abilityId: AbilityId, rules: DuelRules): string {
  return rules.abilities[abilityId].presentation.targetHint;
}

function canPayCost(actor: DuelState['player'], cost: ManaCost): boolean {
  return actor.sun >= (cost.sun ?? 0) && actor.moon >= (cost.moon ?? 0) && actor.crown >= (cost.crown ?? 0);
}

function compactCostLabel(cost: ManaCost): string {
  return [
    cost.sun ? `${cost.sun} SUN` : '',
    cost.moon ? `${cost.moon} MOON` : '',
    cost.crown ? `${cost.crown} CROWN` : '',
  ]
    .filter(Boolean)
    .join(' / ');
}

function abilityCharge(actor: DuelState['player'], cost: ManaCost): { percent: string; label: string } {
  const current =
    Math.min(actor.sun, cost.sun ?? 0) +
    Math.min(actor.moon, cost.moon ?? 0) +
    Math.min(actor.crown, cost.crown ?? 0);
  const required = (cost.sun ?? 0) + (cost.moon ?? 0) + (cost.crown ?? 0);
  const ratio = required > 0 ? Math.min(1, current / required) : 1;
  return { percent: `${Math.round(ratio * 100)}%`, label: `${current}/${required} charged` };
}
