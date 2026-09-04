// このファイルは app/manifest.js に上書き保存してください。
export default function manifest() {
  return {
    name: "Woolsong",
    short_name: "Woolsong",
    description: "声のプロフェッショナルのための体調管理",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#F6F1E7",
    background_color: "#F6F1E7",
    // ★★アイコンを差し替えるときは、★必ず名前を変えること（2026-09-05）。
    //   ★同じ名前に上書きすると、★端末とブラウザが古いものを持ち続けます。
    //   ★数日〜数週間、直りません。★これがいちばん多い失敗です。
    //   ★-2609 は、2026年9月の版という意味です。
    icons: [
      { src: "/icons/icon-192-2609.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-2609.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // ★Android は、丸く切ります。★切られても耳が残る引きです。
      { src: "/icons/maskable-192-2609.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512-2609.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
