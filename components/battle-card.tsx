import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import type { Choice } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.38;

interface BattleCardProps {
  imageAUrl: string;
  imageBUrl: string;
  onVote?: (choice: Choice) => void;
  selectedChoice?: Choice | null;
  disabled?: boolean;
}

export function BattleCard({ imageAUrl, imageBUrl, onVote, selectedChoice, disabled }: BattleCardProps) {
  const scaleA = React.useRef(new Animated.Value(1)).current;
  const scaleB = React.useRef(new Animated.Value(1)).current;

  function handlePress(choice: Choice) {
    if (disabled || !onVote) return;

    const targetScale = choice === 'A' ? scaleA : scaleB;
    Animated.sequence([
      Animated.timing(targetScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(targetScale, { toValue: 1.03, duration: 120, useNativeDriver: true }),
      Animated.timing(targetScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    onVote(choice);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handlePress('A')}
        disabled={disabled}
        style={styles.imageWrapper}
      >
        <Animated.View style={[styles.imageWrapper, { transform: [{ scale: scaleA }] }]}>
          <Image source={{ uri: imageAUrl }} style={styles.image} contentFit="cover" />
          {selectedChoice === 'A' && <View style={styles.selectedOverlay} />}
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handlePress('B')}
        disabled={disabled}
        style={styles.imageWrapper}
      >
        <Animated.View style={[styles.imageWrapper, { transform: [{ scale: scaleB }] }]}>
          <Image source={{ uri: imageBUrl }} style={styles.image} contentFit="cover" />
          {selectedChoice === 'B' && <View style={styles.selectedOverlay} />}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    width: '100%',
  },
  imageWrapper: {
    flex: 1,
    height: IMAGE_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderWidth: 3,
    borderColor: '#6366F1',
    borderRadius: 16,
  },
});
