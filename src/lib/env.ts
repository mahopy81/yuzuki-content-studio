export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} が設定されていません。`);
  }

  return value;
}

export function getPublicSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  };
}

export function hasSupabaseEnv() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return Boolean(url && anonKey);
}
