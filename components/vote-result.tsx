import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { Choice, VoteResult as VoteResultType } from '@/types';

interface VoteResultProps {
  result: VoteResultType;
  userChoice?: Choice | null;
}

export function VoteResult({ result, userChoice }: VoteResultProps) {
  const barWidthA = React.useRef(new Animated.Value(0)).current;
  const barWidthB = React.useRef(new Animated.Value(0)).current;

  const hasVotes = result.total > 0;
  const winner: Choice | null =
    !hasVotes || result.a_count === result.b_count
      ? null
      : result.a_count > result.b_count
        ? 'A'
        : 'B';

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(barWidthA, {
        toValue: result.a_percent,
        duration: 600,
        delay: 200,
        useNativeDriver: false,
      }),
      Animated.timing(barWidthB, {
        toValue: result.b_percent,
        duration: 600,
        delay: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [barWidthA, barWidthB, result.a_percent, result.b_percent]);

  return (
    <View style={styles.container}>
      <Text style={styles.totalText}>
        {hasVotes
          ? `총 ${result.total}명이 참여했어요`
          : '아직 집계된 투표가 없어요'}
      </Text>

      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <Text style={[styles.label, userChoice === 'A' && styles.labelSelected]}>
            A
          </Text>
          {winner === 'A' ? <Text style={styles.winnerText}>우세</Text> : null}
        </View>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              styles.barA,
              {
                width: barWidthA.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.valueGroup}>
          <Text
            style={[styles.percent, userChoice === 'A' && styles.percentSelected]}
          >
            {result.a_percent}%
          </Text>
          <Text style={styles.count}>{result.a_count}표</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <Text style={[styles.label, userChoice === 'B' && styles.labelSelected]}>
            B
          </Text>
          {winner === 'B' ? <Text style={styles.winnerText}>우세</Text> : null}
        </View>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              styles.barB,
              {
                width: barWidthB.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.valueGroup}>
          <Text
            style={[styles.percent, userChoice === 'B' && styles.percentSelected]}
          >
            {result.b_percent}%
          </Text>
          <Text style={styles.count}>{result.b_count}표</Text>
        </View>
      </View>

      {hasVotes && winner === null ? (
        <Text style={styles.tieText}>지금은 동률이에요</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  totalText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  labelGroup: {
    width: 42,
    gap: 2,
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#6366F1',
  },
  winnerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  barA: {
    backgroundColor: '#6366F1',
  },
  barB: {
    backgroundColor: '#0EA5E9',
  },
  valueGroup: {
    width: 46,
    alignItems: 'flex-end',
  },
  percent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'right',
  },
  percentSelected: {
    color: '#6366F1',
  },
  count: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  tieText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
});
