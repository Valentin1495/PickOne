import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import { resolveClientKey } from '@/services/identityKeyResolver';

const ANONYMOUS_USER_CACHE_KEY = 'pickone_anonymous_user_cache';

type AnonymousUserCache = {
  clientKey: string;
  userId: string;
};

async function findAnonymousUserId(clientKey: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('anonymous_users')
    .select('id')
    .eq('client_key', clientKey)
    .maybeSingle();

  if (error) throw new Error(`Failed to find anonymous user: ${error.message}`);
  return (data?.id as string | undefined) ?? null;
}

async function createAnonymousUserId(clientKey: string): Promise<string> {
  const { data, error } = await supabase
    .from('anonymous_users')
    .insert({ client_key: clientKey })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      const existing = await findAnonymousUserId(clientKey);
      if (existing) return existing;
    }
    throw new Error(`Failed to create anonymous user: ${error.message}`);
  }

  return data.id as string;
}

export async function getOrCreateAnonymousUserId(): Promise<string> {
  try {
    const clientKey = await resolveClientKey();
    const cached = await AsyncStorage.getItem(ANONYMOUS_USER_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as unknown;
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof (parsed as AnonymousUserCache).clientKey === 'string' &&
        typeof (parsed as AnonymousUserCache).userId === 'string' &&
        (parsed as AnonymousUserCache).clientKey === clientKey
      ) {
        return (parsed as AnonymousUserCache).userId;
      }
    }

    const existing = await findAnonymousUserId(clientKey);
    const userId = existing ?? (await createAnonymousUserId(clientKey));
    await AsyncStorage.setItem(
      ANONYMOUS_USER_CACHE_KEY,
      JSON.stringify({
        clientKey,
        userId,
      } satisfies AnonymousUserCache)
    );
    return userId;
  } catch {
    const clientKey = await resolveClientKey();
    const existing = await findAnonymousUserId(clientKey);
    const userId = existing ?? (await createAnonymousUserId(clientKey));
    await AsyncStorage.setItem(
      ANONYMOUS_USER_CACHE_KEY,
      JSON.stringify({
        clientKey,
        userId,
      } satisfies AnonymousUserCache)
    );
    return userId;
  }
}
