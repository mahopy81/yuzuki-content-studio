import type { GeneratedContentSet, GenerateContentInput } from "./types";

function fallback(value: string | undefined, text: string) {
  return value && value.trim() ? value : text;
}

function compactJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function generateMockContentSet({ theme }: GenerateContentInput): GeneratedContentSet {
  const mainTheme = fallback(theme.mainTheme, "今週の発信テーマ");
  const target = fallback(theme.targetAudience, "これから一歩踏み出したい読者");
  const pain = fallback(theme.painPoint, "何から始めればいいかわからない");
  const outcome = fallback(theme.desiredOutcome, "今日から小さく行動できる");
  const cta = fallback(theme.cta, "詳しくはプロフィールへ");

  return {
    themeId: theme.id,
    instagramCarousel: {
      title: `${mainTheme}をやさしく整理`,
      slides: [
        {
          templateType: "cover",
          label: "01",
          title: mainTheme,
          body: `${target}に向けて、最初に見るべきポイントをまとめます。`
        },
        {
          templateType: "problem",
          label: "02",
          title: "よくあるつまずき",
          body: pain
        },
        {
          templateType: "deep_pain",
          label: "03",
          title: "止まりやすい理由",
          body: "情報が多すぎると、正解探しだけで疲れてしまいます。"
        },
        {
          templateType: "reason",
          label: "04",
          title: "まず絞ること",
          body: "最初は大きな成果より、小さく試して反応を見ることが大切です。"
        },
        {
          templateType: "solution",
          label: "05",
          title: "解決の方向性",
          body: outcome
        },
        {
          templateType: "steps",
          label: "06",
          title: "3ステップ",
          body: "1. 悩みを1つ選ぶ\n2. 投稿にする\n3. 反応をメモする"
        },
        {
          templateType: "example",
          label: "07",
          title: "具体例",
          body: `「${mainTheme}」を、1投稿・1ライブ・1記事に展開します。`
        },
        {
          templateType: "mistake",
          label: "08",
          title: "避けたいこと",
          body: "最初から完璧な設計にしようとして、公開が遅れること。"
        },
        {
          templateType: "summary",
          label: "09",
          title: "まとめ",
          body: "小さく作る、投稿する、反応を見る。この流れを繰り返します。"
        },
        {
          templateType: "cta",
          label: "10",
          title: "次の一歩",
          body: cta,
          cta
        }
      ]
    },
    instagramCaption: {
      hook: `「${mainTheme}」で迷っている人へ。`,
      body: `${pain}という状態から抜けるには、最初の行動を小さくするのが近道です。\n\n今日やることは、テーマを1つ選んで、読者の悩みを1文で書くこと。\nそこから投稿、ライブ、noteへ展開できます。`,
      cta,
      hashtags: ["発信設計", "SNS運用", "AI副業", "コンテンツ制作"]
    },
    instagramReel: {
      title: `${mainTheme}の始め方`,
      hook: "最初の一歩で迷う人は、これだけ見てください。",
      script: `冒頭: ${pain}\n本編: まずは1テーマ、1ターゲット、1CTAに絞ります。\n締め: ${cta}`,
      cuts: ["悩みを見せる", "3ステップを表示", "CTAで締める"],
      telops: ["最初は小さく", "1テーマに絞る", "保存して見返してね"],
      cta
    },
    youtube: {
      title: `${mainTheme}を初心者向けに解説`,
      thumbnailText: "最初の一歩はこれ",
      hook: `${target}が迷いやすいポイントを、順番に整理します。`,
      outline: ["悩みの整理", "失敗しやすい理由", "3ステップ", "実践例", "次の行動"],
      script: `今日は「${mainTheme}」について話します。\nまず、読者が抱えやすい悩みは「${pain}」です。\nここから抜けるには、最初から大きく作らず、小さく投稿して反応を見ることが大切です。`,
      description: `${mainTheme}について、初心者向けにわかりやすく整理しました。`,
      cta
    },
    youtubeLives: [
      {
        title: `作業配信: ${mainTheme}を一緒に整理する`,
        liveStreamType: "work_with_me",
        thumbnailText: "一緒に作業しよう",
        theme: mainTheme,
        purpose: "視聴者が自分のテーマを整理できるようにする",
        targetAudience: target,
        estimatedDurationMinutes: 60,
        openingGreeting: "来てくれてありがとうございます。今日は一緒にテーマ整理をします。",
        openingHook: `今日のゴールは「${outcome}」です。`,
        outline: ["今日のゴール共有", "悩みの整理", "作業時間", "コメント拾い", "まとめ"],
        sections: [
          {
            title: "テーマ整理",
            estimatedMinutes: 20,
            talkingPoints: ["誰に届けるか", "どんな悩みを扱うか", "CTAをどう置くか"],
            script: "まずは届けたい相手を1人に絞って、悩みを言葉にします。"
          },
          {
            title: "作業タイム",
            estimatedMinutes: 25,
            talkingPoints: ["各自で投稿案を書く", "コメントで詰まった点を共有"],
            script: "ここから一緒に手を動かします。コメントも拾いながら進めます。"
          }
        ],
        chatTopics: ["今週発信したいテーマ", "一番つまずいていること"],
        commentPickupPoints: ["テーマが広すぎる人", "CTAに迷っている人"],
        questionsForViewers: ["今日どの媒体に投稿しますか？", "一番届けたい人は誰ですか？"],
        interactiveIdeas: ["コメントでテーマ添削", "5分作業タイマー"],
        workContent: "投稿テーマとCTAの整理",
        announcement: cta,
        cta,
        endingScript: "今日作ったテーマを、まず1投稿にして出してみましょう。",
        clipIdeas: ["テーマを絞るコツ", "CTAを決める考え方"],
        repurposeIdeas: ["Instagramリール", "Threads投稿", "X投稿", "note記事"]
      },
      {
        title: `解説配信: ${mainTheme}のロードマップ`,
        liveStreamType: "roadmap",
        thumbnailText: "迷わないロードマップ",
        theme: mainTheme,
        purpose: "初心者が次にやることを理解できるようにする",
        targetAudience: target,
        estimatedDurationMinutes: 75,
        openingGreeting: "今日はロードマップ形式で、順番に解説します。",
        openingHook: `「${pain}」で止まっている人向けの配信です。`,
        outline: ["全体像", "最初の投稿", "反応を見る", "改善する", "次回テーマ"],
        sections: [
          {
            title: "全体像",
            estimatedMinutes: 20,
            talkingPoints: ["テーマ", "媒体", "導線"],
            script: "まず全体像を見て、どこから始めるかを決めます。"
          },
          {
            title: "改善サイクル",
            estimatedMinutes: 25,
            talkingPoints: ["保存数", "コメント", "クリック"],
            script: "投稿した後の数字を見て、次の投稿に反映します。"
          }
        ],
        chatTopics: ["最近伸びた投稿", "今困っている導線"],
        commentPickupPoints: ["発信目的が曖昧な人", "投稿後の分析に迷う人"],
        questionsForViewers: ["今の投稿目的は何ですか？", "次に改善したい数字は何ですか？"],
        interactiveIdeas: ["投稿目的のコメント診断", "次回テーマ投票"],
        explanationItems: ["テーマ設計", "投稿作成", "分析改善"],
        announcement: cta,
        cta,
        endingScript: "次回は今日のロードマップを使って、実際に投稿案を作ります。",
        clipIdeas: ["ロードマップ全体像", "投稿後に見る数字"],
        repurposeIdeas: ["Instagramカルーセル", "note記事", "LINE配信用短文", "スクール教材メモ"]
      }
    ],
    note: {
      title: `${mainTheme}で迷わないための最初の整理`,
      lead: `${target}に向けて、最初に決めるべきことをまとめます。`,
      headings: ["なぜ迷うのか", "最初に決める3つのこと", "投稿に変える手順", "次の行動"],
      body: `悩みは「${pain}」。ここから抜けるには、テーマ、読者、CTAを先に決めることが大切です。\n\n最初の投稿は完成度よりも、出して反応を見ることを優先します。`,
      cta
    },
    threads: {
      posts: [
        `${mainTheme}で迷ったら、まず「誰のどんな悩みを扱うか」だけ決める。`,
        `最初から完璧に作らなくていい。1投稿出して、反応を見て、次に直す。`,
        `${cta}`
      ]
    },
    x: {
      posts: [
        `${mainTheme}は、最初にテーマを小さくするほど動きやすい。`,
        `悩み: ${pain}\n理想: ${outcome}\nこの2つを書くだけで投稿の軸ができます。`,
        `${cta}`
      ]
    }
  };
}

export function generatedContentToText(value: unknown) {
  return compactJson(value);
}
