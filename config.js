window.DEBA_CONFIG = window.DEBA_CONFIG || {};

// Production Supabase browser credentials.
window.DEBA_CONFIG.SUPABASE_URL = "https://mnaxzevmsoialsycknby.supabase.co";
window.DEBA_CONFIG.SUPABASE_ANON_KEY = "sb_publishable_QaE5bb_1kirot8XpJPsrFg_k6KHsjwl";

// Dynamic backup check for runtime environments.
const runtimeEnv = globalThis.process?.env;
if (!window.DEBA_CONFIG.SUPABASE_URL && runtimeEnv?.SUPABASE_URL) {
  window.DEBA_CONFIG.SUPABASE_URL = runtimeEnv.SUPABASE_URL;
}
if (!window.DEBA_CONFIG.SUPABASE_ANON_KEY && runtimeEnv?.SUPABASE_ANON_KEY) {
  window.DEBA_CONFIG.SUPABASE_ANON_KEY = runtimeEnv.SUPABASE_ANON_KEY;
}
