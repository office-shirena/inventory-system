// src/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// 環境変数から読み込み（Viteの.envファイルを利用）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
