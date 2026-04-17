type TossAnonymousKeySuccess = {
  type: 'HASH';
  hash: string;
};

type TossAnonymousKeyResult =
  | TossAnonymousKeySuccess
  | 'INVALID_CATEGORY'
  | 'ERROR'
  | undefined;

type TossBridge = {
  getAnonymousKey?: () => Promise<TossAnonymousKeyResult>;
};

function getTossBridge(): TossBridge | null {
  const globalObj = globalThis as Record<string, unknown>;
  const direct = globalObj.getAnonymousKey;
  if (typeof direct === 'function') {
    return {
      getAnonymousKey: direct as () => Promise<TossAnonymousKeyResult>,
    };
  }

  const appsInToss = globalObj.AppsInToss as TossBridge | undefined;
  if (appsInToss && typeof appsInToss.getAnonymousKey === 'function') {
    return appsInToss;
  }

  return null;
}

export async function getTossAnonymousHash(): Promise<string | null> {
  const bridge = getTossBridge();
  if (!bridge?.getAnonymousKey) return null;

  try {
    const result = await bridge.getAnonymousKey();
    if (!result || result === 'INVALID_CATEGORY' || result === 'ERROR') return null;
    if (result.type !== 'HASH') return null;

    const hash = result.hash?.trim();
    if (!hash) return null;
    return hash;
  } catch {
    return null;
  }
}
