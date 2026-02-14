import { createClient } from '@supabase/supabase-js';

// These should be set in .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type UserProfile = {
  id: string;
  email: string;
  bubbles_popped: number;
  unlocked_skins: string[];
  created_at: string;
};
