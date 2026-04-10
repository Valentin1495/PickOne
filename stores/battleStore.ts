import { create } from 'zustand';
import type { Battle } from '@/types';

interface BattleStore {
  activeBattle: Battle | null;
  setActiveBattle: (battle: Battle | null) => void;
  clearActiveBattle: () => void;
}

export const useBattleStore = create<BattleStore>((set) => ({
  activeBattle: null,
  setActiveBattle: (battle) => set({ activeBattle: battle }),
  clearActiveBattle: () => set({ activeBattle: null }),
}));
