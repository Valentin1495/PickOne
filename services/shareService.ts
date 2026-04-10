import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

const SHARE_MESSAGE_EXAMPLES = [
  '둘 중 뭐가 더 괜찮은지 골라줘',
  '어떤 사진이 더 좋아 보여?',
  '가볍게 보고 마음 가는 쪽 찍어줘',
];

export type ShareResult = 'shared' | 'dismissed';

export function getShareUrl(token: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_APP_URL ?? 'https://pickone.app';
  return `${baseUrl}/web/b/${token}`;
}

export function getShareMessageExamples(): string[] {
  return SHARE_MESSAGE_EXAMPLES;
}

export function buildShareMessage(token: string, customText?: string): string {
  const text = customText?.trim() || '둘 중 뭐가 더 괜찮은지 골라줘';
  return `${text}\n${getShareUrl(token)}`;
}

export async function shareLink(
  token: string,
  customText?: string
): Promise<ShareResult> {
  const message = buildShareMessage(token, customText);

  // TODO: KPI - share_link_tapped event { token }

  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: message, url: getShareUrl(token) });
        return 'shared';
      } catch {
        return 'dismissed';
      }
    }

    await Clipboard.setStringAsync(message);
    return 'shared';
  }

  const result = await Share.share({
    message,
    url: getShareUrl(token),
  });

  if (result.action === Share.dismissedAction) {
    return 'dismissed';
  }

  return 'shared';
}

export async function copyLinkToClipboard(token: string): Promise<void> {
  const url = getShareUrl(token);
  await Clipboard.setStringAsync(url);
}
