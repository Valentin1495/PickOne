import { getOrCreateGeneralClientKey } from '@/services/generalIdentityService';
import { getTossAnonymousHash } from '@/services/tossIdentityService';

export async function resolveClientKey(): Promise<string> {
  const tossAnonymousHash = await getTossAnonymousHash();
  if (tossAnonymousHash) {
    return `toss_hash:${tossAnonymousHash}`;
  }

  return getOrCreateGeneralClientKey();
}
