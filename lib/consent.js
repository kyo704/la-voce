// ============================================================================
// 同意の記録（EUの下地づくり.md §3・作業指示-研究利用の同意.md）
//
// ★1つの仕組みで、日本の要配慮個人情報の同意と、EUの下地の両方を満たします。
//   §3-4「EU 用に別の仕組みを作らないでください」。
//
// ★守ること
//   ① 目的ごとに分ける。まとめて1つのチェックにしない（§3-3）
//   ② 既定でオンにしない
//   ③ 撤回が、同意と同じ手軽さでできること（GDPR 第7条3項）
//   ④ ★撤回しても行を消さない。withdrawn_at を入れる（§3-2）
//   ⑤ ★文言の版とハッシュを必ず保存する。あとから「あの人は何に
//      同意したのか」を答えられなくなるため（§3-2）
//   ⑥ ★IPは保存しない
//   ⑦ 同意しなくても、全機能がまったく同じに使える
//      （研究利用の同意 §1-②。同意を機能の条件にしない）
// ============================================================================

/** 同意の版。★文言を変えたら、必ず上げること。 */
// ★同意した文面の版。★この1か所だけが正です（2026-09-03）。
//   VocalTracker.jsx にも同じ名前の定数があり、値が違っていました
//   （こちらが "ja-2026-08"、あちらが "2026-08-v2"）。
//   ★実際に profiles へ書かれていたのは "2026-08-v2" のほうです。
//   だから★本番に入っている値を残します。名前を1つにするだけで、
//   記録される文字列を変えてはいけません（変えると、同じ文面に
//   同意した人が2つの版に分かれます）。
//
// ★次に上げるときは "ja-2026-09-v1"（言語＋年月＋版）。
//   以後は言語ごとに独立させます（英語が出たら "en-2026-09-v1"）。
//
// ★規則：CONSENT_POLICY_VERSION を上げてよいのは、
//   B-3（プライバシーポリシー）と B-4（利用規約）の本文が確定し、
//   ★その2つへのリンクが実際に開ける日だけです。
//   版を上げることと、文書を出すことは、★同じ1回の作業です。
//   誤字の直しでは上げません。
// ★★2026-09-09、★"ja-2026-09-v1" に 上げました。
//   ★上げてよい日か、★上の規則で 確かめました。
//     ★プライバシーポリシー　docs/legal/privacy-ja-2026-09-v1.md ／ app/legal/privacy
//     ★利用規約　　　　　　 docs/legal/terms-ja-2026-09-v1.md　 ／ app/legal/terms
//     ★同意の画面から、★どちらも 開けます（VocalTracker.jsx:4340・4343）。
//   ★★誤字の直しでは ありません。★同意の文そのものを 変えました
//     （★health.meal_sleep から 病名を 外しました・査読 §4-1）。
//
// ★★これまでに 同意された方の 記録は、★1行も 触りません（★坂本さんのお決め）。
//   ★★"2026-08-v2" と 記録された 行は、★そのまま 残ります。
//     ★その方は、★その日の 文面に 同意されました。★それが 事実です。
//     ★あとから 版を 書き換えると、★何に同意したかが 分からなくなります。
//   ★これから 同意される方から、★"ja-2026-09-v1" が 記録されます。
export const CONSENT_POLICY_VERSION = "ja-2026-09-v1";

/**
 * 目的の一覧。★1つにまとめないこと（§3-3）。
 *
 *   required … これが無いと記録機能そのものが使えないもの。
 *              ★required でも、既定でオンにはしません。本人が押します。
 *   optional … 無くても全機能が同じに使えるもの。
 */
