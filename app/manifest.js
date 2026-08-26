// このファイルは app/manifest.js として配置してください。
// Next.js の App Router には、この特別な名前のファイルを認識して
// 自動的に /manifest.webmanifest として配信し、<head> にもリンクを追加する仕組みがあります。
// index.js/layout.js を手動で編集する必要はありません。
export default function manifest() {
  return {
    name: "La Voce - 声のプロのための体調管理",
    short_name: "La Voce",
    description: "声のプロフェッショナルのための、声・喉・体調の記録と分析アプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFDF8",
    theme_color: "#B83131",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
