# Supabaseセットアップ手順

Supabase Authは、メールアドレスとパスワードでログインするための仕組みです。

## 1. Supabaseプロジェクトを作成する

1. [Supabase](https://supabase.com/) にログインします。
2. `New project` を押します。
3. プロジェクト名を入力して作成します。

## 2. Email Providerを設定する

1. Supabaseの管理画面で `Authentication` を開きます。
2. `Providers` を開きます。
3. `Email` が有効になっていることを確認します。

## 3. Site URLを設定する

開発中は次を設定します。

```txt
http://localhost:3000
```

本番ではVercelのURLを設定します。

## 4. Redirect URLsを設定する

開発中は次を追加します。

```txt
http://localhost:3000/**
```

本番ではVercelのURLも追加します。

## 5. API URLとAnon Keyを取得する

1. `Project Settings` を開きます。
2. `API` を開きます。
3. `Project URL` と `anon public` keyをコピーします。

## 6. .env.localに設定する

`.env.example` をコピーして `.env.local` を作ります。

```env
NEXT_PUBLIC_SUPABASE_URL=Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon public key
ALLOWED_EMAILS=example@gmail.com
```

`ALLOWED_EMAILS` は使えるメールアドレスのリストです。複数ある場合はカンマで区切ります。

```env
ALLOWED_EMAILS=example@gmail.com,admin@example.com
```

## 7. Vercel環境変数に設定する

Vercelにデプロイするときも、同じ値をEnvironment Variablesに設定します。

## 8. テストユーザーを作成する

1. Supabaseの `Authentication` を開きます。
2. `Users` から `Add user` を押します。
3. `ALLOWED_EMAILS` に入れたメールアドレスでユーザーを作ります。

## 9. ログイン確認

1. アプリを起動します。
2. `/login` を開きます。
3. テストユーザーのメールアドレスとパスワードでログインします。
4. `/dashboard` が表示されれば成功です。

## 10. よくあるエラー

- ログインできない
  - メールアドレスまたはパスワードが違う可能性があります。
- 許可リストにありません
  - `ALLOWED_EMAILS` にそのメールアドレスを追加してください。
- 環境変数がありません
  - `.env.local` にSupabaseのURLとAnon Keyを設定してください。
