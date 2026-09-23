// ============================================================================
// ★★★機能の 切り替え ── ★判じるのは この ファイル だけ です
//
//   ★出どころ  裁定176（★作り終えて 本番に 隠して 置く）／ sql/30・sql/33
//   ★★坂本さんの お決め（2026-09-23）──
//     「実装と 配置は 進める。★公開と 案内は、★安全の 証明が 済んでから」
//
//   ★★★なぜ 1か所か
//     ★この 家の くり返す 不具合は、★**同じ 判じが 2か所に ある** ことです。
//     ★★画面ごとに 「koen が on か」を 書くと、★隠し忘れが 必ず 出ます。
//       ★`lib/featureFlags.js`（★指導者・教室の 機能）と 同じ 形に 揃えます。
//
//   ★★★決めを 持って いるのは **台帳** です。★ここでは 持ちません。
//     ★`public.feature_on(key)` が 1つの 答えを 出します ──
//         on       … みんな
//         internal … 運営（profiles.is_internal）だけ
//         beta     … 運営 ＋ 印の ついた 人（feature_flag_testers）
//         off      … 誰にも
//         ★無い 鍵 … ★false（★勝手に 開かない）
//     ★`public.my_features()` は、★それを 鍵の ぶん まとめて 返します。
//
//   ★★この ファイルが 持つのは 2つ だけ です ──
//     ① 台帳に 1回 尋ねる 道（`loadFeatures`）
//     ② 受け取った 答えの 読み方（`featureOn`）★無い 鍵は false
// ============================================================================

/**
 * ★台帳に 1回 尋ねます。
 *
 *   ★★読めなかった ときは **空**を 返します。
 *     ★★`featureOn` は 無い 鍵を false と するので、
 *       ★つながらない ときは「ぜんぶ 閉じて いる」に 倒れます。
 *     ★★★迷ったら 閉じる、が この 家の 決め です。
 *       ★開いて しまうと、★証明の 済んで いない 機能が 人の 目に 触れます。
 *
 * @param {object} supabase ★`lib/supabase/client` の もの
 * @returns {Promise<object>} ★鍵 → 真偽
 */
export async function loadFeatures(supabase) {
  if (!supabase) return Object.freeze({});
  try {
    const { data, error } = await supabase.rpc("my_features");
    if (error || !data || typeof data !== "object") {
      if (error) console.error("★機能の 切り替えを 読めませんでした:", error);
      return Object.freeze({});
    }
    return Object.freeze({ ...data });
  } catch (e) {
    console.error("★機能の 切り替えを 読めませんでした:", e);
    return Object.freeze({});
  }
}

/**
 * ★その 機能を 出して よいか。
 *
 *   ★★`features` が まだ 無い（読み込み中）ときも false です。
 *     ★★★出して から 消すのでは なく、★済んでから 出します。
 *       ★一瞬 見えて 消える のは、★見えたのと 同じ です。
 *
 * @param {object} features ★`loadFeatures` の 答え
 * @param {string} key      ★鍵（koen ／ homepage ／ pricing …）
 * @returns {boolean}
 */
export function featureOn(features, key) {
  if (!features || typeof features !== "object") return false;
  if (typeof key !== "string" || key === "") return false;
  return features[key] === true;
}

/**
 * ★いま 隠れて いる 機能の 鍵。
 *
 *   ★★出発の 朝の 確認（裁定171）で 使います。
 *     ★台帳の `features_hidden()` は 運営（サーバ）だけ が 呼べます。
 *     ★★こちらは 画面の 側 の 同じ 答え です。
 */
export function hiddenFeatures(features) {
  if (!features || typeof features !== "object") return [];
  return Object.keys(features).filter((k) => features[k] !== true).sort();
}
