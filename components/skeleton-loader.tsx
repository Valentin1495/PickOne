import React from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function SkeletonLoader() {
  const opacity = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.topBar} />
      <View style={styles.images}>
        <View style={[styles.imageBlock, { height: SCREEN_HEIGHT * 0.38 }]} />
        <View style={[styles.imageBlock, { height: SCREEN_HEIGHT * 0.38 }]} />
      </View>
      <View style={styles.footer} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 60,
    paddingHorizontal: 12,
    gap: 16,
  },
  topBar: {
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  images: {
    flexDirection: 'row',
    gap: 8,
  },
  imageBlock: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  footer: {
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginHorizontal: 40,
  },
});
