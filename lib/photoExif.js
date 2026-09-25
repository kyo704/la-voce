// ============================================================================
// ★写真 ── ★撮った ときの 情報を 残さない（★裁定199・2026-09-25）
//
//   ★見本 `SC['写真']`（★design-v51）── ★約束 3行 ──
//     ①「上げる ときに 1度だけ 小さく します（長い辺 1,200px）」
//     ②「撮った 場所の 情報は、こちらで 消します」
//     ③「外しても、ほかの 記録は 変わりません」
//
//   ★★★裁定199 の 決め 3つ ──
//     ★① Exif は 1つ 残らず 落とす（★機種・撮影日時・シリアル番号も 手がかり）
//     ★② 端末と サーバの 両方で 除去
//     ★③ 元画像は 保持しない
//
//   ★★★3段（★坂本さんの お決め・2026-09-25）──
//     ★1段 端末   `canvas` に 描き直す（★消すのでは なく 作り直す）
//     ★2段 サーバ  ★**確かめて 断る**（★`sharp` 等を 入れない）
//     ★3段 台帳   `portfolio_photos_read` が `exif_cleared_at` を 見る（★sql/83・済）
//
//   ★★★この ファイルは **両方から 呼ばれます**（★端末と サーバ）。
//     ★だから 外の 道具に 頼りません。★`Uint8Array` だけで 読みます。
//     ★★`canvas` を 使う ところ だけ、★端末で しか 動きません（★下に 分けて あります）。
//
//   ★★★「確かめて 断る」に した わけ ──
//     ★落とし直すと、★**落とせた つもり** に なれます。
//     ★確かめて 断る なら、★通った ものは「★無い」と 言い切れます。
// ============================================================================

/** ★長い辺の 上限（★見本・裁定145）。★小さく しか しません。 */
export const MAX_EDGE = 1200;

/** ★何枚まで（★見本・裁定145）。★台帳の `assert_photo_limit` と 同じ 数 です。 */
export const MAX_PHOTOS = 20;

/**
 * ★入れもの（★Storage）。★署名つきの 道で 出します（★坂本さんの お決め）。
 *
 *   ★★★`SIGNED_URL_SECONDS` は 短く します ── ★10分。
 *     ★★署名つきの 道は、★渡って しまえば 誰でも 開けます。
 *       ★長いほど、★人手に 渡った 道が 生きて いる 時間が 長く なります。
 *     ★★短すぎると 画面を 開いた まま の 方に 切れて 見えます ──
 *       ★★10分は、★1枚の ページを 見る のに 足り、★持ち歩くには 短い 長さ です。
 */
export const BUCKET = "portfolio-photos";
export const SIGNED_URL_SECONDS = 60 * 10;

/**
 * ★★★見せて よいかを 決めるのは **台帳** です。★ここでは 決めません。
 *
 *   ★`portfolio_photos_read`（★sql/83）が こう 言って います ──
 *     ★本人 …… ぜんぶ
 *     ★他人 …… ★`exif_cleared_at` が 立って いて、かつ 公開の 範囲が 合う とき だけ
 *
 *   ★★★だから 道を 作る ところでは、★**その方の 鍵で 行を 引きます**。
 *     ★★引けた ＝ 見て よい。★引けなかった ＝ 見て はいけない。
 *     ★★★同じ 判じを 2か所に 書きません。★書くと、★片方が 古く なります。
 *
 *   ★★`id` だけ 受け取ります。★`path` を 受け取りません ──
 *     ★★★`path` を 受け取ると、★他人の 道を 渡されて しまいます。
 *       ★道は、★台帳が 返した 行から 取ります。
 */
export const SIGN_BY_ID_ONLY = true;

/** ★道を 頼む ところ。★字は ここ 1か所 です。 */
export const URL_ENDPOINT = "/api/portfolio-photo/url";
export const UPLOAD_ENDPOINT = "/api/portfolio-photo";

/**
 * ★署名つきの 道を まとめて 頼みます。
 *
 *   ★★返すのは `{ [id]: url }` です。★無い ものは 入りません。
 *   ★★★`id` しか 送りません。★道（path）を 送りません。
 *   ★★読めなかった ときは 空で 返します。★落ちません ── ★写真が 出ない だけ です。
 */
