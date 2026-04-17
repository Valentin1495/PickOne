import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { getOrCreateAnonymousUserId } from '@/services/identityService';
import type {
  BattleMode,
  DuelVoteResult,
  SingleReactionVoteResult,
  SubmitVoteInput,
  Vote,
  VoteResult,
  VoteResultByBattleId,
} from '@/types';

const FINGERPRINT_KEY = 'pickone_voter_fingerprint';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getOrCreateFingerprint(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(FINGERPRINT_KEY);
    if (stored) return stored;

    const newFingerprint = generateUUID();
    await AsyncStorage.setItem(FINGERPRINT_KEY, newFingerprint);
    return newFingerprint;
  } catch {
    return generateUUID();
  }
}

export async function hasAlreadyVoted(battleId: string): Promise<boolean> {
  const fingerprint = await getOrCreateFingerprint();

  const { data } = await supabase
    .from('votes')
    .select('id')
    .eq('battle_id', battleId)
    .eq('voter_fingerprint', fingerprint)
    .maybeSingle();

  return !!data;
}

export async function submitVote(input: SubmitVoteInput): Promise<Vote> {
  const fingerprint = await getOrCreateFingerprint();
  const voterUserId = input.voterUserId ?? (await getOrCreateAnonymousUserId());
  const isSingleReaction = input.mode === 'single_reaction';
  const choice =
    input.mode === 'duel' ? input.choice : input.reaction === 'LIKE' ? 'A' : 'B';

  const { data, error } = await supabase
    .from('votes')
    .insert({
      battle_id: input.battleId,
      choice,
      reaction: isSingleReaction ? input.reaction : null,
      voter_user_id: voterUserId,
      voter_fingerprint: fingerprint,
      invite_token: input.inviteToken,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('ALREADY_VOTED');
    }
    throw new Error(`Failed to submit vote: ${error.message}`);
  }

  // TODO: KPI - vote_submitted event { battle_id: input.battleId, choice: input.choice }

  return data as Vote;
}

function calculateVoteResult(aCount: number, bCount: number): DuelVoteResult {
  const total = aCount + bCount;
  return {
    mode: 'duel',
    total,
    a_count: aCount,
    b_count: bCount,
    a_percent: total > 0 ? Math.round((aCount / total) * 100) : 0,
    b_percent: total > 0 ? Math.round((bCount / total) * 100) : 0,
  };
}

function calculateSingleReactionResult(
  likeCount: number,
  dislikeCount: number
): SingleReactionVoteResult {
  const total = likeCount + dislikeCount;
  return {
    mode: 'single_reaction',
    total,
    like_count: likeCount,
    dislike_count: dislikeCount,
    like_percent: total > 0 ? Math.round((likeCount / total) * 100) : 0,
    dislike_percent: total > 0 ? Math.round((dislikeCount / total) * 100) : 0,
  };
}

export async function getVoteResults(battleId: string, mode: BattleMode = 'duel'): Promise<VoteResult> {
  const { data, error } = await supabase
    .from('votes')
    .select('choice, reaction')
    .eq('battle_id', battleId);

  if (error) throw new Error(`Failed to get results: ${error.message}`);

  const votes = data ?? [];
  if (mode === 'single_reaction') {
    const likeCount = votes.filter((v) => v.reaction === 'LIKE' || v.choice === 'A').length;
    const dislikeCount = votes.filter((v) => v.reaction === 'DISLIKE' || v.choice === 'B').length;
    return calculateSingleReactionResult(likeCount, dislikeCount);
  }

  const aCount = votes.filter((v) => v.choice === 'A').length;
  const bCount = votes.filter((v) => v.choice === 'B').length;
  return calculateVoteResult(aCount, bCount);
}

export async function getVoteResultsByBattleIds(
  battleIds: string[]
): Promise<Record<string, VoteResultByBattleId>> {
  if (battleIds.length === 0) return {};

  const { data, error } = await supabase
    .from('votes')
    .select('battle_id, choice')
    .in('battle_id', battleIds);

  if (error) throw new Error(`Failed to get batched vote results: ${error.message}`);

  const counts: Record<string, { a: number; b: number }> = {};

  for (const battleId of battleIds) {
    counts[battleId] = { a: 0, b: 0 };
  }

  for (const row of data ?? []) {
    const battleId = row.battle_id as string;
    if (!counts[battleId]) continue;

    if (row.choice === 'A') counts[battleId].a += 1;
    if (row.choice === 'B') counts[battleId].b += 1;
  }

  const results: Record<string, VoteResultByBattleId> = {};

  for (const battleId of battleIds) {
    const battleCounts = counts[battleId] ?? { a: 0, b: 0 };
    const summary = calculateVoteResult(battleCounts.a, battleCounts.b);
    const winnerChoice =
      summary.total === 0 || summary.a_count === summary.b_count
        ? null
        : summary.a_count > summary.b_count
          ? 'A'
          : 'B';

    results[battleId] = {
      battle_id: battleId,
      winner_choice: winnerChoice,
      ...summary,
    };
  }

  return results;
}
