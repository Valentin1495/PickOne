import React from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { AiFeedbackCard } from '@/components/ai-feedback-card';
import { FinalInsightCard } from '@/components/final-insight-card';
import { HumanFeedbackSummaryCard } from '@/components/human-feedback-summary-card';
import { SkeletonLoader } from '@/components/skeleton-loader';
import { VoteResult } from '@/components/vote-result';
import { getBattle } from '@/services/battleService';
import { getBattleComments } from '@/services/commentService';
import { analyzeBattleImages, generateFinalInsight } from '@/services/mockAiService';
import { getReasonSummary } from '@/services/reasonService';
import { getVoteResults, hasAlreadyVoted } from '@/services/voteService';
import type { BattleAiFeedback, Choice, ReasonSummary, VoteComment } from '@/types';

const ENABLE_AI_ANALYSIS = false;
const APP_DEEPLINK_URL = 'pickone://';
const APP_FALLBACK_URL =
  process.env.EXPO_PUBLIC_APP_DOWNLOAD_URL ??
  process.env.EXPO_PUBLIC_APP_URL ??
  'https://pickone.app';

export default function ResultScreen() {
  const { battleId, choice, alreadyVoted, token } = useLocalSearchParams<{
    battleId: string;
    choice?: string;
    alreadyVoted?: string;
    token?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeIn = React.useRef(new Animated.Value(0)).current;

  const userChoice = (choice as Choice) ?? null;
  const [aiFeedback, setAiFeedback] = React.useState<BattleAiFeedback | null>(null);

  const { data: battle, isLoading: battleLoading } = useQuery({
    queryKey: ['battle', battleId],
    queryFn: () => getBattle(battleId!),
    enabled: !!battleId,
  });

  const { data: result, isLoading: resultLoading } = useQuery({
    queryKey: ['result', battleId],
    queryFn: () => getVoteResults(battleId!),
    enabled: !!battleId,
    refetchInterval: 10_000,
  });

  const { data: reasonSummary } = useQuery<ReasonSummary>({
    queryKey: ['reasons', battleId, result?.a_percent, result?.b_percent],
    queryFn: () => getReasonSummary(battleId!, result!.a_percent, result!.b_percent),
    enabled: !!battleId && !!result,
    staleTime: 1000 * 30,
  });

  const { data: viewerHasVoted = false } = useQuery({
    queryKey: ['viewer-has-voted', battleId],
    queryFn: () => hasAlreadyVoted(battleId!),
    enabled: !!battleId && !token,
    staleTime: 1000 * 30,
  });

  const canViewComments = Boolean(token || viewerHasVoted);

  const { data: comments = [] } = useQuery<VoteComment[]>({
    queryKey: ['comments', battleId, token],
    queryFn: () =>
      getBattleComments({
        battleId: battleId!,
        inviteToken: token,
        limit: 20,
      }),
    enabled: !!battleId && canViewComments,
    staleTime: 1000 * 15,
  });

  React.useEffect(() => {
    if (!ENABLE_AI_ANALYSIS || !battle || aiFeedback) return;
    analyzeBattleImages(battle.image_a_url, battle.image_b_url).then(setAiFeedback);
  }, [aiFeedback, battle]);

  React.useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      delay: 100,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  function handleCreateOwn() {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const fallbackTimer = window.setTimeout(() => {
          window.location.href = APP_FALLBACK_URL;
        }, 1200);

        document.addEventListener(
          'visibilitychange',
          () => {
            if (document.hidden) {
              window.clearTimeout(fallbackTimer);
            }
          },
          { once: true },
        );

        window.location.href = APP_DEEPLINK_URL;
      }
      return;
    }

    router.push('/');
  }

  if (battleLoading || resultLoading || !battle || !result) {
    return <SkeletonLoader />;
  }

  const hasVotes = result.total > 0;
  const winnerChoice: Choice | null =
    !hasVotes || result.a_count === result.b_count
      ? null
      : result.a_count > result.b_count
        ? 'A'
        : 'B';

  const finalInsight =
    reasonSummary || (ENABLE_AI_ANALYSIS && aiFeedback)
      ? generateFinalInsight(result, reasonSummary ?? null, ENABLE_AI_ANALYSIS ? aiFeedback : null)
      : null;

  const showCta = Boolean(choice || alreadyVoted);

  return (
    <Animated.View style={[styles.root, { paddingTop: insets.top, opacity: fadeIn }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>결과</Text>
          <Text style={styles.title}>
            {alreadyVoted ? '이미 참여한 대결이에요' : '투표가 반영됐어요'}
          </Text>
          <Text style={styles.subtitle}>
            지금까지 <Text style={styles.highlight}>{result.total}명</Text>이 참여했어요
          </Text>
        </View>

        {battle.title ? <Text style={styles.question}>{battle.title}</Text> : null}

        <View style={styles.imagesRow}>
          <View
            style={[
              styles.imageWrapper,
              winnerChoice === 'A' ? styles.winnerWrapper : null,
              hasVotes && winnerChoice !== 'A' ? styles.loserWrapper : null,
            ]}
          >
            <Image
              source={{ uri: battle.image_a_url }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.cornerBadge}>
              <Text style={styles.cornerBadgeText}>A</Text>
            </View>
            {winnerChoice === 'A' ? (
              <View style={styles.winnerBadge}>
                <Text style={styles.winnerBadgeText}>더 많이 선택됐어요</Text>
              </View>
            ) : null}
            {userChoice === 'A' ? (
              <View style={styles.voteBadge}>
                <Text style={styles.voteBadgeText}>내 선택</Text>
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.imageWrapper,
              winnerChoice === 'B' ? styles.winnerWrapper : null,
              hasVotes && winnerChoice !== 'B' ? styles.loserWrapper : null,
            ]}
          >
            <Image
              source={{ uri: battle.image_b_url }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.cornerBadge}>
              <Text style={styles.cornerBadgeText}>B</Text>
            </View>
            {winnerChoice === 'B' ? (
              <View style={styles.winnerBadge}>
                <Text style={styles.winnerBadgeText}>더 많이 선택됐어요</Text>
              </View>
            ) : null}
            {userChoice === 'B' ? (
              <View style={styles.voteBadge}>
                <Text style={styles.voteBadgeText}>내 선택</Text>
              </View>
            ) : null}
          </View>
        </View>

        {!hasVotes ? (
          <Text style={styles.emptyStateText}>
            아직 첫 투표가 없어요. 친구에게 공유해서 반응을 모아보세요.
          </Text>
        ) : null}

        <VoteResult result={result} userChoice={userChoice} />

        {reasonSummary ? <HumanFeedbackSummaryCard summary={reasonSummary} /> : null}
        {ENABLE_AI_ANALYSIS && aiFeedback ? <AiFeedbackCard feedback={aiFeedback} /> : null}

        {finalInsight ? (
          <FinalInsightCard insight={finalInsight} recommendedSlot={winnerChoice} />
        ) : null}

        {canViewComments ? (
          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>한 줄 코멘트</Text>
            {comments.length === 0 ? (
              <Text style={styles.commentEmpty}>아직 등록된 코멘트가 없어요.</Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Text style={styles.commentText}>{comment.comment_text}</Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        {showCta ? (
          <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>나도 친구들의 선택 받아보기</Text>
            <Text style={styles.ctaBody}>
              사진 두 장만 고르면 바로 공유 링크를 만들 수 있어요.
            </Text>
            <TouchableOpacity activeOpacity={0.86} onPress={handleCreateOwn} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>내 사진으로 대결 만들기</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 16,
  },
  header: {
    paddingTop: 24,
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
  },
  highlight: {
    fontWeight: '700',
    color: '#6366F1',
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageWrapper: {
    flex: 1,
    height: 196,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  winnerWrapper: {
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  loserWrapper: {
    opacity: 0.82,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cornerBadge: {
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
  },
  cornerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  winnerBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  winnerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  voteBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: '#4F46E5',
  },
  voteBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyStateText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  commentSection: {
    gap: 10,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#FAFAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  commentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  commentEmpty: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  commentItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEF0F2',
  },
  commentText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#374151',
  },
  ctaSection: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 4,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  ctaBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  ctaButton: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
