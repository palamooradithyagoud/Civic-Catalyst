import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vgxdpcowbuharsamwbra.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZneGRwY293YnVoYXJzYW13YnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MzU5ODIsImV4cCI6MjEwMjIxMTk4Mn0.NWtI_65zYftYye1owypcAO88tb1Fzym35KbZadtCeME";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
