# Vercelデプロイ手順

VercelはNext.jsアプリを公開するためのサービスです。

## 1. GitHubリポジトリを作成する

1. GitHubで新しいリポジトリを作成します。
2. このプロジェクトをpushします。

## 2. VercelにImportする

1. [Vercel](https://vercel.com/) を開きます。
2. `Add New Project` を押します。
3. GitHubリポジトリを選びます。

## 3. Environment Variablesを設定する

VercelのEnvironment Variablesに次を設定します。

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ALLOWED_EMAILS=
NOTION_TOKEN=
NOTION_PARENT_PAGE_ID=
NOTION_THEMES_DB_ID=
NOTION_CONTENT_DB_ID=
NOTION_IMAGE_PROJECTS_DB_ID=
NOTION_ANALYSIS_DB_ID=
NOTION_ASSETS_DB_ID=
NOTION_PROMPT_TEMPLATES_DB_ID=
NEXT_PUBLIC_APP_URL=
```

`NOTION_TOKEN` は秘密情報です。画面やコードに公開しないでください。

## 4. Supabase Authを設定する

Supabaseの `Site URL` にVercelのURLを設定します。
Redirect URLsにも次のように追加します。

```txt
https://your-project.vercel.app/**
```

## 5. Notion Integrationを設定する

Notionの親ページと各DBにIntegrationを接続します。
DB IDをVercelの環境変数に設定します。

## 6. VercelでDeployする

Vercelの `Deploy` を押します。
初回デプロイ後、環境変数を変更した場合は再デプロイしてください。

## 7. デプロイ後の動作確認

1. VercelのURLを開きます。
2. `/login` が表示されることを確認します。
3. ログインします。
4. `/dashboard` が表示されることを確認します。

## 8. ログイン確認

Supabaseに作成したテストユーザーでログインします。
利用できるメールアドレスは `ALLOWED_EMAILS` に入っている必要があります。

## 9. Notion保存確認

Phase 0では保存機能はまだありません。
接続確認は `/api/notion/test` で行います。
Phase 1でテーマとコンテンツの保存機能を追加します。

## 10. よくあるエラー

- Vercelでログインできない
  - SupabaseのSite URLとRedirect URLsを確認してください。
- Notion接続で401になる
  - `NOTION_TOKEN` を確認してください。
- Notion接続で404になる
  - DB IDとIntegration共有を確認してください。
- 環境変数を直したのに反映されない
  - Vercelで再デプロイしてください。
