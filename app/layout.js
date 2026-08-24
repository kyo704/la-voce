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
    "声楽家・アナウンサー・声優・ポップス/ミュージカル歌手など、声のプロフェッショナルのための体調管理アプリ。喉・声のコンディション、睡眠、気候、本番の出来までを記録し、傾向を分析します。"
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
