import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getMyBattleListItems } from '@/services/myBattleService';
import { copyLinkToClipboard, shareLink } from '@/services/shareService';
import type { MyBattleListItem } from '@/types';

type SortKey = 'recent' | 'votes';
type FilterKey = 'all' | 'voted' | 'pending';

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getResultLabel(item: MyBattleListItem): string {
  if (item.result.total === 0) return '아직 투표 없음';
  if (item.result.winner_choice === null) return '동률';
  return `${item.result.winner_choice} 우세`;
}

export default function MyBattlesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sortKey, setSortKey] = React.useState<SortKey>('recent');
  const [filterKey, setFilterKey] = React.useState<FilterKey>('all');

  const {
    data: items = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['my-battles'],
    queryFn: () => getMyBattleListItems(20),
    staleTime: 1000 * 10,
  });

  const displayedItems = React.useMemo(() => {
    const filtered = items.filter((item) => {
      if (filterKey === 'voted') return item.result.total > 0;
      if (filterKey === 'pending') return item.result.total === 0;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === 'votes') {
        return b.result.total - a.result.total;
      }
      return new Date(b.battle.created_at).getTime() - new Date(a.battle.created_at).getTime();
    });
  }, [filterKey, items, sortKey]);

  async function handleCopy(token: string) {
    await copyLinkToClipboard(token);
    Alert.alert('복사 완료', '공유 링크를 클립보드에 복사했어요.');
  }

  async function handleShare(token: string) {
    const result = await shareLink(token);
    if (result === 'shared') {
      Alert.alert('공유 열기 완료', '공유 시트를 열었어요.');
    }
  }

  function renderItem({ item }: { item: MyBattleListItem }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => router.push(`/result/${item.battle.id}`)}
      >
        <View style={styles.imagesRow}>
          <Image source={{ uri: item.battle.image_a_url }} style={styles.thumb} contentFit="cover" />
          <Image source={{ uri: item.battle.image_b_url }} style={styles.thumb} contentFit="cover" />
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.battle.title?.trim() || '제목 없는 대결'}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{formatDateLabel(item.battle.created_at)}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>총 {item.result.total}표</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaStrong}>{getResultLabel(item)}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => handleCopy(item.battle.invite_token)}
          >
            <Text style={styles.secondaryButtonText}>링크 복사</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => handleShare(item.battle.invite_token)}
          >
            <Text style={styles.secondaryButtonText}>공유하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push(`/result/${item.battle.id}`)}
          >
            <Text style={styles.primaryButtonText}>결과 보기</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>나의 대결</Text>
        <Text style={styles.subtitle}>이 기기에서 만든 대결 결과를 모아봤어요.</Text>
      </View>

      <View style={styles.controlsWrap}>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.chip, sortKey === 'recent' ? styles.chipSelected : null]}
            onPress={() => setSortKey('recent')}
          >
            <Text style={[styles.chipText, sortKey === 'recent' ? styles.chipTextSelected : null]}>
              최신순
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, sortKey === 'votes' ? styles.chipSelected : null]}
            onPress={() => setSortKey('votes')}
          >
            <Text style={[styles.chipText, sortKey === 'votes' ? styles.chipTextSelected : null]}>
              투표 많은순
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.chip, filterKey === 'all' ? styles.chipSelected : null]}
            onPress={() => setFilterKey('all')}
          >
            <Text style={[styles.chipText, filterKey === 'all' ? styles.chipTextSelected : null]}>
              전체
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, filterKey === 'voted' ? styles.chipSelected : null]}
            onPress={() => setFilterKey('voted')}
          >
            <Text style={[styles.chipText, filterKey === 'voted' ? styles.chipTextSelected : null]}>
              투표 있음
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, filterKey === 'pending' ? styles.chipSelected : null]}
            onPress={() => setFilterKey('pending')}
          >
            <Text
              style={[styles.chipText, filterKey === 'pending' ? styles.chipTextSelected : null]}
            >
              투표 없음
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={displayedItems}
          keyExtractor={(item) => item.battle.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            displayedItems.length === 0 ? styles.emptyListContent : null,
          ]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {items.length === 0 ? '아직 저장된 대결이 없어요' : '조건에 맞는 대결이 없어요'}
              </Text>
              <Text style={styles.emptyBody}>
                {items.length === 0
                  ? '홈에서 대결을 만든 뒤 다시 와서 확인해보세요.'
                  : '정렬/필터를 바꿔서 다시 확인해보세요.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  controlsWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  chipSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  chipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#4338CA',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumb: {
    flex: 1,
    height: 94,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 6,
    rowGap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaDot: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  metaStrong: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#4F46E5',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
});
