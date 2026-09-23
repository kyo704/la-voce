// ============================================================================
// ★★★作品を さがす ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定174（作品の 表）
//     ／ 見本 `SC['作品をさがす']`
//        woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//        ★2026-09-23 に 展開・docs/design/pack-final/ に 反映
//
//   ★★しぼりこみ そのものは **台帳** が します（`search_works`）。
//     ★画面でも lib でも 並べ替えません。★2か所で 同じ 決めを 持たない ため です。
//     ★★ここが 持つのは「★何を 見せるか」だけ ──
//       ★どの 作曲家を 札に 出すか ／ 何の 欄を 出すか ／ 何と 書くか。
//
//   ★★★種類は **前の 画面で 決まって います**（見本の 註）──
//     「★ここで ジャンルを 選び直させません（前の画面で 決めています）」
//     ★だから 種類を 選ぶ 欄を 作りません。★引数で 受け取る だけ です。
// ============================================================================

/**
 * ★札に 出す 作曲家・作者。
 *
 *   ★★見本の COMP を そのまま 写しました。★並びは **実物の 多い順** です
 *     （★559作品を 数えた 順。★あいうえお順では ありません）。
 *   ★★★ここに 無い 方は、★打ち込みで さがします。★札を 増やしません。
 */
export const COMPOSERS = Object.freeze({
  opera: ["ヴェルディ", "ロッシーニ", "モーツァルト", "ヘンデル", "プッチーニ", "ワーグナー",
    "ドニゼッティ", "ベッリーニ", "R.シュトラウス", "ヤナーチェク", "ビゼー", "マスネ"],
  chorus: ["バッハ", "ヘンデル", "ハイドン", "モーツァルト", "シューベルト", "ブルックナー",
    "フォーレ", "ベートーヴェン", "ブラームス", "ヴェルディ", "メンデルスゾーン",
    "團伊玖磨", "髙田三郎", "佐藤眞"],
  orchestra: ["モーツァルト", "ベートーヴェン", "ブラームス", "チャイコフスキー", "シベリウス",
    "マーラー", "シューマン", "ハイドン", "ドヴォルザーク", "ブルックナー",
    "ラフマニノフ", "ショスタコーヴィチ"],
  chamber: ["ベートーヴェン", "シューベルト", "バッハ", "ショパン", "ドビュッシー", "ブラームス",
    "モーツァルト", "シューマン", "ラヴェル", "リスト", "フランク", "プーランク"],
  band: ["ホルスト", "A.リード", "樽屋雅徳", "グレインジャー", "大栗裕", "スーザ",
    "ヴォーン・ウィリアムズ", "C.T.スミス", "八木澤教司", "伊藤康英"],
  drama: ["歌舞伎（十八番）", "能", "狂言", "文楽", "シェイクスピア", "チェーホフ",
    "モリエール", "ギリシャ悲劇", "イプセン", "近松門左衛門"],
  dance: ["チャイコフスキー", "ミンクス", "ストラヴィンスキー", "プロコフィエフ", "アダン",
    "ハチャトゥリアン", "ドリーブ", "グラズノフ"],
  gala: [], other: []
});

/**
 * ★種類の 名。
 *
 *   ★★★台帳の 字 を 鍵に します（`works_kind_check` ／ `koen_kind_check` ── ★同じ 並び）。
 *     ★見本の `KINDS` は 別の 字 です（`orch` `choir`、★オペラと 演劇を 1つに して います）。
 *     ★★見本は「ひとつの 公演を 作る」ための 大きな くくり、
 *       ★台帳は「作品を 引く」ための 細かい くくり です。★役目が ちがいます。
 *     ★★★台帳の ほうを 正と します ── ★`search_works(p_kind)` が 見るのは こちら だからです。
 *       ★見本と 台帳の 字の ちがいは `docs/ledgers/08-保留している決め.md` に 残しました。
 */
export const KIND_LABELS = Object.freeze({
  opera: "オペラ・ミュージカル", chorus: "合唱", drama: "演劇",
  orchestra: "オーケストラ・吹奏楽", chamber: "室内楽・リサイタル", band: "バンド・ライブ",
  dance: "ダンス", gala: "ガラ・発表会・フェス", recital: "リサイタル",
  recording: "録音・収録", other: "そのほか"
});

/** ★種類の 名（★知らない 字は 空）。 */
export function kindLabel(kind) {
  return KIND_LABELS[kind] || "";
}

/** ★その 種類に 入って いる 作品の 数（★見本の N）。 */
export const KIND_COUNTS = Object.freeze({
  opera: 181, chorus: 71, orchestra: 99, chamber: 74,
  band: 28, drama: 84, dance: 22, gala: 0, other: 0
});

/**
 * ★作曲家の 欄の 名。
 *
 *   ★★★演劇だけ「作者・分野」です（★design-v36 の 直し ③）。
 *     ★「能」「狂言」は 人の 名では ありません。★作曲家 とは 呼べません。
 */
