import type { AiFeedback, BattleAiFeedback, ReasonSummary, VoteResult } from '@/types';

type Grade2 = 'good' | 'ok' | 'low';
type Grade3 = 'good' | 'ok' | 'needs_improvement';
type ExprGrade = 'natural' | 'neutral' | 'awkward';
type SuitGrade = 'high' | 'medium' | 'low';

function pick<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

const BRIGHTNESS_SUMMARIES: Record<Grade2, string> = {
  good: '밝기가 적절해서 인상이 환해 보여요.',
  ok: '밝기가 무난한 편이에요.',
  low: '조금 더 밝은 환경에서 촬영하면 더 좋아질 것 같아요.',
};

const EXPRESSION_SUMMARIES: Record<ExprGrade, string> = {
  natural: '표정이 자연스럽고 편안해 보여요.',
  neutral: '표정이 차분하고 깔끔한 느낌이에요.',
  awkward: '표정을 조금 더 자연스럽게 하면 더 좋아질 것 같아요.',
};

const PROFILE_SUMMARIES: Record<SuitGrade, string> = {
  high: '프로필 사진으로 잘 어울려요.',
  medium: '프로필 사진으로 무난하게 활용할 수 있어요.',
  low: '구도나 밝기를 조금 조정하면 더 좋아질 것 같아요.',
};

function generateMockAiFeedback(): AiFeedback {
  const brightness = pick<Grade2>(['good', 'good', 'ok', 'low']);
  const sharpness = pick<Grade2>(['good', 'good', 'ok', 'low']);
  const composition = pick<Grade3>(['good', 'ok', 'needs_improvement']);
  const expression = pick<ExprGrade>(['natural', 'natural', 'neutral', 'awkward']);
  const profile_suitability = pick<SuitGrade>(['high', 'medium', 'low']);
  const occlusion = Math.random() < 0.1;

  const parts = [
    BRIGHTNESS_SUMMARIES[brightness],
    EXPRESSION_SUMMARIES[expression],
    PROFILE_SUMMARIES[profile_suitability],
  ];

  return {
    brightness,
    sharpness,
    composition,
    expression,
    occlusion,
    profile_suitability,
    summary: parts.join(' '),
  };
}

export async function analyzeBattleImages(
  _imageAUrl: string,
  _imageBUrl: string,
): Promise<BattleAiFeedback> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    imageA: generateMockAiFeedback(),
    imageB: generateMockAiFeedback(),
  };
}

export function generateFinalInsight(
  voteResult: VoteResult,
  reasonSummary: ReasonSummary | null,
  aiFeedback: BattleAiFeedback | null,
): string {
  const { a_percent, b_percent, total } = voteResult;

  if (total === 0) {
    return '아직 투표 결과가 없어요. 친구에게 공유해서 반응을 모아보세요.';
  }

  const leader = a_percent >= b_percent ? 'A' : 'B';
  const leaderFeedback = aiFeedback ? (leader === 'A' ? aiFeedback.imageA : aiFeedback.imageB) : null;
  const leaderReasons = reasonSummary ? (leader === 'A' ? reasonSummary.a : reasonSummary.b) : null;
  const diff = Math.abs(a_percent - b_percent);

  if (diff <= 10) {
    const aiNote =
      leaderFeedback && leaderFeedback.profile_suitability === 'high'
        ? `${leader} 사진은 프로필 적합도가 높다는 분석도 있어요.`
        : '';
    return `두 사진 모두 비슷한 반응을 받고 있어요. ${aiNote}`.trim();
  }

  const humanPart =
    leaderReasons && leaderReasons.topReasons.length > 0
      ? `'${leaderReasons.topReasons
          .slice(0, 1)
          .map((k) => {
            const labels: Record<string, string> = {
              natural: '자연스러움',
              bright_clear: '밝고 선명함',
              balanced_lighting: '고른 조명',
              comfortable_expression: '편안한 표정',
              better_eye_contact: '안정적인 시선 처리',
              clear_background: '깔끔한 배경',
              good_mood: '좋은 분위기',
              confident_vibe: '자신감 있는 분위기',
              profile_fit: '프로필 적합도',
              general_use_fit: '다른 용도 활용도',
              clean_impression: '깔끔한 인상',
              friendly_impression: '친근한 인상',
              stable_composition: '안정적인 구도',
            };
            return labels[k] ?? k;
          })
          .join(', ')}' 측면에서`
      : '';

  const aiPart =
    leaderFeedback
      ? leaderFeedback.sharpness === 'good'
        ? '선명도가 좋고'
        : leaderFeedback.brightness === 'good'
          ? '밝기가 적절하고'
          : ''
      : '';

  const parts = [humanPart, aiPart].filter(Boolean).join(' ');
  const connector = parts ? `${parts} ` : '';

  if (diff >= 25) {
    return `투표 결과와 사진 피드백을 종합하면 ${leader} 사진이 ${connector}더 적합하다는 의견이 많아요.`;
  }

  return `${leader} 사진이 ${connector}조금 더 선호되는 경향이에요. 참고해서 선택해 보세요.`;
}
