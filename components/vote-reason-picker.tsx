import React from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { REASON_KEYS, REASON_LABELS } from '@/services/reasonService';
import type { ReasonKey } from '@/types';

export interface VoteReasonFormValue {
  reasons: ReasonKey[];
  commentText: string;
}

interface VoteReasonPickerProps {
  submitting?: boolean;
  onSubmit: (value: VoteReasonFormValue) => void;
  onCommentFocusChange?: (focused: boolean) => void;
  compact?: boolean;
}

export function VoteReasonPicker({
  submitting = false,
  onSubmit,
  onCommentFocusChange,
  compact = false,
}: VoteReasonPickerProps) {
  const [selected, setSelected] = React.useState<ReasonKey[]>([]);
  const [commentText, setCommentText] = React.useState('');

  const hasAnyInput = selected.length > 0 || commentText.trim().length > 0;

  function toggleReason(key: ReasonKey) {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 2) return prev;
      return [...prev, key];
    });
  }

  function handleSubmit() {
    onSubmit({
      reasons: selected,
      commentText,
    });
  }

  return (
    <View style={[styles.panel, compact ? styles.panelCompact : null]}>
      <Text style={styles.title}>선택 이유를 남겨주세요 (선택)</Text>
      {!compact ? (
        <Text style={styles.subtitle}>최대 2개 + 한 줄 코멘트로 더 정확한 결과를 만들어요.</Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipRow, compact ? styles.chipRowCompact : null]}
      >
        {REASON_KEYS.map((key) => {
          const isSelected = selected.includes(key);
          const isDisabled = !isSelected && selected.length >= 2;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                compact ? styles.chipCompact : null,
                isSelected && styles.chipSelected,
                isDisabled && styles.chipDisabled,
              ]}
              onPress={() => toggleReason(key)}
              activeOpacity={0.75}
              disabled={isDisabled || submitting}
            >
              <Text
                style={[
                  styles.chipText,
                  compact ? styles.chipTextCompact : null,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {REASON_LABELS[key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.commentBlock}>
        <Text style={styles.commentLabel}>한 줄 코멘트</Text>
        <TextInput
          value={commentText}
          onChangeText={setCommentText}
          onFocus={() => onCommentFocusChange?.(true)}
          onBlur={() => onCommentFocusChange?.(false)}
          editable={!submitting}
          maxLength={80}
          placeholder="예: 표정이 편안하고 분위기가 좋아 보여요"
          placeholderTextColor="#9CA3AF"
          style={[styles.commentInput, Platform.OS === 'web' ? styles.commentInputWeb : null]}
        />
        <Text style={styles.commentCount}>{commentText.trim().length}/80</Text>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, !hasAnyInput && styles.confirmButtonEmpty]}
        onPress={handleSubmit}
        activeOpacity={0.85}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.confirmButtonText}>{hasAnyInput ? '입력 완료' : '건너뛰기'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EAED',
    backgroundColor: 'rgba(255,255,255,0.96)',
    gap: 10,
  },
  panelCompact: {
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 4,
  },
  chipRowCompact: {
    paddingVertical: 2,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  chipCompact: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
  },
  chipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  chipTextCompact: {
    fontSize: 11,
  },
  chipTextSelected: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  commentBlock: {
    gap: 6,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#FAFAFB',
  },
  commentInputWeb: {
    fontSize: 16,
    lineHeight: 22,
  },
  commentCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: '#9CA3AF',
  },
  confirmButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmButtonEmpty: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
