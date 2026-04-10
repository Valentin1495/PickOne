import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AiFeedback, BattleAiFeedback } from '@/types';

interface AiFeedbackCardProps {
  feedback: BattleAiFeedback;
}

type GradeLevel = 'good' | 'ok' | 'low' | 'needs_improvement' | 'natural' | 'neutral' | 'awkward' | 'high' | 'medium' | boolean;

function gradeColor(grade: GradeLevel): string {
  if (grade === 'good' || grade === 'natural' || grade === 'high') return '#10B981';
  if (grade === 'ok' || grade === 'neutral' || grade === 'medium') return '#F59E0B';
  return '#9CA3AF';
}

function gradeLabel(grade: GradeLevel): string {
  if (grade === true) return '있음';
  if (grade === false) return '없음';
  const map: Record<string, string> = {
    good: '좋음',
    ok: '보통',
    low: '낮음',
    needs_improvement: '개선 필요',
    natural: '자연스러움',
    neutral: '무난함',
    awkward: '어색함',
    high: '높음',
    medium: '보통',
  };
  return map[grade as string] ?? String(grade);
}

interface FeedbackRowProps {
  label: string;
  grade: GradeLevel;
  invert?: boolean;
}

function FeedbackRow({ label, grade, invert }: FeedbackRowProps) {
  const color = invert
    ? grade === true ? '#9CA3AF' : '#10B981'
    : gradeColor(grade);

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.gradePill, { backgroundColor: `${color}18` }]}>
        <Text style={[styles.gradeText, { color }]}>{gradeLabel(grade)}</Text>
      </View>
    </View>
  );
}

function SlotFeedback({ slot, feedback }: { slot: 'A' | 'B'; feedback: AiFeedback }) {
  const color = slot === 'A' ? '#6366F1' : '#0EA5E9';
  return (
    <View style={styles.slotBlock}>
      <View style={[styles.slotBadge, { backgroundColor: color }]}>
        <Text style={styles.slotBadgeText}>{slot}</Text>
      </View>
      <View style={styles.rowList}>
        <FeedbackRow label="밝기" grade={feedback.brightness} />
        <FeedbackRow label="선명도" grade={feedback.sharpness} />
        <FeedbackRow label="구도" grade={feedback.composition} />
        <FeedbackRow label="표정" grade={feedback.expression} />
        <FeedbackRow label="프로필 적합도" grade={feedback.profile_suitability} />
      </View>
      <Text style={styles.summaryText}>{feedback.summary}</Text>
    </View>
  );
}

export function AiFeedbackCard({ feedback }: AiFeedbackCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>🤖</Text>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.cardTitle}>AI 사진 분석</Text>
          <Text style={styles.disclaimer}>AI 분석 결과입니다 · 참고용 정보입니다</Text>
        </View>
      </View>

      <View style={styles.slotsRow}>
        <SlotFeedback slot="A" feedback={feedback.imageA} />
        <View style={styles.verticalDivider} />
        <SlotFeedback slot="B" feedback={feedback.imageB} />
      </View>

      <Text style={styles.bottomDisclaimer}>
        사진의 품질 요소만 분석하며, 외모나 매력도는 평가하지 않습니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  cardTitleGroup: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  disclaimer: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  slotBlock: {
    flex: 1,
    gap: 10,
  },
  slotBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  rowList: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  gradePill: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  gradeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#9CA3AF',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
  },
  bottomDisclaimer: {
    fontSize: 11,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 16,
  },
});
