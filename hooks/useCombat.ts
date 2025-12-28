'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CombatState, Combatant, CombatLogEntry, Condition } from '@/types/combat';
import { rollHpFormula, rollInitiative } from '@/lib/dice';
import { v4 as uuidv4 } from 'uuid';

interface UseCombatProps {
  sessionId: string;
  campaignId: string;
  onCombatEvent?: (event: CombatEvent) => void;
}

interface CombatEvent {
  type: string;
  title: string;
  description: string;
  payload: Record<string, unknown>;
}

interface EntityData {
  id: string;
  name: string;
  mechanics?: {
    abilities?: { dex?: number };
    hp_current?: number;
    hp_max?: number;
    hp?: number;
    ac?: number;
    statBlock?: Record<string, unknown>;
    creatures?: EncounterCreature[];
    rewards?: { items?: unknown[]; gold?: number; xp?: number };
    loot?: { items?: unknown[]; gold?: number; xp?: number };
  };
}

interface EncounterCreature {
  srdId?: string;
  entityId?: string;
  name: string;
  count?: number;
  hpFormula?: string;
}

interface SrdCreature {
  hit_points?: number;
  hit_points_roll?: string;
  armor_class?: Array<{ value: number }> | number;
  dexterity?: number;
}

export function useCombat({ sessionId, campaignId, onCombatEvent }: UseCombatProps) {
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // =========================================
  // AUTO-SAVE COMBAT STATE ON CHANGES
  // =========================================
  useEffect(() => {
    // Only save if we have an active combat
    if (!combatState || !combatState.isActive || !sessionId) return;

    // Debounce the save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            combat_state: combatState,
          }),
        });

        if (response.ok) {
          console.log('[Combat] Auto-saved combat state');
        } else {
          console.error('[Combat] Failed to save combat state:', await response.text());
        }
      } catch (error) {
        console.error('[Combat] Failed to auto-save:', error);
      }
    }, 1500); // Debounce 1.5 seconds

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [combatState, sessionId]);

  // =========================================
  // DISPATCH COMBAT STATE CHANGES
  // =========================================
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('combat-state-change', {
      detail: { isActive: combatState?.isActive ?? false }
    }));
  }, [combatState?.isActive]);

  // =========================================
  // LISTEN FOR ADD-ENTITY-TO-COMBAT EVENTS
  // =========================================
  useEffect(() => {
    const handleAddEntity = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<Combatant>>;
      if (combatState?.isActive) {
        const combatant = customEvent.detail;
        setCombatState(prev => {
          if (!prev) return prev;

          const newCombatant: Combatant = {
            id: combatant.id || uuidv4(),
            name: combatant.name || 'Unknown',
            displayName: combatant.displayName || combatant.name || 'Unknown',
            type: combatant.type || 'monster',
            initiative: combatant.initiative || 10,
            initiativeModifier: combatant.initiativeModifier || 0,
            hp: combatant.hp || 10,
            maxHp: combatant.maxHp || combatant.hp || 10,
            tempHp: 0,
            ac: combatant.ac || 10,
            conditions: [],
            isActive: false,
            isVisible: true,
            isDefeated: false,
            entityId: combatant.entityId,
            statBlock: combatant.statBlock,
            ...combatant,
          };

          const combatants = [...prev.combatants, newCombatant];
          combatants.sort((a, b) => b.initiative - a.initiative);

          const activeIndex = combatants.findIndex(c => c.isActive);

          return {
            ...prev,
            combatants,
            turnIndex: activeIndex >= 0 ? activeIndex : prev.turnIndex,
            combatLog: [...prev.combatLog, {
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              round: prev.round,
              type: 'custom',
              description: `${newCombatant.displayName} joins the battle!`,
            }],
          };
        });
      }
    };

    window.addEventListener('add-entity-to-combat', handleAddEntity);
    return () => {
      window.removeEventListener('add-entity-to-combat', handleAddEntity);
    };
  }, [combatState?.isActive]);

  // =========================================
  // START COMBAT
  // =========================================
  const startCombat = useCallback(async (encounterId?: string) => {
    setIsLoading(true);

    try {
      // Fetch party members (players only)
      const partyResponse = await fetch(`/api/entities?campaignId=${campaignId}&entityType=player`);
      const allEntities: EntityData[] = partyResponse.ok ? await partyResponse.json() : [];

      // Filter to only players (in case API doesn't filter correctly)
      const players = allEntities.filter((e) =>
        (e as unknown as { entity_type: string }).entity_type === 'player'
      );

      console.log(`[Combat] Loaded ${players.length} players from ${allEntities.length} entities`);

      // Initialize combatants array
      const combatants: Combatant[] = [];

      // Add players
      players.forEach((player) => {
        const dexMod = Math.floor(((player.mechanics?.abilities?.dex || 10) - 10) / 2);
        combatants.push({
          id: `player-${player.id}`,
          entityId: player.id,
          name: player.name,
          displayName: player.name,
          type: 'player',
          initiative: 10, // DM will adjust
          initiativeModifier: dexMod,
          hp: player.mechanics?.hp_current || player.mechanics?.hp_max || 10,
          maxHp: player.mechanics?.hp_max || 10,
          tempHp: 0,
          ac: player.mechanics?.ac || 10,
          conditions: [],
          isActive: false,
          isVisible: true,
          isDefeated: false,
        });
      });

      // If we have an encounter, fetch and add creatures
      if (encounterId) {
        const encounterResponse = await fetch(`/api/entities/${encounterId}`);
        if (encounterResponse.ok) {
          const encounter: EntityData = await encounterResponse.json();
          const creatures = encounter.mechanics?.creatures || [];

          for (const creature of creatures) {
            const count = creature.count || 1;

            // Try to get stats from SRD or entity
            let statBlock: Record<string, unknown> | null = null;
            let baseHp = 10;
            let baseAc = 10;
            let dexMod = 0;
            let hpFormula = creature.hpFormula;

            if (creature.srdId) {
              // Fetch from SRD
              const srdResponse = await fetch(`/api/srd/creatures/${creature.srdId}`);
              if (srdResponse.ok) {
                const srdData: SrdCreature = await srdResponse.json();
                statBlock = srdData as Record<string, unknown>;
                baseHp = srdData.hit_points || 10;
                baseAc = Array.isArray(srdData.armor_class)
                  ? srdData.armor_class[0]?.value || 10
                  : (srdData.armor_class as number) || 10;
                dexMod = Math.floor(((srdData.dexterity || 10) - 10) / 2);
                hpFormula = srdData.hit_points_roll || hpFormula;
              }
            } else if (creature.entityId) {
              // Fetch from campaign entity
              const entityResponse = await fetch(`/api/entities/${creature.entityId}`);
              if (entityResponse.ok) {
                const entity: EntityData = await entityResponse.json();
                statBlock = entity.mechanics?.statBlock || entity.mechanics as Record<string, unknown>;
                baseHp = entity.mechanics?.hp || 10;
                baseAc = entity.mechanics?.ac || 10;
                dexMod = Math.floor(((entity.mechanics?.abilities?.dex || 10) - 10) / 2);
              }
            }

            // Roll initiative once for the group
            const groupInitiative = rollInitiative(dexMod);

            // Add individual creatures
            for (let i = 0; i < count; i++) {
              // Roll individual HP if we have a formula
              const rolledHp = hpFormula ? rollHpFormula(hpFormula) : baseHp;

              combatants.push({
                id: `monster-${creature.srdId || creature.entityId || creature.name}-${i + 1}`,
                entityId: creature.entityId,
                srdId: creature.srdId,
                name: creature.name,
                displayName: count > 1 ? `${creature.name} ${i + 1}` : creature.name,
                type: 'monster',
                initiative: groupInitiative,
                initiativeModifier: dexMod,
                hp: rolledHp,
                maxHp: rolledHp,
                tempHp: 0,
                ac: baseAc,
                conditions: [],
                isActive: false,
                isVisible: true,
                isDefeated: false,
                statBlock: statBlock || undefined,
              });
            }
          }
        }
      }

      // Sort by initiative (high to low)
      combatants.sort((a, b) => b.initiative - a.initiative);

      // Set first combatant as active
      if (combatants.length > 0) {
        combatants[0].isActive = true;
      }

      // Create combat state
      const newCombatState: CombatState = {
        id: uuidv4(),
        sessionId,
        encounterId,
        isActive: true,
        round: 1,
        turnIndex: 0,
        combatants,
        combatLog: [{
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          round: 1,
          type: 'custom',
          description: '⚔️ Combat Started!',
        }],
        startedAt: new Date().toISOString(),
      };

      setCombatState(newCombatState);

      // Log combat start event
      onCombatEvent?.({
        type: 'combat_start',
        title: 'Combat Started',
        description: `Initiative rolled for ${combatants.length} combatants`,
        payload: { combatantCount: combatants.length, encounterId },
      });

      // Save combat state to session
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          combat_state: newCombatState,
          status: 'active',
        }),
      });

    } catch (error) {
      console.error('Failed to start combat:', error);
    }

    setIsLoading(false);
  }, [sessionId, campaignId, onCombatEvent]);

  // =========================================
  // NEXT TURN
  // =========================================
  const nextTurn = useCallback(() => {
    if (!combatState) return;

    setCombatState(prev => {
      if (!prev) return prev;

      const combatants = [...prev.combatants];

      // Deactivate current
      combatants[prev.turnIndex].isActive = false;

      // Find next non-defeated combatant
      let nextIndex = prev.turnIndex;
      let newRound = prev.round;
      let attempts = 0;

      do {
        nextIndex = (nextIndex + 1) % combatants.length;
        if (nextIndex === 0) {
          newRound++;
        }
        attempts++;
      } while (combatants[nextIndex].isDefeated && attempts < combatants.length);

      // Activate next
      combatants[nextIndex].isActive = true;

      const logEntry: CombatLogEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        round: newRound,
        type: 'turn_start',
        actorId: combatants[nextIndex].id,
        description: `${combatants[nextIndex].displayName}'s turn`,
      };

      return {
        ...prev,
        round: newRound,
        turnIndex: nextIndex,
        combatants,
        combatLog: [...prev.combatLog, logEntry],
      };
    });
  }, [combatState]);

  // =========================================
  // PREVIOUS TURN
  // =========================================
  const previousTurn = useCallback(() => {
    if (!combatState) return;

    setCombatState(prev => {
      if (!prev) return prev;

      const combatants = [...prev.combatants];

      // Deactivate current
      combatants[prev.turnIndex].isActive = false;

      // Find previous non-defeated combatant
      let prevIndex = prev.turnIndex;
      let newRound = prev.round;
      let attempts = 0;

      do {
        prevIndex = prevIndex - 1;
        if (prevIndex < 0) {
          prevIndex = combatants.length - 1;
          newRound = Math.max(1, newRound - 1);
        }
        attempts++;
      } while (combatants[prevIndex].isDefeated && attempts < combatants.length);

      // Activate previous
      combatants[prevIndex].isActive = true;

      return {
        ...prev,
        round: newRound,
        turnIndex: prevIndex,
        combatants,
      };
    });
  }, [combatState]);

  // =========================================
  // UPDATE COMBATANT HP
  // =========================================
  const updateHp = useCallback((combatantId: string, change: number, isDamage: boolean = true) => {
    setCombatState(prev => {
      if (!prev) return prev;

      const combatants = prev.combatants.map(c => {
        if (c.id !== combatantId) return c;

        let newHp = c.hp;
        let newTempHp = c.tempHp;

        if (isDamage && change < 0) {
          // Apply damage to temp HP first
          const damage = Math.abs(change);
          if (newTempHp > 0) {
            const tempDamage = Math.min(newTempHp, damage);
            newTempHp -= tempDamage;
            newHp -= (damage - tempDamage);
          } else {
            newHp += change; // change is negative
          }
        } else {
          // Healing
          newHp = Math.min(c.maxHp, c.hp + Math.abs(change));
        }

        newHp = Math.max(0, newHp);

        return {
          ...c,
          hp: newHp,
          tempHp: newTempHp,
          isDefeated: newHp <= 0,
          deathSaves: newHp <= 0 && c.type === 'player'
            ? { successes: 0, failures: 0 }
            : c.deathSaves,
        };
      });

      const target = combatants.find(c => c.id === combatantId);
      const logEntry: CombatLogEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        round: prev.round,
        type: isDamage ? 'damage' : 'healing',
        targetId: combatantId,
        value: Math.abs(change),
        description: isDamage
          ? `${target?.displayName} takes ${Math.abs(change)} damage (${target?.hp} HP remaining)`
          : `${target?.displayName} heals ${Math.abs(change)} HP (${target?.hp} HP)`,
      };

      return {
        ...prev,
        combatants,
        combatLog: [...prev.combatLog, logEntry],
      };
    });
  }, []);

  // =========================================
  // UPDATE INITIATIVE
  // =========================================
  const updateInitiative = useCallback((combatantId: string, newInitiative: number) => {
    setCombatState(prev => {
      if (!prev) return prev;

      const combatants = prev.combatants.map(c =>
        c.id === combatantId ? { ...c, initiative: newInitiative } : c
      );

      // Re-sort by initiative
      combatants.sort((a, b) => b.initiative - a.initiative);

      // Find new turn index for active combatant
      const activeIndex = combatants.findIndex(c => c.isActive);

      return {
        ...prev,
        combatants,
        turnIndex: activeIndex >= 0 ? activeIndex : prev.turnIndex,
      };
    });
  }, []);

  // =========================================
  // TOGGLE CONDITION
  // =========================================
  const toggleCondition = useCallback((combatantId: string, condition: Condition) => {
    setCombatState(prev => {
      if (!prev) return prev;

      const combatants = prev.combatants.map(c => {
        if (c.id !== combatantId) return c;

        const hasCondition = c.conditions.includes(condition);
        return {
          ...c,
          conditions: hasCondition
            ? c.conditions.filter(cond => cond !== condition)
            : [...c.conditions, condition],
        };
      });

      const target = combatants.find(c => c.id === combatantId);
      const hasCondition = target?.conditions.includes(condition);

      const logEntry: CombatLogEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        round: prev.round,
        type: 'condition',
        targetId: combatantId,
        description: hasCondition
          ? `${target?.displayName} is now ${condition}`
          : `${target?.displayName} is no longer ${condition}`,
      };

      return {
        ...prev,
        combatants,
        combatLog: [...prev.combatLog, logEntry],
      };
    });
  }, []);

  // =========================================
  // ADD COMBATANT MID-COMBAT
  // =========================================
  const addCombatant = useCallback((combatant: Partial<Combatant>) => {
    setCombatState(prev => {
      if (!prev) return prev;

      const newCombatant: Combatant = {
        id: combatant.id || uuidv4(),
        name: combatant.name || 'Unknown',
        displayName: combatant.displayName || combatant.name || 'Unknown',
        type: combatant.type || 'monster',
        initiative: combatant.initiative || 10,
        initiativeModifier: combatant.initiativeModifier || 0,
        hp: combatant.hp || 10,
        maxHp: combatant.maxHp || combatant.hp || 10,
        tempHp: 0,
        ac: combatant.ac || 10,
        conditions: [],
        isActive: false,
        isVisible: true,
        isDefeated: false,
        ...combatant,
      };

      const combatants = [...prev.combatants, newCombatant];
      combatants.sort((a, b) => b.initiative - a.initiative);

      // Recalculate turn index
      const activeIndex = combatants.findIndex(c => c.isActive);

      return {
        ...prev,
        combatants,
        turnIndex: activeIndex >= 0 ? activeIndex : prev.turnIndex,
        combatLog: [...prev.combatLog, {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          round: prev.round,
          type: 'custom',
          description: `${newCombatant.displayName} joins the battle!`,
        }],
      };
    });
  }, []);

  // =========================================
  // REMOVE COMBATANT
  // =========================================
  const removeCombatant = useCallback((combatantId: string) => {
    setCombatState(prev => {
      if (!prev) return prev;

      const removed = prev.combatants.find(c => c.id === combatantId);
      const combatants = prev.combatants.filter(c => c.id !== combatantId);

      // If we removed the active combatant, activate the next one
      let turnIndex = prev.turnIndex;
      if (removed?.isActive && combatants.length > 0) {
        turnIndex = Math.min(turnIndex, combatants.length - 1);
        combatants[turnIndex].isActive = true;
      }

      return {
        ...prev,
        combatants,
        turnIndex,
        combatLog: [...prev.combatLog, {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          round: prev.round,
          type: 'custom',
          description: `${removed?.displayName} removed from combat`,
        }],
      };
    });
  }, []);

  // =========================================
  // REORDER COMBATANTS (drag-and-drop)
  // =========================================
  const reorderCombatants = useCallback((newCombatants: Combatant[]) => {
    setCombatState(prev => {
      if (!prev) return prev;

      // Find the new index of the active combatant
      const activeIndex = newCombatants.findIndex(c => c.isActive);

      return {
        ...prev,
        combatants: newCombatants,
        turnIndex: activeIndex >= 0 ? activeIndex : 0,
      };
    });
  }, []);

  // =========================================
  // END COMBAT
  // =========================================
  const endCombat = useCallback(async (generateLoot: boolean = true) => {
    console.log('[Combat] endCombat called, generateLoot:', generateLoot);
    console.log('[Combat] Current combat state:', combatState);

    if (!combatState) {
      console.error('[Combat] No combat state to end!');
      return;
    }

    setIsLoading(true);

    try {
      // Calculate combat stats
      const duration = combatState.startedAt
        ? Math.floor((Date.now() - new Date(combatState.startedAt).getTime()) / 1000)
        : 0;

      const defeatedMonsters = combatState.combatants.filter(
        c => c.type === 'monster' && c.isDefeated
      );

      console.log('[Combat] Duration:', duration, 'seconds');
      console.log('[Combat] Defeated monsters:', defeatedMonsters.length);

      // Generate loot if enabled and we have an encounter
      let lootPileId = null;
      if (generateLoot && combatState.encounterId) {
        console.log('[Combat] Generating loot for encounter:', combatState.encounterId);
        try {
          // Fetch encounter for loot data
          const encounterResponse = await fetch(`/api/entities/${combatState.encounterId}`);
          if (encounterResponse.ok) {
            const encounter: EntityData = await encounterResponse.json();
            const rewards = encounter.mechanics?.rewards || encounter.mechanics?.loot;
            console.log('[Combat] Encounter rewards:', rewards);

            if (rewards) {
              // Create a loot pile entity
              const lootResponse = await fetch('/api/entities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  campaign_id: campaignId,
                  entity_type: 'item',
                  sub_type: 'loot_pile',
                  name: `Loot from ${encounter.name || 'Combat'}`,
                  summary: `Loot collected after defeating ${defeatedMonsters.length} enemies`,
                  status: 'active',
                  forge_status: 'complete',
                  mechanics: {
                    items: rewards.items || [],
                    gold: rewards.gold || 0,
                    xp: rewards.xp || 0,
                  },
                }),
              });

              if (lootResponse.ok) {
                const lootPile = await lootResponse.json();
                lootPileId = lootPile.id;
                console.log('[Combat] Created loot pile:', lootPileId);
              } else {
                console.error('[Combat] Failed to create loot pile:', await lootResponse.text());
              }
            }
          }
        } catch (error) {
          console.error('[Combat] Failed to generate loot:', error);
        }
      }

      // Log combat end event
      console.log('[Combat] Dispatching combat_end event');
      onCombatEvent?.({
        type: 'combat_end',
        title: 'Combat Ended',
        description: `${defeatedMonsters.length} enemies defeated in ${combatState.round} rounds`,
        payload: {
          rounds: combatState.round,
          duration,
          defeatedCount: defeatedMonsters.length,
          lootPileId,
        },
      });

      // Update player HP in the database (commit combat changes)
      const playerCombatants = combatState.combatants.filter(c => c.type === 'player' && c.entityId);
      console.log('[Combat] Updating HP for players:', playerCombatants.map(p => p.name));

      for (const player of playerCombatants) {
        try {
          const response = await fetch(`/api/entities/${player.entityId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mechanics: {
                hp_current: player.hp,
              },
            }),
          });
          console.log(`[Combat] Updated ${player.name} HP:`, response.ok);
        } catch (err) {
          console.error(`[Combat] Failed to update ${player.name}:`, err);
        }
      }

      // Clear combat state from session
      console.log('[Combat] Clearing combat state from session:', sessionId);
      const clearResponse = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          combat_state: null,
        }),
      });

      if (!clearResponse.ok) {
        const errorText = await clearResponse.text();
        console.error('[Combat] Failed to clear combat state:', errorText);
      } else {
        console.log('[Combat] Session combat_state cleared');
      }

      // Reset local state
      console.log('[Combat] Resetting local combat state');
      setCombatState(null);
      console.log('[Combat] Combat ended successfully!');

    } catch (error) {
      console.error('[Combat] Failed to end combat:', error);
    }

    setIsLoading(false);
  }, [combatState, sessionId, campaignId, onCombatEvent]);

  // =========================================
  // LOAD EXISTING COMBAT
  // =========================================
  const loadCombat = useCallback((state: CombatState) => {
    setCombatState(state);
  }, []);

  return {
    combatState,
    isLoading,
    startCombat,
    endCombat,
    loadCombat,
    nextTurn,
    previousTurn,
    updateHp,
    updateInitiative,
    toggleCondition,
    addCombatant,
    removeCombatant,
    reorderCombatants,
  };
}
