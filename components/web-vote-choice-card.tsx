import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

import type { Choice } from '@/types';

type WebVoteChoiceCardProps = {
  slot: Choice;
  imageUri: string;
  selected: boolean;
  disabled: boolean;
  scale: Animated.Value;
  contentFit?: 'cover' | 'contain';
  onPress: () => void;
};

export function WebVoteChoiceCard({
  slot,
  imageUri,
  selected,
  disabled,
  scale,
  contentFit = 'cover',
  onPress,
}: WebVoteChoiceCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={styles.touch}
    >
      <Animated.View style={[styles.animatedShell, { transform: [{ scale }] }]}>
        <View
          style={[
            styles.card,
            disabled && !selected ? styles.cardDisabled : null,
          ]}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit={contentFit}
            contentPosition="center"
            transition={120}
          />

          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>{slot}</Text>
          </View>

          {selected ? (
            <>
              <View style={styles.selectedRing} />
              <View style={styles.selectedOverlay} />
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>선택됨</Text>
              </View>
            </>
          ) : null}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    flex: 1,
  },
  animatedShell: {
    flex: 1,
  },
  card: {
    flex: 1,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  cardDisabled: {
    opacity: 0.86,
  },
  selectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: '#D06C4F',
    borderRadius: 22,
    shadowColor: '#D06C4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26,
    shadowRadius: 10,
    elevation: 4,
  },
  slotBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    minWidth: 30,
    height: 30,
    borderRadius: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(24, 34, 35, 0.82)',
  },
  slotBadgeText: {
    color: '#F8F5EF',
    fontSize: 13,
    fontWeight: '800',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(208, 108, 79, 0.18)',
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 249, 240, 0.95)',
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A4B35',
  },
});
