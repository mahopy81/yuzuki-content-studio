import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yuzuki Content Studio",
  description: "SNSコンテンツ制作と投稿管理のためのダッシュボード"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
