export type Choice = 'A' | 'B';

export interface Battle {
  id: string;
  created_at: string;
  creator_user_id: string | null;
  title: string | null;
  invite_token: string;
  image_a_url: string;
  image_b_url: string;
  is_active: boolean;
}

export interface Vote {
  id: string;
  created_at: string;
  battle_id: string;
  choice: Choice;
  voter_user_id: string | null;
  voter_fingerprint: string;
  invite_token: string | null;
}

export interface VoteResult {
  total: number;
  a_count: number;
  b_count: number;
  a_percent: number;
  b_percent: number;
}

export interface VoteResultByBattleId extends VoteResult {
  battle_id: string;
  winner_choice: Choice | null;
}

export interface PickedImage {
  uri: string;
  previewUri?: string;
  base64Data?: string;
  mimeType?: string;
}

export interface CreateBattleInput {
  title?: string;
  imageA: PickedImage;
  imageB: PickedImage;
  creatorUserId?: string;
}

export interface SubmitVoteInput {
  battleId: string;
  choice: Choice;
  inviteToken: string;
  voterUserId?: string;
}

export interface AiAnalysis {
  brightness: number;
  sharpness: number;
  composition: number;
  expressionNaturalness: number;
  overallScore: number;
}

export interface ImageAnalysis {
  imageA: AiAnalysis;
  imageB: AiAnalysis;
}

export type ReasonKey =
  | 'natural'
  | 'bright_clear'
  | 'balanced_lighting'
  | 'comfortable_expression'
  | 'better_eye_contact'
  | 'clear_background'
  | 'good_mood'
  | 'confident_vibe'
  | 'profile_fit'
  | 'general_use_fit'
  | 'clean_impression'
  | 'friendly_impression'
  | 'stable_composition';

export interface VoteReason {
  id: string;
  vote_id: string;
  battle_id: string;
  selected_slot: Choice;
  reason_key: ReasonKey;
  created_at: string;
}

export interface VoteComment {
  id: string;
  vote_id: string;
  battle_id: string;
  comment_text: string;
  created_at: string;
}

export interface AiFeedback {
  brightness: 'good' | 'ok' | 'low';
  sharpness: 'good' | 'ok' | 'low';
  composition: 'good' | 'ok' | 'needs_improvement';
  expression: 'natural' | 'neutral' | 'awkward';
  occlusion: boolean;
  profile_suitability: 'high' | 'medium' | 'low';
  summary: string;
}

export interface BattleAiFeedback {
  imageA: AiFeedback;
  imageB: AiFeedback;
}

export interface ReasonCount {
  reason_key: ReasonKey;
  count: number;
}

export interface SlotReasonSummary {
  topReasons: ReasonKey[];
  summaryText: string;
}

export interface ReasonSummary {
  a: SlotReasonSummary;
  b: SlotReasonSummary;
  overallText: string;
}

export interface MyBattleListItem {
  battle: Battle;
  result: VoteResultByBattleId;
}
