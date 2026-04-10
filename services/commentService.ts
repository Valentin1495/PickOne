import { supabase } from '@/lib/supabase';
import { getOrCreateFingerprint } from '@/services/voteService';
import type { VoteComment } from '@/types';

type SubmitVoteCommentInput = {
  voteId: string;
  battleId: string;
  commentText: string;
  inviteToken?: string;
};

type GetBattleCommentsInput = {
  battleId: string;
  inviteToken?: string;
  limit?: number;
};

function normalizeComment(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function mapCommentError(error: unknown): Error {
  if (!(error instanceof Error)) return new Error('댓글 저장에 실패했어요.');
  if (error.message.includes('COMMENT_LENGTH_INVALID')) {
    return new Error('댓글은 2자 이상 80자 이하로 입력해 주세요.');
  }
  if (error.message.includes('COMMENT_BLOCKED_CONTENT')) {
    return new Error('연락처/링크/부적절한 표현은 입력할 수 없어요.');
  }
  if (error.message.includes('RATE_LIMIT')) {
    return new Error('잠시 후 다시 시도해 주세요.');
  }
  if (error.message.includes('NOT_ALLOWED')) {
    return new Error('댓글을 볼 수 있는 사용자만 작성할 수 있어요.');
  }
  return error;
}

export async function submitVoteComment(input: SubmitVoteCommentInput): Promise<void> {
  const text = normalizeComment(input.commentText);
  if (!text) return;

  const fingerprint = await getOrCreateFingerprint();
  const { error } = await supabase.rpc('create_vote_comment', {
    p_vote_id: input.voteId,
    p_battle_id: input.battleId,
    p_comment_text: text,
    p_voter_fingerprint: fingerprint,
    p_invite_token: input.inviteToken ?? null,
  });

  if (error) throw mapCommentError(new Error(error.message));
}

export async function getBattleComments(input: GetBattleCommentsInput): Promise<VoteComment[]> {
  const fingerprint = await getOrCreateFingerprint();
  const { data, error } = await supabase.rpc('get_battle_comments_secure', {
    p_battle_id: input.battleId,
    p_invite_token: input.inviteToken ?? null,
    p_voter_fingerprint: fingerprint,
    p_limit: input.limit ?? 30,
  });

  if (error) {
    if (error.message.includes('NOT_ALLOWED')) return [];
    throw new Error(`Failed to get comments: ${error.message}`);
  }

  return (data ?? []) as VoteComment[];
}
