// ============================================================================
// 職業と「声の使い方の配合」— 1つの決めごとを1つの場所に
//
// 出典：docs/lavoce-作業指示-職業を声の型で切り直す.md §7・§8
//
// ★この表が、職業に関する唯一の正です。
//   これまで職業の呼び名は3か所に別々に書かれていて、中身が食い違って
//   いました（「ミュージカル」が singer と pop_musical の両方の名前に
//   入っていた）。同じ決めごとが2か所にあると、片方だけ直されます。
//   新しく職業を読むコードは、必ずこのファイルを通してください。
//
// ★v1 では、配合を計算に一切使いません（§2-1・§10-1）。
//   保存はしますが、負荷の計算にも、分析の説明変数にも入れません。
//   songFactor / strain / KAPPA / EWMA のλは変えません（§10-2）。
//
// ★配合は日々の記録には保存しません（§7）。プロフィールに1つだけです。
//   職業を変えても、過去の記録は1行も書き換えません（§10-6）。
// ============================================================================

// 11の職業。★これ以外を足さないこと。
//   管楽器・器楽は足しません（声帯を使わず、共通コアが成立しません／§10-11）。
//   教員・保育士・コールセンターも足しません。いまは「その他」で受けます（§10-12）。
export const OCCUPATIONS = [
  "classical", "musical", "pops", "voiceActor", "narrator",
  "announcer", "actorStage", "actorScreen", "rakugo", "mc", "other"
];

// 「その他」は12番目の職業ではなく、1つの受け皿です。
// ★11に細分しないこと。細分すると、選ぶ人が自分を探せなくなります。
export const OTHER_OCCUPATION = "other";

// 選ぶ画面に出す順番（§3）。★複数選択にしないこと（§10-5）。
export const OCCUPATION_LABELS = {
  classical:   "声楽・オペラ",
  musical:     "ミュージカル",
  pops:        "ポップス／ロック",
  voiceActor:  "声優",
  narrator:    "ナレーター",
  announcer:   "アナウンサー",
  actorStage:  "俳優（舞台）",
  actorScreen: "俳優（映像）",
  rakugo:      "落語・講談",
  mc:          "司会・MC",
  other:       "その他"
};

// 歌う / 話す / 張る の配合。合計は必ず10（§2）。
// ★既定値です。本人があとから動かせます（§7）。設定の奥に置き、
//   最初の画面には出しません（§2）。
export const DEFAULT_MIX = {
  classical:   { sing: 9, speak: 1,  project: 0 },
  musical:     { sing: 6, speak: 2,  project: 2 },
  pops:        { sing: 7, speak: 1,  project: 2 },
  voiceActor:  { sing: 1, speak: 7,  project: 2 },
  narrator:    { sing: 0, speak: 10, project: 0 },
  announcer:   { sing: 0, speak: 10, project: 0 },
  actorStage:  { sing: 0, speak: 7,  project: 3 },
  actorScreen: { sing: 0, speak: 9,  project: 1 },
  rakugo:      { sing: 1, speak: 9,  project: 0 },
  mc:          { sing: 0, speak: 8,  project: 2 },
  other:       { sing: 3, speak: 5,  project: 2 }
};

export const MIX_TOTAL = 10;

// ---------------------------------------------------------------------------
// 既存ユーザーの移行（§8①）
//
// いまの5つの値を、新しい職業に読み替えます。
// ★過去の記録は再計算も書き換えもしません（§8②）。読み替えるのは
//   プロフィールの職業だけです。
//
//   singer      → classical
//       ラベルが最初から「声楽家」でした。既定値ではなく、一致です。
//
//   pop_musical → pops
//       ラベルは「ポップス/ミュージカル歌手」で、2つに分かれます。
//       学ぶ画面では「ポップス／ロック」、設計IDでは "pops-rock" と
//       呼んでいて、3つの呼び名のうち2つが「ポップス」を指します。
//       歌の比重も pops のほうが高い（7対6）ため、pops に寄せました。
//       ★ミュージカルの方は、設定から自分で選び直せます。
//
//   announcer   → announcer
//       新しい表では narrator と分かれますが、配合は 0/10/0 で同一です。
//       どちらに寄せても数字は動きません。画面で見えていた
//       「アナウンサー」に合わせました。
//
//   voice_actor → voiceActor ／ other → other（そのまま）
//
// ★これは1回きりの既定値です。本人が直せば、それが正になります。
export const LEGACY_TO_OCCUPATION = {
  singer: "classical",
  pop_musical: "pops",
  announcer: "announcer",
  voice_actor: "voiceActor",
  other: "other"
};

