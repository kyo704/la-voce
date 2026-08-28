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
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
