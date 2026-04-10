import React from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';

import type { PickedImage } from '@/types';

interface ImagePickerSlotProps {
  label: 'A' | 'B';
  uri: string | null;
  onPick: (image: PickedImage) => void;
  disabled?: boolean;
}

export function ImagePickerSlot({
  label,
  uri,
  onPick,
  disabled,
}: ImagePickerSlotProps) {
  const [loading, setLoading] = React.useState(false);
  const { width: screenWidth } = useWindowDimensions();

  const slotWidth = (screenWidth - 32 - 12) / 2;
  const slotHeight = slotWidth * 1.25;

  async function handlePress() {
    if (disabled) return;

    setLoading(true);
    try {
      const { status } =
        await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
        base64: Platform.OS === 'android',
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri =
          Platform.OS === 'android' && asset.base64
            ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
            : undefined;

        onPick({
          uri: asset.uri,
          previewUri: dataUri ?? asset.uri,
          base64Data: asset.base64 ?? undefined,
          mimeType: asset.mimeType ?? 'image/jpeg',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        uri ? styles.filled : styles.empty,
        { width: slotWidth, height: slotHeight },
        pressed && !disabled ? styles.pressed : null,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <View style={styles.labelBadge}>
        <Text style={styles.labelBadgeText}>{label}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#4F46E5" />
        </View>
      ) : uri ? (
        <View style={styles.imageStage}>
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>변경</Text>
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <View style={styles.plusCircle}>
            <Text style={styles.plusIcon}>+</Text>
          </View>
          <Text style={styles.labelText}>사진 {label} 추가</Text>
          <Text style={styles.hintText}>앨범에서 사진을 골라주세요</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  filled: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  empty: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  pressed: {
    opacity: 0.88,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  imageStage: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  plusCircle: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 30,
    lineHeight: 32,
    color: '#6366F1',
  },
  labelText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  hintText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  labelBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    minWidth: 28,
    height: 28,
    borderRadius: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.78)',
    zIndex: 2,
  },
  labelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  editBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    zIndex: 2,
  },
  editBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
});
