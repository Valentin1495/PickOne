import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  copyLinkToClipboard,
  getShareMessageExamples,
  getShareUrl,
} from '@/services/shareService';

interface ShareModalProps {
  visible: boolean;
  token: string;
  onDismiss: () => void;
  onViewResult: () => void;
  onShare: (message: string) => void;
}

export function ShareModal({
  visible,
  token,
  onDismiss,
  onViewResult,
  onShare,
}: ShareModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [message, setMessage] = React.useState('둘 중 뭐가 더 괜찮은지 골라줘');
  const examples = getShareMessageExamples();
  const shareUrl = getShareUrl(token);

  React.useEffect(() => {
    if (visible) {
      setCopied(false);
    }
  }, [visible]);

  async function handleCopyLink() {
    await copyLinkToClipboard(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSubmit() {
    onShare(message.trim());
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onDismiss}
        style={styles.backdrop}
      />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>공유 문구 작성</Text>
        <Text style={styles.subtitle}>
          보내고 싶은 문장을 직접 쓰고, 아래 예시를 참고해 다듬어보세요.
        </Text>

        <View style={styles.linkBox}>
          <Text numberOfLines={1} style={styles.linkText}>
            {shareUrl}
          </Text>
        </View>

        <TextInput
          multiline
          maxLength={120}
          onChangeText={setMessage}
          placeholder="친구에게 보낼 문구를 입력하세요"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          textAlignVertical="top"
          value={message}
        />

        <View style={styles.examplesHeader}>
          <Text style={styles.examplesTitle}>예시 문구</Text>
          <Text style={styles.examplesHint}>눌러서 불러올 수 있어요</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.examplesList}
        >
          {examples.map((example) => (
            <TouchableOpacity
              key={example}
              activeOpacity={0.72}
              onPress={() => setMessage(example)}
              style={styles.exampleChip}
            >
              <Text style={styles.exampleChipText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleCopyLink}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              {copied ? '링크를 복사했어요' : '링크만 복사하기'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleSubmit}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>공유 시트 열기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={onViewResult}
            style={styles.resultButton}
          >
            <Text style={styles.resultButtonText}>결과 보기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={onDismiss}
            style={styles.ghostButton}
          >
            <Text style={styles.ghostButtonText}>나중에 하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '84%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  linkBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkText: {
    fontSize: 12,
    color: '#6B7280',
  },
  input: {
    minHeight: 110,
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
  },
  examplesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  examplesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  examplesHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  examplesList: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 8,
  },
  exampleChip: {
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  exampleChipText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
  },
  footer: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  ghostButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  ghostButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  resultButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
  },
  resultButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },
  primaryButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
