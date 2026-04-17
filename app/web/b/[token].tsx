import { useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SkeletonLoader } from '@/components/skeleton-loader';
import { VoteReasonPicker, type VoteReasonFormValue } from '@/components/vote-reason-picker';
import { WebVoteChoiceCard } from '@/components/web-vote-choice-card';
import { getBattleByToken } from '@/services/battleService';
import { submitVoteComment } from '@/services/commentService';
import { submitVoteReasons } from '@/services/reasonService';
import { hasAlreadyVoted, submitVote } from '@/services/voteService';
import type { Choice, Reaction, SubmitVoteInput } from '@/types';

const WEB_FONT = Platform.select({
  web: "'Pretendard Variable', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
  default: undefined,
});

export default function WebVotePage() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [selectedChoice, setSelectedChoice] = React.useState<Choice | null>(null);
  const [showReasonPicker, setShowReasonPicker] = React.useState(false);
  const [isCommentFocused, setIsCommentFocused] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [webViewportHeight, setWebViewportHeight] = React.useState<number | null>(null);
  const initialViewportHeightRef = React.useRef<number | null>(null);
  const webLockCleanupRef = React.useRef<(() => void) | null>(null);

  const scaleA = React.useRef(new Animated.Value(1)).current;
  const scaleB = React.useRef(new Animated.Value(1)).current;
  const fadeIn = React.useRef(new Animated.Value(0)).current;

  const {
    data: battle,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['battle-token', token],
    queryFn: () => getBattleByToken(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  React.useEffect(() => {
    if (!battle) return;

    hasAlreadyVoted(battle.id).then((voted) => {
      if (voted) {
        router.replace(`/result/${battle.id}?alreadyVoted=1&token=${token}`);
      }
    });

    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [battle, fadeIn, router, token]);

  React.useEffect(() => {
    if (!battle) return;
    void Image.prefetch(battle.image_a_url);
    if (battle.mode === 'duel') {
      void Image.prefetch(battle.image_b_url);
    }
  }, [battle]);

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    if (typeof window === 'undefined') return;

    if (!isCommentFocused) {
      webLockCleanupRef.current?.();
      webLockCleanupRef.current = null;
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
    };

    html.style.overflow = 'hidden';
    html.style.height = '100%';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.style.position = 'fixed';
    body.style.top = '0';
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.height = '100dvh';

    const keepAtTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    window.requestAnimationFrame(keepAtTop);

    webLockCleanupRef.current = () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      body.style.height = prev.bodyHeight;

      keepAtTop();
    };

    return () => {
      webLockCleanupRef.current?.();
      webLockCleanupRef.current = null;
    };
  }, [isCommentFocused]);

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    const viewport = window.visualViewport;

    const updateViewportHeight = () => {
      const nextHeight = Math.round(viewport?.height ?? window.innerHeight);
      if (
        initialViewportHeightRef.current === null ||
        nextHeight > initialViewportHeightRef.current
      ) {
        initialViewportHeightRef.current = nextHeight;
      }
      setWebViewportHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    updateViewportHeight();

    viewport?.addEventListener('resize', updateViewportHeight);
    viewport?.addEventListener('scroll', updateViewportHeight);
    window.addEventListener('resize', updateViewportHeight);

    return () => {
      viewport?.removeEventListener('resize', updateViewportHeight);
      viewport?.removeEventListener('scroll', updateViewportHeight);
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  const { mutateAsync: submitVoteAsync, isPending: isFinalizing } = useMutation({
    mutationFn: (input: SubmitVoteInput) => submitVote(input),
  });

  function handleTap(choice: Choice) {
    if (isFinalizing || battle?.mode !== 'duel') return;

    setSubmitError(null);
    setSelectedChoice(choice);
    setShowReasonPicker(true);

    const targetScale = choice === 'A' ? scaleA : scaleB;
    Animated.sequence([
      Animated.timing(targetScale, { toValue: 0.985, duration: 55, useNativeDriver: true }),
      Animated.timing(targetScale, { toValue: 1.015, duration: 85, useNativeDriver: true }),
      Animated.timing(targetScale, { toValue: 1, duration: 55, useNativeDriver: true }),
    ]).start();
  }

  async function submitSingleReaction(reaction: Reaction) {
    if (!battle || !token || battle.mode !== 'single_reaction') return;
    if (isFinalizing) return;

    setSubmitError(null);

    try {
      await submitVoteAsync({
        battleId: battle.id,
        inviteToken: token,
        mode: 'single_reaction',
        reaction,
      });

      router.replace(`/result/${battle.id}?reaction=${reaction}&token=${token}`);
    } catch (error) {
      if (error instanceof Error && error.message === 'ALREADY_VOTED') {
        router.replace(`/result/${battle.id}?alreadyVoted=1&token=${token}`);
        return;
      }
      setSubmitError('네트워크가 불안정해요. 다시 시도해 주세요.');
    }
  }

  async function handleReasonSubmit(value: VoteReasonFormValue) {
    if (!battle || !selectedChoice || !token || battle.mode !== 'duel') return;

    setSubmitError(null);

    try {
      const vote = await submitVoteAsync({
        battleId: battle.id,
        choice: selectedChoice,
        inviteToken: token,
        mode: 'duel',
      });

      try {
        await submitVoteReasons(vote.id, battle.id, selectedChoice, value.reasons);
      } catch {
        // 이유 저장 실패와 무관하게 투표는 성공 처리
      }

      try {
        await submitVoteComment({
          voteId: vote.id,
          battleId: battle.id,
          commentText: value.commentText,
          inviteToken: token,
        });
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : '코멘트 저장에 실패했어요.');
        return;
      }

      router.replace(`/result/${battle.id}?choice=${selectedChoice}&token=${token}`);
    } catch (error) {
      if (error instanceof Error && error.message === 'ALREADY_VOTED') {
        router.replace(`/result/${battle.id}?alreadyVoted=1&token=${token}`);
        return;
      }
      setSubmitError('네트워크가 불안정해요. 다시 시도해 주세요.');
    }
  }

  if (isLoading) return <SkeletonLoader />;

  if (isError || !battle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorTitle, WEB_FONT ? { fontFamily: WEB_FONT } : null]}>
          링크를 찾을 수 없어요
        </Text>
        <Text style={[styles.errorSub, WEB_FONT ? { fontFamily: WEB_FONT } : null]}>
          만료되었거나 잘못된 주소예요.
        </Text>
      </View>
    );
  }

  const isCompact = width < 430;
  const viewportShrink =
    webViewportHeight && initialViewportHeightRef.current
      ? Math.max(0, initialViewportHeightRef.current - webViewportHeight)
      : 0;
  const keyboardLikelyOpen = isCommentFocused && showReasonPicker;
  const keyboardInset = keyboardLikelyOpen ? viewportShrink : 0;
  const veryTightViewport =
    keyboardLikelyOpen &&
    ((!!webViewportHeight && webViewportHeight < 420) || viewportShrink > 180);
  const hideTopSection =
    keyboardLikelyOpen &&
    isCompact &&
    ((!!webViewportHeight && webViewportHeight < 500) || viewportShrink > 120);
  const useCompactReasonPicker = keyboardLikelyOpen && veryTightViewport;
  const topPadding = hideTopSection
    ? Math.max(insets.top + 4, 8)
    : Math.max(insets.top + 12, Platform.OS === 'ios' ? 30 : 20);

  const keyboardBottomInset = keyboardLikelyOpen ? Math.max(2, Math.min(6, insets.bottom)) : 0;
  const bottomPadding = keyboardLikelyOpen ? keyboardBottomInset : Math.max(insets.bottom + 12, 16);
  const keyboardDockGap = keyboardLikelyOpen
    ? Math.max(4, Math.min(8, Math.round(keyboardInset * 0.02)))
    : 0;
  const contentGap = keyboardLikelyOpen ? 8 : 12;

  const defaultCardRowHeight = isCompact
    ? Math.max(220, Math.min(300, Math.round(width * 0.68)))
    : Math.max(300, Math.min(560, Math.round(width * 0.5)));
  const keyboardCardMinHeight = isCompact ? (useCompactReasonPicker ? 152 : 172) : 212;
  const keyboardCardMaxHeight = isCompact ? (useCompactReasonPicker ? 220 : 248) : 300;
  const imagesRowSizeStyle = keyboardLikelyOpen
    ? {
        minHeight: keyboardCardMinHeight,
        maxHeight: keyboardCardMaxHeight,
        flexGrow: 1,
        flexShrink: 1,
      }
    : {
        height: defaultCardRowHeight,
      };

  return (
    <View
      style={[
        styles.rootContainer,
        Platform.OS === 'web' && webViewportHeight ? { height: webViewportHeight } : null,
      ]}
    >
      <Animated.View
        style={[
          styles.root,
          {
            opacity: fadeIn,
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
            paddingHorizontal: isCompact ? 10 : 14,
            justifyContent: 'flex-start',
          },
        ]}
      >
        <View
          style={[
            styles.content,
            {
              maxWidth: width > 900 ? 920 : 760,
              gap: contentGap,
              paddingBottom: keyboardDockGap,
              flex: keyboardLikelyOpen ? 1 : undefined,
            },
          ]}
        >
          {!hideTopSection ? (
            <View style={styles.topSection}>
              <Text style={[styles.question, WEB_FONT ? { fontFamily: WEB_FONT } : null]} numberOfLines={2}>
                {battle.title ?? '이 사진이 어떤가요?'}
              </Text>
              <View style={styles.hintChip}>
                <Text style={[styles.hintText, WEB_FONT ? { fontFamily: WEB_FONT } : null]}>
                  {battle.mode === 'duel' ? '터치해서 투표' : '좋아요/싫어요를 눌러주세요'}
                </Text>
              </View>
            </View>
          ) : null}

          {battle.mode === 'duel' ? (
            <View
              style={[
                styles.imagesRow,
                {
                  gap: isCompact ? 8 : 12,
                  ...imagesRowSizeStyle,
                },
              ]}
            >
              <WebVoteChoiceCard
                slot="A"
                imageUri={battle.image_a_url}
                selected={selectedChoice === 'A'}
                disabled={isFinalizing}
                scale={scaleA}
                onPress={() => handleTap('A')}
              />
              <WebVoteChoiceCard
                slot="B"
                imageUri={battle.image_b_url}
                selected={selectedChoice === 'B'}
                disabled={isFinalizing}
                scale={scaleB}
                onPress={() => handleTap('B')}
              />
            </View>
          ) : (
            <View style={[styles.singleImageStage, imagesRowSizeStyle]}>
              <WebVoteChoiceCard
                slot="A"
                imageUri={battle.image_a_url}
                selected={false}
                disabled
                scale={scaleA}
                onPress={() => null}
              />
            </View>
          )}

          {battle.mode === 'duel' && showReasonPicker && selectedChoice ? (
            <VoteReasonPicker
              submitting={isFinalizing}
              onSubmit={handleReasonSubmit}
              onCommentFocusChange={setIsCommentFocused}
              compact={useCompactReasonPicker}
            />
          ) : null}

          {battle.mode === 'single_reaction' ? (
            <View style={styles.reactionRow}>
              <TouchableOpacity
                style={[styles.reactionButton, styles.likeButton]}
                activeOpacity={0.88}
                onPress={() => submitSingleReaction('LIKE')}
                disabled={isFinalizing}
              >
                <Text style={styles.reactionButtonText}>좋아요</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reactionButton, styles.dislikeButton]}
                activeOpacity={0.88}
                onPress={() => submitSingleReaction('DISLIKE')}
                disabled={isFinalizing}
              >
                <Text style={styles.reactionButtonText}>싫어요</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={[styles.footer, keyboardLikelyOpen ? styles.footerCompact : null]}>
            {submitError ? (
              <Text style={[styles.errorHint, WEB_FONT ? { fontFamily: WEB_FONT } : null]}>
                {submitError}
              </Text>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8F3EA',
    overflow: 'hidden',
  },
  root: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  question: {
    fontSize: 24,
    lineHeight: 31,
    color: '#202628',
    textAlign: 'center',
    fontWeight: '800',
  },
  hintChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#FFF8EE',
    borderWidth: 1,
    borderColor: 'rgba(53, 70, 73, 0.12)',
  },
  hintText: {
    fontSize: 12,
    color: '#7B6860',
    fontWeight: '600',
  },
  imagesRow: {
    flexDirection: 'row',
    paddingHorizontal: 2,
  },
  singleImageStage: {
    paddingHorizontal: 2,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  likeButton: {
    backgroundColor: '#166534',
  },
  dislikeButton: {
    backgroundColor: '#991B1B',
  },
  reactionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  footer: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  footerCompact: {
    minHeight: 0,
    paddingBottom: 0,
  },
  errorHint: {
    fontSize: 12,
    color: '#AF4837',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F8F3EA',
    gap: 8,
  },
  errorTitle: {
    fontSize: 22,
    color: '#202628',
    fontWeight: '800',
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 14,
    color: '#5C7072',
    textAlign: 'center',
  },
});