// 逆向き。古い列（profiles.vocal_profession）を当面そのまま残すため、
// 新しい職業から古い値を導きます。entries の legacy 列と同じ考え方です。
// ★古い列は「数えてから」消します（§10-9・§6）。まだ消しません。
export const OCCUPATION_TO_LEGACY = {
  classical: "singer",
  musical: "singer",
  pops: "pop_musical",
  voiceActor: "voice_actor",
  narrator: "announcer",
  announcer: "announcer",
  actorStage: "voice_actor",
  actorScreen: "voice_actor",
  rakugo: "other",
  mc: "other",
  other: "other"
};

/** 有効な職業キーか。 */
export function isOccupation(key) {
  return typeof key === "string" && OCCUPATIONS.includes(key);
}

/**
 * プロフィールから職業を決める。
 * 新しい列があればそれを、無ければ古い列から読み替える。
 * ★どちらも無ければ classical（辞書に無いときの既定と揃える／§4）。
 */
export function occupationOf(profile) {
  if (!profile) return "classical";
  // ★読むのは voice_occupation です。profiles.occupation ではありません。
  //   occupation は登録画面の自由記述（「学生」「会社員」など）で、
  //   この機能とは無関係の、別の人が作った別の列です。奪ってはいけません。
  if (isOccupation(profile.voice_occupation)) return profile.voice_occupation;
  const legacy = profile.vocal_profession || profile.vocalProfession;
  return LEGACY_TO_OCCUPATION[legacy] || "classical";
}

/** 配合の形と合計を検める。合計が10でなければ受け付けない（§2）。 */
export function isValidMix(mix) {
  if (!mix || typeof mix !== "object") return false;
  const keys = ["sing", "speak", "project"];
  if (Object.keys(mix).length !== keys.length) return false;
  for (const k of keys) {
    const v = mix[k];
    if (!Number.isInteger(v) || v < 0 || v > MIX_TOTAL) return false;
  }
  return keys.reduce((s, k) => s + mix[k], 0) === MIX_TOTAL;
}

/**
 * そのユーザーの配合。本人が動かしていればそれを、
 * 動かしていなければ職業の既定値を返す。
 * ★勝手に既定値へ戻さないこと。職業を変えたときは、戻すか本人に聞く（§7）。
 */
export function mixOf(profile) {
  const own = profile && (profile.voice_mix || profile.voiceMix);
  if (isValidMix(own)) return { ...own };
  return { ...DEFAULT_MIX[occupationOf(profile)] };
}

/** 職業の表示名。★分析の文章には使わないこと（§10-3）。 */
export function occupationLabel(key) {
  return OCCUPATION_LABELS[isOccupation(key) ? key : "other"];
}

// ============================================================================
// 曲目・演目に添える「もう一段の情報」を、職業ごとに決める
//
//   ★これが唯一の正です。呼ぶ側で professions.includes("singer") のように
//     書き直さないでください。旧い professions は歌う人を singer と
//     pop_musical の2つに分けており、片方だけを見ると
//     ★ポップスの人に歌唱言語の欄が出ませんでした（2026-08-29 の不具合）。
//
//   設計憲章：「その他」には、みんなに共通の内容だけを出す。
//   そのため other には何も足しません。落語も、いまは足しません
//   （原稿ベースの話芸の欄も、役の欄も、当てはまらないため）。
// ============================================================================

/** 歌唱言語（伊・独・仏…）。歌う職業。 */
export const EXTRA_SINGING_LANGUAGE = "singingLanguage";
/** 役の情報（作品名・声の質）。役を演じる職業。 */
export const EXTRA_ROLE = "role";
/** 案件の情報（原稿の種類・話す速さ・生かどうか）。原稿を読む職業。 */
export const EXTRA_PROJECT = "project";

export const REPERTOIRE_EXTRA_BY_OCCUPATION = {
  classical:   EXTRA_SINGING_LANGUAGE,
  musical:     EXTRA_SINGING_LANGUAGE,
  // ★ポップスも歌います。旧い professions では pop_musical になるため、
  //   singer だけを見ていたときに、ここだけ抜け落ちていました。
  pops:        EXTRA_SINGING_LANGUAGE,
  voiceActor:  EXTRA_ROLE,
  actorStage:  EXTRA_ROLE,
  actorScreen: EXTRA_ROLE,
  narrator:    EXTRA_PROJECT,
  announcer:   EXTRA_PROJECT,
  mc:          EXTRA_PROJECT,
  rakugo:      null,
  other:       null
};

/**
 * その職業の曲目・演目に、どの欄を添えるか。
 * ★当てはまるものが無ければ null。欄そのものを出しません。
 */
export function repertoireExtraFor(occupation) {
  if (!isOccupation(occupation)) return null;
  return REPERTOIRE_EXTRA_BY_OCCUPATION[occupation] || null;
}
