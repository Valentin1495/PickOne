import { supabase } from '@/lib/supabase';
import type { Choice, ReasonKey, ReasonSummary, SlotReasonSummary } from '@/types';

export const REASON_LABELS: Record<ReasonKey, string> = {
  natural: '더 자연스러워 보여서',
  bright_clear: '더 밝고 선명해서',
  balanced_lighting: '조명이 더 고르고 안정적이어서',
  comfortable_expression: '표정이 더 편안해 보여서',
  better_eye_contact: '시선 처리가 더 안정적이어서',
  clear_background: '배경이 더 깔끔해서',
  good_mood: '전체 분위기가 더 좋아서',
  confident_vibe: '더 자신감 있어 보여서',
  profile_fit: '프로필 사진으로 더 적합해서',
  general_use_fit: '여러 용도로 활용하기 좋아서',
  clean_impression: '더 깔끔한 느낌이어서',
  friendly_impression: '더 친근한 인상이어서',
  stable_composition: '사진 구도가 더 안정적이어서',
};

export const REASON_KEYS = Object.keys(REASON_LABELS) as ReasonKey[];

export async function submitVoteReasons(
  voteId: string,
  battleId: string,
  slot: Choice,
  reasons: ReasonKey[],
): Promise<void> {
  if (reasons.length === 0) return;

  const rows = reasons.map((reason_key) => ({
    vote_id: voteId,
    battle_id: battleId,
    selected_slot: slot,
    reason_key,
  }));

  const { error } = await supabase.from('vote_reasons').insert(rows);
  if (error) throw new Error(`Failed to submit reasons: ${error.message}`);
}

type RawReason = { selected_slot: string; reason_key: string };

function buildSlotSummary(
  slotReasons: RawReason[],
  slot: Choice,
  votePercent: number,
): SlotReasonSummary {
  const counts: Partial<Record<ReasonKey, number>> = {};
  for (const r of slotReasons) {
    const key = r.reason_key as ReasonKey;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const topReasons = (Object.entries(counts) as [ReasonKey, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => key);

  const labelList = topReasons.map((k) => `'${REASON_LABELS[k]}'`).join(', ');
  let summaryText = '';

  if (topReasons.length === 0) {
    summaryText = `${slot} 사진에 대한 이유 피드백이 아직 없어요.`;
  } else if (votePercent >= 70) {
    summaryText = `대부분의 사람들이 ${slot} 사진을 ${labelList} 이유로 선택했어요.`;
  } else if (votePercent >= 55) {
    summaryText = `${slot} 사진이 ${labelList} 측면에서 조금 더 선호되는 경향이 있어요.`;
  } else {
    summaryText = `${slot} 사진은 ${labelList} 면에서 반응이 있었어요.`;
  }

  return { topReasons, summaryText };
}

export async function getReasonSummary(
  battleId: string,
  aPercent: number,
  bPercent: number,
): Promise<ReasonSummary> {
  const { data, error } = await supabase
    .from('vote_reasons')
    .select('selected_slot, reason_key')
    .eq('battle_id', battleId);

  if (error) throw new Error(`Failed to get reasons: ${error.message}`);

  const rows: RawReason[] = data ?? [];
  const aRows = rows.filter((r) => r.selected_slot === 'A');
  const bRows = rows.filter((r) => r.selected_slot === 'B');

  const a = buildSlotSummary(aRows, 'A', aPercent);
  const b = buildSlotSummary(bRows, 'B', bPercent);

  let overallText = '';
  if (aPercent >= 70) {
    overallText = `투표 결과 A 사진이 크게 앞서고 있어요.`;
  } else if (bPercent >= 70) {
    overallText = `투표 결과 B 사진이 크게 앞서고 있어요.`;
  } else if (Math.abs(aPercent - bPercent) <= 10) {
    overallText = `두 사진 모두 비슷한 반응을 얻고 있어요.`;
  } else {
    const leader = aPercent > bPercent ? 'A' : 'B';
    overallText = `${leader} 사진이 조금 더 선호되는 경향이에요.`;
  }

  return { a, b, overallText };
}
