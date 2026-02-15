import { createClient } from '@supabase/supabase-js';

// Мы читаем ключи из файла .env, чтобы не писать их в коде
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Проверка: если ключей нет, скажем об этом в консоли
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 ОШИБКА: Не найдены ключи в файле .env');
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);
