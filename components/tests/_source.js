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
  const fs = require("fs");
  const os = require("os");

  // ★★★2026-09-18、★2段 めで 落ちる ように なりました。
  //   ★★これまでは、★読み込む 1本 の 中の `@/` だけ を 解いて いました。
  //   ★★その 1本が `file://` の もう 1本を 読み、★その 中に `@/` が あると、
  //     ★★そちらは 解かれず、★`Cannot find package '@/lib'` で 落ちます。
  //   ★★★`lib/opsSearch.js` → `lib/opsNav.js` → `lib/opsPerms.js` で 起きました。
  //   ★★逃げ道は 2つ ありました ──
  //     ★★㋐ 取り込みを 増やさない …… ★同じ 決めの 2つ目の 写しが できます
  //     ★★㋑ 道具を 直す ……………… ★こちら です
  //   ★★★だから、★**たどれる ぶん ぜんぶ** を 写して から 読みます。
  //     ★★写しは 使い捨ての 置き場に 作ります。★元は 触りません。
  const 置き場 = fs.mkdtempSync(path.join(os.tmpdir(), "wsv-"));
  const 済み = new Set();

  function 写す(相対) {
    if (済み.has(相対)) return;
    済み.add(相対);
    const 元 = path.join(ROOT, 相対);
    if (!fs.existsSync(元)) {
      // ★★★無い ものを 黙って 飛ばしません。★止めます。
      //   ★★飛ばすと、★「読めた」と 見えて、★中身が 空に なります。
      throw new Error("★止まりました ── 読もうと した ものが ありません: " + 相対);
    }
    let 本文 = fs.readFileSync(元, "utf8");
    本文 = 本文.replace(/from "@\/(.+?)"/g, (_, rel) => {
      if (/\.json$/i.test(rel)) {
        // ★★JSON は 但し書きが 要ります（★Node の 決まり）。★写さず 元を 読みます。
        return `from "${new URL("file://" + path.join(ROOT, rel)).href}" with { type: "json" }`;
      }
      const 先 = /\.[a-z0-9]+$/i.test(rel) ? rel : rel + ".js";
      写す(先);
      return `from "${new URL("file://" + path.join(置き場, 先)).href}"`;
    });
    const 出 = path.join(置き場, 相対);
    fs.mkdirSync(path.dirname(出), { recursive: true });
    fs.writeFileSync(出, 本文);
  }

  const 入口 = parts.join("/");
  写す(入口);
  return import("file://" + path.join(置き場, 入口));
}


// ---------------------------------------------------------------------------
// ★★★いま 正の 見本の 荷は どこか ── ★1か所 だけ（★2026-09-19）
//
//   ★★見張りは `docs/opus/visual-2026-09-18/pack/…` を 名指しで 持って いました。
//     ★★荷が `visual-2026-09-19/` に 移り、★9つの 見張りが 古い 荷を 見て いました。
//     ★★★名指しが いくつも あると、★荷が 動いた 日に 片方だけ 古く なります。
//   ★★`tools/pack_path.py` と 同じ 決め ── ★いちばん 新しい 日付の 荷 を 選びます。
//   ★★★無ければ 止まります。★古い 荷へ こっそり 戻りません。
// ---------------------------------------------------------------------------

/** ★いま 正の 荷（`docs/opus/visual-YYYY-MM-DD/pack`）の 名前の 並び。 */
function packParts() {
  const 置き場 = path.join(ROOT, "docs", "opus");
  const 候補 = fs.readdirSync(置き場)
    .filter((d) => /^visual-\d{4}-\d{2}-\d{2}$/.test(d))
    .filter((d) => fs.existsSync(path.join(置き場, d, "pack")))
    .sort().reverse();
  if (候補.length === 0) {
    throw new Error("★止まりました ── visual-YYYY-MM-DD の 荷が ありません");
  }
  return ["docs", "opus", 候補[0], "pack"];
}

/** ★正の 荷の 中の 1本を、★そのまま 読みます。 */
function readPack(...parts) {
  return readRaw(...packParts(), ...parts);
}

module.exports = {
  assertAbsent, ROOT, stripComments, readRaw, readCode, loadLib,
  packParts, readPack };
