import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ImagePickerSlot } from '@/components/image-picker-slot';
import { ShareModal } from '@/components/share-modal';
import { createBattle } from '@/services/battleService';
import { addCreatedBattleId } from '@/services/myBattleService';
import { shareLink } from '@/services/shareService';
import { useBattleStore } from '@/stores/battleStore';
import type { Battle, BattleMode, PickedImage } from '@/types';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setActiveBattle = useBattleStore((s) => s.setActiveBattle);

  const [imageA, setImageA] = React.useState<PickedImage | null>(null);
  const [imageB, setImageB] = React.useState<PickedImage | null>(null);
  const [mode, setMode] = React.useState<BattleMode>('duel');
  const [title, setTitle] = React.useState('');
  const [shareModalVisible, setShareModalVisible] = React.useState(false);
  const [createdBattle, setCreatedBattle] = React.useState<Battle | null>(null);

  const canCreate = mode === 'duel' ? !!imageA && !!imageB : !!imageA;

  const { mutate: handleCreate, isPending } = useMutation({
    mutationFn: () =>
      createBattle({
        imageA: imageA!,
        imageB: mode === 'duel' ? imageB! : undefined,
        mode,
        title: title.trim() || undefined,
      }),
    onSuccess: (battle) => {
      void addCreatedBattleId(battle.id);
      setActiveBattle(battle);
      setCreatedBattle(battle);
      setShareModalVisible(true);
    },
    onError: (err) => {
      Alert.alert(
        '문제가 생겼어요',
        err instanceof Error ? err.message : '대결을 만들지 못했어요. 다시 시도해 주세요.',
      );
    },
  });

  async function handleShare(message: string) {
    if (!createdBattle) return;
    await shareLink(createdBattle.invite_token, message);
  }

  function handleDismissShareModal() {
    setShareModalVisible(false);
  }

  function handleViewResult() {
    if (!createdBattle) return;
    setShareModalVisible(false);
    router.push(`/result/${createdBattle.id}`);
  }

  function handleViewMyBattles() {
    router.push('/my-battles');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>대결 만들기</Text>
          <Text style={styles.appName}>PickOne</Text>
          <Text style={styles.tagline}>사진을 올리고 친구들의 선택을 받아보세요.</Text>
        </View>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeChip, mode === 'duel' ? styles.modeChipSelected : null]}
            activeOpacity={0.86}
            disabled={isPending}
            onPress={() => setMode('duel')}
          >
            <Text
              style={[styles.modeChipText, mode === 'duel' ? styles.modeChipTextSelected : null]}
            >
              A/B 대결
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeChip, mode === 'single_reaction' ? styles.modeChipSelected : null]}
            activeOpacity={0.86}
            disabled={isPending}
            onPress={() => {
              setMode('single_reaction');
              setImageB(null);
            }}
          >
            <Text
              style={[
                styles.modeChipText,
                mode === 'single_reaction' ? styles.modeChipTextSelected : null,
              ]}
            >
              1장 + 좋아요/싫어요
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[styles.imagesRow, mode === 'single_reaction' ? styles.imagesRowSingle : null]}
        >
          <ImagePickerSlot
            label="A"
            uri={imageA?.previewUri ?? imageA?.uri ?? null}
            onPick={setImageA}
            disabled={isPending}
          />
          {mode === 'duel' ? (
            <>
              <View pointerEvents="none" style={styles.vsDivider}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              <ImagePickerSlot
                label="B"
                uri={imageB?.previewUri ?? imageB?.uri ?? null}
                onPick={setImageB}
                disabled={isPending}
              />
            </>
          ) : null}
        </View>

        <View style={styles.promptBlock}>
          <Text style={styles.promptLabel}>질문 추가 (선택)</Text>
          <TextInput
            style={styles.titleInput}
            placeholder={
              mode === 'single_reaction' ? '이 사진, 어때?' : '어떤 사진이 더 마음에 들어?'
            }
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
            returnKeyType="done"
            editable={!isPending}
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
          onPress={() => handleCreate()}
          activeOpacity={0.88}
          disabled={!canCreate || isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.createButtonText}>
              {canCreate ? '대결 만들기' : '사진 먼저 선택하기'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>생성 직후 공유 링크가 만들어져요.</Text>

        <TouchableOpacity
          style={styles.myBattlesButton}
          onPress={handleViewMyBattles}
          activeOpacity={0.82}
        >
          <Text style={styles.myBattlesButtonText}>나의 대결 보기</Text>
        </TouchableOpacity>
      </ScrollView>

      {createdBattle ? (
        <ShareModal
          visible={shareModalVisible}
          token={createdBattle.invite_token}
          onDismiss={handleDismissShareModal}
          onViewResult={handleViewResult}
          onShare={handleShare}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    paddingTop: 24,
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  tagline: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeChipSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  modeChipTextSelected: {
    color: '#4338CA',
  },
  imagesRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 12,
  },
  imagesRowSingle: {
    justifyContent: 'center',
  },
  vsDivider: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 2,
    elevation: 2,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  promptBlock: {
    gap: 8,
  },
  promptLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  titleInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    textAlign: 'center',
  },
  myBattlesButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
  },
  myBattlesButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },
});
