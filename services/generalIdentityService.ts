import AsyncStorage from '@react-native-async-storage/async-storage';

const ANONYMOUS_CLIENT_KEY = 'pickone_anonymous_client_key';

function generateClientKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getOrCreateGeneralClientKey(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(ANONYMOUS_CLIENT_KEY);
    if (stored) return stored;

    const created = generateClientKey();
    await AsyncStorage.setItem(ANONYMOUS_CLIENT_KEY, created);
    return created;
  } catch {
    return generateClientKey();
  }
}
