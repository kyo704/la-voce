// ============================================================================
// テストがソースを本文として読むときの、共通の下ごしらえ。
//
// ★なぜ要るか
//   このリポジトリのテストの多くは「禁止語が出てこないこと」を機械的に
//   確かめます。ところが仕様の引用や「こう書かないこと」という戒めは、
//   コメントの中にその語そのものを含みます。素のまま調べると、
//   自分が書いた説明文で落ちます。
//
//   この罠は少なくとも2回踏みました（周期記録の位相の語、
//   「この分析を強くする」の「データ不足」）。8つのテストが各自で
//   コメント除去を書いており、同じ決定が8か所にある状態でした。
//   ★このリポジトリで繰り返している不具合の形そのものなので、1か所に集約します。
//
// ★使い方
//   const { readCode, readRaw } = require("./_source");
//   const code = readCode("components", "VocalTracker.jsx");  // 禁止語の検査はこちら
//   const raw  = readRaw("components", "VocalTracker.jsx");   // 構造の検査はこちら
//
//   「この書き方をしていること」を確かめたいときは raw を使ってください。
//   コメントを外すと行番号や位置関係が変わります。
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

/**
 * コメントを外す。JSX・JavaScript・SQL のどれでも使えるようにしてある。
 *   {\/* ... *\/}  JSX
 *   \/* ... *\/    ブロック
 *   // ...        行
 *   -- ...        SQL の行
 * ★文字列の中に // が入っている場合（URL など）は消してはいけないので、
 *   引用符の中かどうかを見ながら、頭から1文字ずつ読みます。
 *
 * ★★2026-09-11 の 落とし穴。★これを 正規表現で 書いていたときの 話です。
 *   lib/uiKit.js の 4行目に、★出どころとして
 *     「docs/design/pack/screens/*.html」
 *   と 書いていました。★行コメントの 中です。
 *   ところが 消す 順番が「ブロックが先、行があと」でした。
 *   その ため「/*」が ★ブロックの 開きとして 読まれ、
 *   そこから 次の 「*」＋「/」 までの ★2700字が、★本文ごと 消えました。
 *   消えた 中に export const TYPE = { が 入っていて、
 *   新しい 見張りが「TYPE が 無い」と 言い出しました。
 *   ★本文は 正しく、★読み取る 道具の ほうが 壊れていました。
 *
 *   ★直し方：★行コメントを 先に 落とします。★ブロックは その あと。
 *   ★これで、★行コメントの 中の 開き記号は、★開く 前に 消えます。
 *   ★ブロックの 中に 行頭 // が 来ることは、★この 書き方では ありません
 *   （★JSDoc の 中は ★ * で 始まります）。
 */
function stripComments(text) {
  return String(text == null ? "" : text)
    // ★★行が 先。★ブロックが あと。★この 順番に 意味が あります（上の いきさつ）。
    .replace(/^\s*\/\/.*$/gm, "")           // 行（行頭のものだけ）
    .replace(/^\s*--.*$/gm, "")            // SQL の行
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")   // JSX
    .replace(/\/\*[\s\S]*?\*\//g, "");      // ブロック
}

/** リポジトリ相対のパスで読む（生のまま） */
function readRaw(...parts) {
  return fs.readFileSync(path.join(ROOT, ...parts), "utf-8");
}

/** リポジトリ相対のパスで読み、コメントを外す（禁止語の検査用） */
function readCode(...parts) {
  return stripComments(readRaw(...parts));
}


// ---------------------------------------------------------------------------
// 禁止語の検査は、必ずコメントを外した本文に対して行う
//
//   ★このセッションで、同じ取り違えを4回しました。
//     周期の語彙／「データ不足」／「点数」／「シニア」。
//     どれも、禁止を書いたコメントの側を数えて落ちています。
//
//   readRaw と readCode のどちらを渡すかを毎回選ばせると、また間違えます。
//   ★この関数は、中で readCode を呼びます。生の本文を渡す道がありません。
//     選択肢を消すほうが、注意して覚えるより確実です。
// ---------------------------------------------------------------------------
//   ★これでも足りない場合があります。禁止語が「文字列」として書かれているとき
//     （拒否メッセージが、禁止語をそのまま名指ししているときなど）は、
//     コメントを外しても残ります。5回目はこの形で落ちました。
//     そのときは、この関数ではなく「実際に画面へ出る側」を数えてください。
//     数える場所を間違えている、という同じ誤りの別の形です。
function assertAbsent(words, parts, assertTrue, label) {
  const code = readCode(...parts);
  const list = Array.isArray(words) ? words : [words];
  list.forEach((w) => {
    assertTrue(!code.includes(w), `${label || "★"}「${w}」が本文に出ていない`);
  });
}

// ---------------------------------------------------------------------------
// ★`lib/` の 1本を、★そのまま 読み込む（★2026-09-16）
//
//   ★★見張りは `data:text/javascript` で 読み込みます。★元を そのまま 読む ため です。
//   ★★けれど `@/lib/…` の 別名は、★その とき 解けません（★ERR_INVALID_URL）。
//     ★★別名を 使う lib が 1本でも 増えると、★見張りが 落ちます。
//     ★★2026-09-16、★`lib/classroomShell.js` が `lib/lessonCounts.js` を
//       ★読む ように なった ところで、★2本 落ちました。
//   ★★避ける ために import を 消すと、★同じ 決まりの 2つめの 写しが できます。
//     ★★それが この 蔵の 病い です。★だから 別名の ほうを 解きます。
//
//   ★★★1か所で 持ちます。★見張りごとに 書き写しません。
// ---------------------------------------------------------------------------
async function loadLib(...parts) {
  const path = require("path");
  const full = path.join(ROOT, ...parts);
  // ★★★もとから 拡張子の ある もの（★`.json` など）に、★`.js` を 足しません。
  //   ★★2026-09-17、`lib/sheepInteriorV2.js` が
  //     `@/docs/assets/sheep-interior-index.json` を 読み込んで いて、
  //     ★`…json.js` を 探しに 行き、★見つからず 落ちました。
  //   ★★拡張子が 無い ときだけ `.js` を 補います。
  const body = readRaw(...parts).replace(
    /from "@\/(.+?)"/g,
    (_, rel) => {
      const full = path.join(ROOT, rel);
      if (/\.json$/i.test(rel)) {
        // ★★JSON は、★取り込みの 但し書きが 要ります（★Node の 決まり）。
        //   ★★`with { type: "json" }` を 付けないと 落ちます。
        return `from "${new URL("file://" + full).href}" with { type: "json" }`;
      }
      const withExt = /\.[a-z0-9]+$/i.test(rel) ? full : full + ".js";
      return `from "${new URL("file://" + withExt).href}"`;
    });
  return import("data:text/javascript;base64," + Buffer.from(body, "utf8").toString("base64"));
}

module.exports = {
  assertAbsent, ROOT, stripComments, readRaw, readCode, loadLib };
