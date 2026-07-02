# Notionセットアップ手順

Yuzuki Content StudioからNotionに保存するための準備です。Notionの「Integration」は、アプリとNotionをつなぐための専用ロボットのようなものです。

## 1. 親ページを作成する

1. Notionを開きます。
2. 左メニューから新しいページを作ります。
3. ページ名を `Yuzuki Content Studio` などにします。

## 2. Notion Integrationを作成する

1. [Notion Integrations](https://www.notion.so/my-integrations) を開きます。
2. `New integration` を選びます。
3. 名前を `Yuzuki Content Studio` にします。
4. 保存します。

## 3. Integration Secretを取得する

Integrationの画面にある `Internal Integration Secret` をコピーします。
この値はパスワードのように扱い、公開しないでください。

## 4. 親ページにIntegrationを接続する

1. Notionの親ページを開きます。
2. 右上の `...` を押します。
3. `Connections` から作成したIntegrationを追加します。

## 5. DBを手動作成する

Phase 1では最低限、次の2つを作ります。

- `Yuzuki Themes`
- `Yuzuki Content Items`

将来用に次のDBも作れます。

- `Yuzuki Image Projects`
- `Yuzuki Analysis`
- `Yuzuki Assets`
- `Yuzuki Prompt Templates`

## 6. DBプロパティ一覧

### Yuzuki Themes

| 名前 | 種類 |
| --- | --- |
| Name | title |
| Week | rich_text |
| Main Theme | rich_text |
| Target Audience | rich_text |
| Pain Point | rich_text |
| Desired Outcome | rich_text |
| Purpose | select |
| CTA | rich_text |
| Offer | rich_text |
| Angle | rich_text |
| Memo | rich_text |
| Status | select |
| Created At | date |
| Updated At | date |

Statusは `Idea`, `Active`, `Completed`, `Archived` を用意します。
Purposeは `LINE登録`, `ワークショップ誘導`, `note誘導`, `コミュニティ誘導`, `スクール販売`, `認知拡大`, `信頼構築` を用意します。

### Yuzuki Content Items

| 名前 | 種類 |
| --- | --- |
| Name | title |
| Theme | relation |
| Platform | select |
| Content Type | select |
| Status | select |
| Scheduled Date | date |
| Published Date | date |
| CTA | rich_text |
| Body | rich_text |
| Caption | rich_text |
| Script | rich_text |
| Article | rich_text |
| Hashtags | multi_select |
| Image Project ID | rich_text |
| Memo | rich_text |
| Created At | date |
| Updated At | date |

Platformは `Instagram`, `Instagram Reel`, `YouTube`, `YouTube Live`, `note`, `Threads`, `X` を用意します。
Content Typeは `Instagram Carousel`, `Instagram Caption`, `Instagram Reel Script`, `YouTube Script`, `YouTube Live Plan`, `note Article`, `Threads Post`, `X Post` を用意します。
Statusは `Idea`, `Generated`, `Drafting`, `Review`, `Revision`, `Scheduled`, `Published`, `Analyzed`, `Rejected` を用意します。

### Yuzuki Image Projects

| 名前 | 種類 |
| --- | --- |
| Name | title |
| Theme ID | rich_text |
| Theme Title | rich_text |
| Content Item ID | rich_text |
| Content Title | rich_text |
| Platform | select |
| Image Type | select |
| Status | select |
| Format | rich_text |
| Prompt | rich_text |
| Negative Prompt | rich_text |
| Reference URL | rich_text |
| Output URL | rich_text |
| Memo | rich_text |
| Created At | date |
| Updated At | date |

Image Typeは `Instagram Carousel Design`, `Instagram Reel Cover`, `YouTube Thumbnail`, `YouTube Live Thumbnail`, `note Eyecatch`, `Threads Image`, `X Image` を用意します。
Statusは `Idea`, `Prompt Ready`, `Generating`, `Review`, `Approved`, `Published`, `Rejected` を用意します。

## 7. DB IDを取得する

Notion DBを開いたときのURLから取得します。

例:

```txt
https://www.notion.so/workspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...
```

この `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` の部分がDB IDです。

## 8. .env.localに設定する

`.env.example` を参考に `.env.local` を作り、次のように設定します。

```env
NOTION_TOKEN=secret_xxx
NOTION_THEMES_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_CONTENT_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 9. 接続確認方法

1. アプリを起動します。
2. ログインします。
3. ダッシュボードの `APIを確認する` を押します。
4. `ok: true` が出れば、Notion APIへの基本接続は成功です。

## 10. よくあるエラー

- `401 Unauthorized`
  - `NOTION_TOKEN` が間違っています。
- `404 Object not found`
  - DBがIntegrationに共有されていません。
  - DB IDが間違っています。
- `property does not exist`
  - Notion DBのプロパティ名がコードと一致していません。
- `relation database not shared`
  - Relation先のDBもIntegrationに共有してください。
