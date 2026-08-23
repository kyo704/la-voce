import { headers } from "next/headers";

// capacitor.config.json の appendUserAgent と対応させること。
export const NATIVE_APP_UA_TOKEN = "LaVoceNativeApp";

// サーバーコンポーネント / Route Handler からのみ呼び出し可能（next/headers を使うため）。
export function isNativeApp() {
  const h = headers();
  const ua = h.get("user-agent") || "";
  return ua.includes(NATIVE_APP_UA_TOKEN);
}
