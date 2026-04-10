import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { REASON_LABELS } from '@/services/reasonService';
import type { ReasonKey, ReasonSummary } from '@/types';

interface HumanFeedbackSummaryCardProps {
  summary: ReasonSummary;
}

function ReasonTag({ reasonKey }: { reasonKey: ReasonKey }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{REASON_LABELS[reasonKey]}</Text>
    </View>
  );
}

function SlotSection({
  slot,
  topReasons,
  summaryText,
}: {
  slot: 'A' | 'B';
  topReasons: ReasonKey[];
  summaryText: string;
}) {
  const color = slot === 'A' ? '#6366F1' : '#0EA5E9';

  return (
    <View style={styles.slotSection}>
      <View style={styles.slotHeader}>
        <View style={[styles.slotBadge, { backgroundColor: color }]}>
          <Text style={styles.slotBadgeText}>{slot}</Text>
        </View>
        {topReasons.length > 0 && (
          <View style={styles.tagRow}>
            {topReasons.map((key) => (
              <ReasonTag key={key} reasonKey={key} />
            ))}
          </View>
        )}
      </View>
      <Text style={styles.summaryText}>{summaryText}</Text>
    </View>
  );
}

export function HumanFeedbackSummaryCard({ summary }: HumanFeedbackSummaryCardProps) {
  const hasAnyReasons =
    summary.a.topReasons.length > 0 || summary.b.topReasons.length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>👥</Text>
        <Text style={styles.cardTitle}>사람들의 선택 이유</Text>
      </View>

      {!hasAnyReasons ? (
        <Text style={styles.emptyText}>
          아직 이유 피드백이 없어요. 더 많은 투표가 쌓이면 여기에 요약이 표시돼요.
        </Text>
      ) : (
        <>
          <Text style={styles.overallText}>{summary.overallText}</Text>
          <View style={styles.divider} />
          <SlotSection
            slot="A"
            topReasons={summary.a.topReasons}
            summaryText={summary.a.summaryText}
          />
          {(summary.b.topReasons.length > 0) && (
            <>
              <View style={styles.divider} />
              <SlotSection
                slot="B"
                topReasons={summary.b.topReasons}
                summaryText={summary.b.summaryText}
              />
            </>
          )}
        </>
      )}
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
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  overallText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  slotSection: {
    gap: 8,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#9CA3AF',
  },
});
