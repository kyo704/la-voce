import { Cormorant_Garamond, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display"
});
const body = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body"
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono"
});
export const metadata = {
  title: "La Voce | 声のプロフェッショナルのための体調管理",
  description:
    "声楽家・アナウンサー・声優・ポップス/ミュージカル歌手など、声のプロフェッショナルのための体調管理アプリ。喉・声のコンディション、睡眠、気候、本番の出来までを記録し、傾向を分析します。",
  // lavoce-アプリアイコン実装仕様.md §4: favicon・iOSホーム画面アイコンの指定。
  // Next.jsのMetadata APIがここから<link>タグを自動生成するため、layout側にheadタグを書く必要はない。
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-180.png" },
      { url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-167.png", sizes: "167x167", type: "image/png" }
    ]
  },
  // iOSでホーム画面に追加したときの見た目・名前を固定する。
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "La Voce"
  },
  // apple-mobile-web-app-capable は非推奨。新しい標準タグ mobile-web-app-capable を
  // 追加で入れておく（Apple版は互換のため残す。両方入れるのが現時点の最善）。
  other: {
    "mobile-web-app-capable": "yes"
  }
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F1E7"
};
export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
