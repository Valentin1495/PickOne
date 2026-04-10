import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FinalInsightCardProps {
  insight: string;
  recommendedSlot?: 'A' | 'B' | null;
}

export function FinalInsightCard({ insight, recommendedSlot }: FinalInsightCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.icon}>✨</Text>
        <Text style={styles.label}>최종 인사이트</Text>
        {recommendedSlot && (
          <View style={styles.recommendBadge}>
            <Text style={styles.recommendText}>추천 사진 {recommendedSlot}</Text>
          </View>
        )}
      </View>
      <Text style={styles.insightText}>{insight}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    flex: 1,
  },
  recommendBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  recommendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  insightText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#312E81',
    fontWeight: '500',
  },
});
