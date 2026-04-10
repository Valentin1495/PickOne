import type { Battle, Vote } from '@/types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export type Database = {
  public: {
    Tables: {
      battles: {
        Row: Battle;
        Insert: Omit<Battle, 'id' | 'created_at'>;
        Update: Partial<Omit<Battle, 'id' | 'created_at'>>;
      };
      votes: {
        Row: Vote;
        Insert: Omit<Vote, 'id' | 'created_at'>;
        Update: Partial<Omit<Vote, 'id' | 'created_at'>>;
      };
    };
  };
};