export async function fetchSignedUrls(ids) {
  const list = (Array.isArray(ids) ? ids : []).filter((x) => typeof x === "string");
  if (list.length === 0) return {};
  try {
    const r = await fetch(URL_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: list })
    });
    const j = await r.json().catch(() => ({}));
    return (j && j.ok && j.urls && typeof j.urls === "object") ? j.urls : {};
  } catch (e) {
    return {};
  }
}

/** ★出す 形。★`path` は `user_id/uuid.webp`（★sql/83 の 注）。 */
export const OUT_TYPE = "image/webp";
export const OUT_QUALITY = 0.9;

/** ★台帳の 関数（★字は ここ 1か所）。 */
export const MARK_FN = "mark_exif_cleared";

/** ★引く 列 だけ。 */
export const COLS_PHOTO = "id, path, w, h, tone, shape, sort_order, exif_cleared_at";

/**
 * ★★★断った ときの 字（★坂本さんの お決め・2026-09-25）。
 *
 *   ★「もう一度 お試しください」では 足りません ── ★なぜ 断ったかを 書きます。
 */
export const REJECT_LINE = "写真に 撮った ときの 情報が 入って います";

/** ★受け取る 形（★これ以外は 見ません）。 */
export const ACCEPT_TYPES = Object.freeze(["image/jpeg", "image/png", "image/webp"]);

// ============================================================================
// ★★★① 印を 探す ── ★中身は 読みません。★在るか 無いか だけ です
//
//   ★★読まない わけ ── ★読むと、★読んだ ものを どこかに 書きたく なります。
//     ★在るか 無いか だけ 分かれば 断れます。
// ============================================================================

/** ★JPEG の 印（★落とす もの）。★APP1〜APP15 と COM。 */
const JPEG_BAD = Object.freeze([
  0xE1, // APP1  … Exif ／ XMP
  0xE2, // APP2  … ICC ／ FlashPix
  0xEC, // APP12 … Ducky（撮影の 設定）
  0xED, // APP13 … Photoshop IRB（IPTC）
  0xEE, // APP14 … Adobe
  0xFE  // COM   … 覚え書き
]);

function 印JPEG(b) {
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i + 3 < b.length) {
    if (b[i] !== 0xFF) return null;               // ★形が 崩れて います
    const m = b[i + 1];
    if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
    if (m === 0xDA || m === 0xD9) return null;    // ★点の 中身に 入りました
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2) return null;
    // ★★COM（0xFE）は APP では ありません。★`m - 0xE0` で 呼ぶと「APP30」に なります。
    //   ★★名が ちがうと、★見張りの 出す 字が 嘘に なります（★2026-09-25 に 直しました）。
    if (JPEG_BAD.includes(m)) {
      return "jpeg:" + (m === 0xFE ? "COM" : "APP" + String(m - 0xE0));
    }
    i += 2 + len;
  }
  return null;
}

function 字(b, i, n) {
  let s = "";
  for (let k = 0; k < n && i + k < b.length; k += 1) s += String.fromCharCode(b[i + k]);
  return s;
}

const PNG_BAD = Object.freeze(["eXIf", "tEXt", "iTXt", "zTXt", "tIME"]);

function 印PNG(b) {
  if (b.length < 8) return null;
  const sig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  for (let k = 0; k < 8; k += 1) if (b[k] !== sig[k]) return null;
  let i = 8;
  while (i + 8 <= b.length) {
    const len = (b[i] * 0x1000000) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
    const name = 字(b, i + 4, 4);
    if (PNG_BAD.includes(name)) return "png:" + name;
    if (name === "IEND") return null;
    if (len < 0 || len > b.length) return null;
    i += 12 + len;
  }
  return null;
}

const WEBP_BAD = Object.freeze(["EXIF", "XMP "]);

function 印WEBP(b) {
  if (b.length < 16) return null;
  if (字(b, 0, 4) !== "RIFF" || 字(b, 8, 4) !== "WEBP") return null;
  let i = 12;
  while (i + 8 <= b.length) {
    const name = 字(b, i, 4);
    const len = b[i + 4] | (b[i + 5] << 8) | (b[i + 6] << 16) | (b[i + 7] * 0x1000000);
    if (WEBP_BAD.includes(name)) return "webp:" + name.trim();
    if (len < 0 || len > b.length) return null;
    i += 8 + len + (len % 2);
  }
  return null;
}