export function composerLabel(kind) {
  return kind === "drama" ? "作者・分野" : "作曲家";
}

/** ★札に 出す 作曲家（★無い 種類は 空）。 */
export function composersFor(kind) {
  return COMPOSERS[kind] || [];
}

/** ★役の 人数の 札。★`0` は「こだわらない」です（★台帳へは null で 渡します）。 */
export const ROLE_MAXES = Object.freeze([
  { value: 0, word: "こだわらない" },
  { value: 4, word: "4人まで" },
  { value: 8, word: "8人まで" },
  { value: 12, word: "12人まで" }
]);

/** ★合唱の 札。 */
export const CHORUS_CHOICES = Object.freeze([
  { value: "", word: "こだわらない" },
  { value: "no", word: "要らない" },
  { value: "yes", word: "要る" }
]);

/**
 * ★合唱の 欄を 出す 種類か。
 *
 *   ★★見本 …… `G==='opera'||G==='chorus'||G==='drama'`
 *   ★★★管弦楽・室内楽・吹奏楽・舞踊には 出しません。★問いが 意味を 持ちません。
 */
export function showsChorusFilter(kind) {
  return kind === "opera" || kind === "chorus" || kind === "drama";
}

/**
 * ★台帳に 渡す 形に します。
 *
 *   ★★`0` と `''` は「こだわらない」です。★そのまま 渡すと **しぼって しまいます**。
 *     ★★★`search_works` は `p_max_roles is null` で 素通し、★`0` だと 0役 だけ に なります。
 */
export function toSearchParams({ q, kind, composer, maxRoles, chorus } = {}) {
  const 言 = String(q == null ? "" : q).trim();
  return {
    p_q: 言 === "" ? null : 言,
    p_kind: kind || null,
    p_composer: composer ? composer : null,
    p_max_roles: Number(maxRoles) > 0 ? Number(maxRoles) : null,
    p_needs_chorus: chorus === "yes" ? true : chorus === "no" ? false : null,
    p_ready_only: true
  };
}

/**
 * ★「下書き あり」の 札を 出すか。
 *
 *   ★★★裁定174 §「画面は『full の作品だけ』を『下書きを作る』に 出す」。
 *     ★`full` ＝ 場面と 役が 入って いる、です。
 *   ★★★design-v36 の 直し ① ── ★前は 偽の 雛形の 番号を 使って いました。
 *     ★押すと 別の 画面へ 行きました。★いまは **札を 出す だけ** です。
 */
export function hasDraft(work) {
  return Boolean(work) && work.completeness === "full";
}

/** ★押した ときの 言葉（★見本の toast）。 */
export function pickedWord(work) {
  return hasDraft(work)
    ? "下書きの もとに しました"
    : "題名を 入れました（この作品の 下書きは まだ ありません）";
}

/**
 * ★1行の 下に 出す 字（★見本の .usu の 2行目）。
 *
 *   ★★役が 0 の とき「0役」と 書きません（★見本 …`w.r?w.r+'役 ／ ':''`）。
 *     ★★管弦楽に 役は ありません。★0 と 書くと、★「役が いない 公演」に 見えます。
 */
export function workLine(work) {
  if (!work) return "";
  const 出 = [];
  if (Number(work.roles) > 0) 出.push(work.roles + "役");
  出.push((work.scenes == null ? 0 : work.scenes) + "場面");
  出.push((work.duration_min == null ? 0 : work.duration_min) + "分");
  let s = 出.join(" ／ ");
  if (work.has_chorus) s += "　合唱あり";
  if (work.school) s += "　" + work.school;
  return s;
}

/** ★見つからない ときの 字（★見本の まま）。 */
export const EMPTY_WORD = "見つかりません。ことばを 変えて みてください";

/** ★種類を 変えたい 方への 案内（★見本の .sub）。 */
export const KIND_NOTE = "種類を 変えるときは ひとつ 戻ってください";

/** ★打ち込みの 枠の 例（★見本の placeholder）。 */
export const SEARCH_PLACEHOLDER = "題名・原題・別名・作曲家（れい：Nozze／魔笛／ヴェルディ）";

/** ★札に 無い 方を さがす ときの 言葉（★見本の toast）。 */
export const OTHER_COMPOSER_WORD = "ここに 無い方は、上の 枠に 打ち込んで ください";

/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★演劇の ときだけ 1行 増えます。★流派で 曲名も 場面の 切り方も ちがう ためです。
 */
export function footNotes(kind) {
  const 出 = [
    "上に 出るのは よく 使われている 順です。「下書き あり」は 場面と 役が 入った 表が すぐ 立ちます。"
  ];
  if (kind === "drama") {
    出.push("能・狂言・歌舞伎は 流派で 曲名も 場面の 切り方も 違います。上演する 版で 確かめてください。");
  }
  出.push("入っているのは 場面と 役と 編成だけです。台本・楽譜・歌詞は ありません。");
  return 出;
}
