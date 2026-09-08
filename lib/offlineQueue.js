"use client";

// ============================================================================
// 電波がなくても動く ── 第2便・§7-1（★最優先）
//
//   ★出どころ docs/opus/woolsong-裁定-全体レイアウトと教室機能・Sonnetへの引き継ぎ（9月8日）.md
//
//   ★★「音大の練習室は地下です。★教会も ホールの楽屋も 電波が入りません。
//     ★★『出欠を押したのに 通っていなかった』が いちばん困ります。」
//
//   ★★決め
//     □ 押した瞬間に、★画面へ反映（★楽観的更新）
//     □ 送れなかったものは ★列に積み、★電波が戻ったら 自動で送る
//     □ ★同じ操作を2回送っても 1回になる（★冪等キー）
//     □ ★右上に「未送信 2件」。★押すと 一覧
//
//   ★★冪等キー ＝ lesson_id ＋ status ＋ 端末時刻（★§7-1）。
//     ★同じ鍵の行が2つ 積まれないようにします。
//     ★★あとから押し直したときは、★新しいほうで置き換えます。
//       ★「休み」を押したあと「来た」に直したら、★あとが正です。
//
//   ★★消しません。★送れたものだけを、列から外します。
//     ★送れないまま残っているものを、★勝手に捨てないこと。
//
//   ★見張り components/tests/offline-queue.test.js
// ============================================================================

const KEY = "woolsong-unsent";

/** ★冪等キー。★同じ操作を2回送っても、1回になります。 */
export function idemKey(entry) {
  if (!entry || !entry.lessonId || !entry.status) return null;
  return `${entry.lessonId}:${entry.status}:${entry.at || ""}`;
}

/** ★どの行のことか（★押し直しを見つけるための鍵）。 */
export function targetKey(entry) {
  return entry && entry.lessonId ? String(entry.lessonId) : null;
}

/**
 * ★列に積みます。
 *
 *   ★★同じレッスンを押し直したら、★あとのほうで置き換えます。
 *     ★2つ積むと、★あとから来たほうが先に届くことがあります。
 *   ★★まったく同じ操作（★冪等キーが同じ）は、★足しません。
 */
export function enqueue(list, entry) {
  const cur = Array.isArray(list) ? list : [];
  const k = idemKey(entry);
  if (!k) return cur;
  if (cur.some((x) => idemKey(x) === k)) return cur;
  const t = targetKey(entry);
  return [...cur.filter((x) => targetKey(x) !== t), { ...entry, key: k }];
}

/** ★送れたものを、列から外します。★送れなかったものは、残します。 */
export function dequeue(list, sentKeys) {
  const done = new Set(sentKeys || []);
  return (Array.isArray(list) ? list : []).filter((x) => !done.has(idemKey(x)));
}

export function unsentCount(list) {
  return (Array.isArray(list) ? list : []).length;
}

// ---------------------------------------------------------------------------
// ★端末に、とっておく
//
//   ★★仕様は IndexedDB と書いていますが、★localStorage にします。
//     ★★積むのは「出欠の押した記録」だけです。★1件が100バイトほどで、
//       ★1日ぶんでも数十件です。★IndexedDB を持ち出す量ではありません。
//     ★★読み書きが同期なので、★押した瞬間に確実に残ります。
//       ★IndexedDB は非同期で、★書き終わる前に画面を閉じられると 消えます。
//     ★量が増えたら、★そのとき移します。★ここ1か所を直せば済みます。
// ---------------------------------------------------------------------------

export function load() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch (e) {
    // ★読めなくても、★これからのぶんは積めます。★止めません。
    return [];
  }
}

export function save(list) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(Array.isArray(list) ? list : []));
    return true;
  } catch (e) {
    // ★★書けなかったことを、★黙って飲みこみません。
    //   ★呼ぶ側が「送れていないかもしれません」と伝えられるようにします。
    return false;
  }
}

/**
 * ★いま、送れるか。
 *
 *   ★★navigator.onLine は、★あてになりません（★地下の Wi-Fi でも true）。
 *     ★だから、★これで判じません。★送ってみて、失敗したら積みます。
 *   ★★ここでは「はっきり圏外のとき」だけを見ます。
 */
export function surelyOffline() {
  if (typeof navigator === "undefined") return false;
  return navigator.onLine === false;
}