export const CONSENT_PURPOSES = [
  {
    key: "health.record",
    required: true,
    label: "声と体調の記録",
    text: "あなたが入力した声・喉の状態、睡眠、症状などを保存し、あなた自身が振り返るための分析に使います。"
  },
  {
    key: "health.cycle",
    required: false,
    label: "月経周期の記録",
    text: "月経周期の開始日を保存し、あなた自身の分析にだけ使います。★先生や教室には、一切共有されません。"
  },
  {
    key: "health.meal_sleep",
    required: false,
    label: "食事と就寝の記録",
    // ★★病名（逆流）を、★この文から 外しました（★2026-09-09・査読 §4-1）。
    //   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §4
    //     「✕『逆流にかかわる記録』→ ○★『食事と 夜の習慣』」
    //   ★★「あなたは逆流です」とは 一言も 言っていません。★それが この直しの 芯です。
    //   ★★取る中身は、★1つも 変えていません。★言い方だけを 直しました。
    //     ★食事の内容・時刻・就寝時刻。★取るものが 増えても 減っても いません。
    text: "食事の内容と時刻、就寝時刻を保存し、食事と夜の習慣の分析に使います。"
  },
  {
    // ★★逆流のための、からだの置きかたの記録（★2026-09-08）。
    //   ★出どころ docs/opus/woolsong-仕様-分析機能の全体（9月7日・夜）§5-2
    //     「★今日の仕様 §3-3（寝る向き・頭側挙上）は、★同じ重さのものです」
    //
    //   ★★health.meal_sleep と、★分けています。
    //     ★あちらは「何時に食べて、何時に寝たか」。★時刻の記録です。
    //     ★★こちらは「頭を上げて寝た」「腹を締めなかった」。
    //       ★逆流に対して、★何をしたかの記録です。★病歴に近づきます。
    //     ★だから、★食事と就寝に同意した方が、★自動でこちらにも
    //       ★同意したことにはしません。★別に押していただきます。
    //
    //   ★★病名を、★ここに書きません（★食事と就寝の設計 §14-1）。
    //     ★「逆流性食道炎」とも「LPR」とも書きません。
    //     ★書くと、★この画面そのものが、★病名の記録になります。
    key: "health.reflux_care",
    required: false,
    label: "寝るときの姿勢と、締めつけの記録",
    text: "寝るときの向き、頭の側を上げたかどうか、おなかを締めつけていたかどうかを保存し、あなた自身の分析にだけ使います。★病歴に関わる情報です。★先生や教室には、一切共有されません。★第三者へ提供することもありません。★保存先は日本国内（東京）のサーバです。"
  },
  {
    key: "research.anonymized",
    required: false,
    label: "研究への協力",
    // ★画面に出ている文言と、一字一句そろえること（2026-09-01）。
    //   2か所に別の文言があると、どちらに同意したのか答えられなくなります。
    //   正は components/VocalTracker.jsx のオンボーディング step 0 です。
    text: "匿名化した統計として、発声負荷の係数など、分析に使う定数の較正に役立てることに同意します。個人を特定できる形で第三者に提供されることはありません。★オフでも、機能はすべて同じように使えます。"
  }
];

/** 必須の目的の鍵。 */
export const REQUIRED_PURPOSE_KEYS = CONSENT_PURPOSES.filter((p) => p.required).map((p) => p.key);

/** 任意の目的の鍵。★既定はすべてオフ。 */
export const OPTIONAL_PURPOSE_KEYS = CONSENT_PURPOSES.filter((p) => !p.required).map((p) => p.key);

export function purposeByKey(key) {
  return CONSENT_PURPOSES.find((p) => p.key === key) || null;
}

/**
 * 表示した文言のハッシュ（§3-2 の textHash）。
 *
 * ★暗号用ではありません。「どの文面を見せたか」を後から照合するためです。
 *   crypto.subtle は非同期で、同意の記録が1回の操作で閉じなくなるため使いません。
 *   FNV-1a（32bit）。同じ文字列なら、いつでも同じ値になります。
 */
export function textHash(text) {
  const s = String(text == null ? "" : text);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return "fnv1a-" + h.toString(16).padStart(8, "0");
}

/**
 * 保存する1行を組み立てる。
 * ★IPは入れません（§3-2 の ip?: never）。
 */
export function buildConsentRow({ userId, purposeKey, locale, method, now }) {
  const purpose = purposeByKey(purposeKey);
  if (!userId || !purpose) return null;
  return {
    user_id: userId,
    purpose_key: purpose.key,
    policy_version: CONSENT_POLICY_VERSION,
    text_hash: textHash(purpose.text),
    locale: locale || "ja",
    method: method === "button" ? "button" : "checkbox",
    granted_at: now || new Date().toISOString(),
    withdrawn_at: null
  };
}

/**
 * いま有効な同意か。
 * ★同じ目的に複数の行があり得ます（同意→撤回→再同意）。
 *   いちばん新しい granted_at の行を見ます。
 */
export function isGranted(rows, purposeKey) {
  const mine = (rows || [])
    .filter((r) => r && r.purpose_key === purposeKey)
    .sort((a, b) => String(b.granted_at).localeCompare(String(a.granted_at)));
  const latest = mine[0];
  return !!latest && !latest.withdrawn_at;
}

// ★未成年に任意の同意を求めない、という判断（研究利用の同意 §1-④）は
//   ここにはありません。lib/ageGate.js の mayAskForConsent() が持っています。
//
//   もとは、このファイルが profiles.age を見て自分で決めていました。
//   ★あれは体組成の推定のための任意の数値で、年齢の確認ではありません。
//   A-7 の「18歳未満か」を聞くようになったので、判断を1か所へ移しました。
//   ここに同じ関数を作り直さないでください。

/**
 * 撤回の1行。★同意の行を書き換えません。★足すだけです。
 *
 * ★granted_at には★撤回した時刻を入れます。null にしません。
 *   ★isGranted は granted_at の新しい順で見るので、
 *     ★null だと、撤回が「いちばん古い行」になり、★効きません。
 * ★withdrawn_at が入っている行は、その時点で「撤回された」という意味です。
 * ★IPは入れません。
 */
export function buildConsentWithdrawalRow({ userId, purposeKey, now }) {
  const purpose = purposeByKey(purposeKey);
  if (!userId || !purpose) return null;
  const at = now || new Date().toISOString();
  return {
    user_id: userId,
    purpose_key: purpose.key,
    policy_version: CONSENT_POLICY_VERSION,
    text_hash: textHash(purpose.text),
    locale: "ja",
    method: "button",
    granted_at: at,
    withdrawn_at: at
  };
}

