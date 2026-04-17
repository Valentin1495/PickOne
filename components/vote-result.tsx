import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { Choice, Reaction, VoteResult as VoteResultType } from '@/types';

interface VoteResultProps {
  result: VoteResultType;
  userChoice?: Choice | null;
  userReaction?: Reaction | null;
}

export function VoteResult({ result, userChoice, userReaction }: VoteResultProps) {
  const barWidthLeft = React.useRef(new Animated.Value(0)).current;
  const barWidthRight = React.useRef(new Animated.Value(0)).current;

  const isDuel = result.mode === 'duel';
  const total = result.total;
  const hasVotes = total > 0;

  const leftPercent = isDuel ? result.a_percent : result.like_percent;
  const rightPercent = isDuel ? result.b_percent : result.dislike_percent;
  const leftCount = isDuel ? result.a_count : result.like_count;
  const rightCount = isDuel ? result.b_count : result.dislike_count;

  const leftLabel = isDuel ? 'A' : '좋아요';
  const rightLabel = isDuel ? 'B' : '싫어요';

  const leftSelected = isDuel ? userChoice === 'A' : userReaction === 'LIKE';
  const rightSelected = isDuel ? userChoice === 'B' : userReaction === 'DISLIKE';

  const winner: 'LEFT' | 'RIGHT' | null =
    !hasVotes || leftCount === rightCount ? null : leftCount > rightCount ? 'LEFT' : 'RIGHT';

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(barWidthLeft, {
        toValue: leftPercent,
        duration: 600,
        delay: 200,
        useNativeDriver: false,
      }),
      Animated.timing(barWidthRight, {
        toValue: rightPercent,
        duration: 600,
        delay: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [barWidthLeft, barWidthRight, leftPercent, rightPercent]);

  return (
    <View style={styles.container}>
      <Text style={styles.totalText}>
        {hasVotes ? `총 ${total}명이 참여했어요` : '아직 투표가 없어요'}
      </Text>

      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <Text style={[styles.label, leftSelected && styles.labelSelected]}>{leftLabel}</Text>
          {winner === 'LEFT' ? <Text style={styles.winnerText}>우세</Text> : null}
        </View>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              styles.barLeft,
              {
                width: barWidthLeft.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.valueGroup}>
          <Text style={[styles.percent, leftSelected && styles.percentSelected]}>{leftPercent}%</Text>
          <Text style={styles.count}>{leftCount}표</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <Text style={[styles.label, rightSelected && styles.labelSelected]}>{rightLabel}</Text>
          {winner === 'RIGHT' ? <Text style={styles.winnerText}>우세</Text> : null}
        </View>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              styles.barRight,
              {
                width: barWidthRight.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.valueGroup}>
          <Text style={[styles.percent, rightSelected && styles.percentSelected]}>{rightPercent}%</Text>
          <Text style={styles.count}>{rightCount}표</Text>
        </View>
      </View>

      {hasVotes && winner === null ? <Text style={styles.tieText}>지금은 동률이에요</Text> : null}
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
    width: 62,
    gap: 2,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
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
  barLeft: {
    backgroundColor: '#6366F1',
  },
  barRight: {
    backgroundColor: '#0EA5E9',
  },
  valueGroup: {
    width: 76,
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