/**
 * ★撮った ときの 情報が 入って いるか。
 *
 *   ★★返すのは **どこに 在ったか** の 短い 名 か、★無ければ `null`。
 *   ★★★名を 返すのは、★見張りが「見つけられる」ことを 確かめる ため です。
 *     ★画面には 出しません ── ★出すのは `REJECT_LINE` だけ です。
 *
 * @param {Uint8Array} bytes
 * @returns {string|null}
 */
export function findMetadata(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  return 印JPEG(b) || 印PNG(b) || 印WEBP(b);
}

/** ★きれいか（★入って いなければ true）。 */
export function isClean(bytes) {
  return findMetadata(bytes) === null;
}

// ============================================================================
// ★★★② 大きさ ── ★小さく しか しません
// ============================================================================

/**
 * ★長い辺を `MAX_EDGE` に します。
 *
 *   ★★★小さい 写真を 引き伸ばしません ── ★粗く なる だけ です。
 *     ★見本の 字 ──「小さく します」。★大きく する と 書いて いません。
 */
export function fitSize(w, h) {
  const W = Number(w), H = Number(h);
  if (!Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) return null;
  const long = Math.max(W, H);
  if (long <= MAX_EDGE) return { w: Math.round(W), h: Math.round(H), resized: false };
  const r = MAX_EDGE / long;
  return { w: Math.max(1, Math.round(W * r)), h: Math.max(1, Math.round(H * r)), resized: true };
}

/** ★もう 足せないか（★台帳の `assert_photo_limit` と 同じ 数）。 */
export function mayAddPhoto(count) {
  const n = Number(count);
  return Number.isFinite(n) && n < MAX_PHOTOS;
}

/** ★何枚めか の 字（★見本「3 / 20枚。いちばん 上が 顔の 写真に なります。」）。 */
export function countLine(n) {
  return String(Number(n) || 0) + " / " + String(MAX_PHOTOS)
    + "枚。いちばん 上が 顔の 写真に なります。";
}

/** ★1枚目に 付く 字（★見本 `顔　`）。 */
export const FACE_MARK = "顔";

/** ★下の 3行（★見本の `.note`・1文字も 変えないこと）。 */
export const NOTE_LINES = Object.freeze([
  "上げる ときに 1度だけ 小さく します（長い辺 1,200px）。",
  "撮った 場所の 情報は、こちらで 消します。",
  "外しても、ほかの 記録は 変わりません。"
]);

// ============================================================================
// ★★★③ 端末で 作り直す ── ★ここだけ 端末でしか 動きません
// ============================================================================

/**
 * ★写真を 作り直します（★`canvas`）。
 *
 *   ★★★これは「消す」処理では ありません。★**作り直す** 処理 です。
 *     ★`canvas` が 持つのは 点の 色 だけ です。★Exif の 入る 場所が ありません。
 *     ★★だから 機種も 撮影日時も シリアル番号も、★写す もとが ありません。
 *
 *   ★★★向き（Orientation）を 先に 立て直します。
 *     ★Exif を 落とすと、★横向きの 写真が 倒れた まま に なります。
 *     ★`imageOrientation: "from-image"` で 立てて から 描きます。
 *     ★★立てた あとは もう 要りません ── ★点の 並びが 正しく なって います。
 *
 *   ★★元の ものを 返しません ── ★返すのは 作り直した もの だけ です（★裁定199 ③）。
 *
 * @param {Blob} file
 * @returns {Promise<{blob: Blob, w: number, h: number}>}
 */
export async function rebuild(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const s = fitSize(bmp.width, bmp.height);
  if (!s) { bmp.close && bmp.close(); throw new Error("SIZE_UNKNOWN"); }
  const cv = document.createElement("canvas");
  cv.width = s.w; cv.height = s.h;
  const cx = cv.getContext("2d");
  cx.drawImage(bmp, 0, 0, s.w, s.h);
  bmp.close && bmp.close();
  const blob = await new Promise((ok, ng) => {
    cv.toBlob((b) => (b ? ok(b) : ng(new Error("ENCODE_FAILED"))), OUT_TYPE, OUT_QUALITY);
  });
  return { blob, w: s.w, h: s.h };
}
