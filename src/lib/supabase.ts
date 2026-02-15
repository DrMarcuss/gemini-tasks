import { createClient } from '@supabase/supabase-js';

// Читаем настройки из .env (или из настроек Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('🚨 Ошибка: Не найдены ключи Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
