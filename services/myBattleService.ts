import AsyncStorage from '@react-native-async-storage/async-storage';

import { getBattlesByIds } from '@/services/battleService';
import { getVoteResultsByBattleIds } from '@/services/voteService';
import type { MyBattleListItem } from '@/types';

const CREATED_BATTLE_IDS_KEY = 'pickone_created_battle_ids';
const MAX_CREATED_BATTLE_IDS = 100;

async function setCreatedBattleIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(CREATED_BATTLE_IDS_KEY, JSON.stringify(ids));
}

export async function getCreatedBattleIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(CREATED_BATTLE_IDS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export async function addCreatedBattleId(battleId: string): Promise<void> {
  const existing = await getCreatedBattleIds();
  const deduped = [battleId, ...existing.filter((id) => id !== battleId)].slice(
    0,
    MAX_CREATED_BATTLE_IDS
  );
  await setCreatedBattleIds(deduped);
}

export async function getMyBattleListItems(limit = 20): Promise<MyBattleListItem[]> {
  const battleIds = (await getCreatedBattleIds()).slice(0, limit);
  if (battleIds.length === 0) return [];

  const battles = await getBattlesByIds(battleIds);
  const activeBattles = battles.filter((battle) => battle.is_active);
  const activeIds = activeBattles.map((battle) => battle.id);

  // Clean up missing/deleted/inactive IDs to keep local state healthy.
  if (activeIds.length !== battleIds.length) {
    await setCreatedBattleIds(activeIds);
  }

  if (activeIds.length === 0) return [];

  const resultsByBattleId = await getVoteResultsByBattleIds(activeIds);

  return activeBattles.map((battle) => ({
    battle,
    result: resultsByBattleId[battle.id] ?? {
      battle_id: battle.id,
      winner_choice: null,
      total: 0,
      a_count: 0,
      b_count: 0,
      a_percent: 0,
      b_percent: 0,
    },
  }));
}
