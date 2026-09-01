// ============================================================================
// 教室を閉じる／オーナーが退会するときの扱い
//
//   出典 docs/lavoce-教室プラン仕様-複数教師と複数生徒.md §46（owner＝契約者。
//        課金・席の増減・★教室の削除）
//        判断（2026-09-01、A＋B・Cは却下）
//
//   ★この1ファイルが持つ決めごと
//     ① 教室に「ほかの方」が何人いるか（＝誰を数えるか）
//     ② オーナーが退会するとき、教室をどうするか（消す／止める）
//     ③ 教室を閉じると、何が消えて何が残るか
//     ④ 画面に出す文言
//
//   ★なぜ1つにまとめるか
//     この判定は「退会の処理」と「教室の画面」の両方から要ります。
//     2か所に書くと、片方だけ直したときに
//     ★「画面では止まるのに、APIは消してしまう」が起こります。
//     この repo で繰り返し起きてきた壊れ方そのものです。
//
//   ★自動の引き継ぎは作りません（判断C＝却下）。
//     オーナーは契約者です。自動で引き継ぐと、承諾していない人に
//     ★支払いの義務を負わせることになります。
//     引き継ぎは、知らせる→承諾を得る→移す、の順で、公開後に作ります。
//     それまでは運営者が手で入れ替えます。
// ============================================================================

import { isMissingTable } from "./supabaseErrors.js";

/**
 * ★「ほかの方」として数える相手。
 *
 *   講師・オーナー   memberships（役割を問わない）
 *   生徒            enrollments（★status が active の人だけ）
 *
 * ★生徒も数えます。「ほかに◯人の方がいます」の「方」に、生徒さんは
 *   当然ふくまれます。数えないと、生徒が在籍したままの教室が
 *   ★黙って消えます。消えたことは、生徒側の画面にしか現れません。
 *
 * ★status が 'left' の人は数えません。すでに自分で抜けた人を数えると、
 *   もう誰もいない教室を永久に閉じられなくなります。
 */
export const OTHER_PEOPLE_SOURCES = [
  { table: "memberships", userColumn: "user_id", activeFilter: null },
  { table: "enrollments", userColumn: "student_id", activeFilter: { column: "status", value: "active" } }
];

/**
 * 教室を閉じるとき、消す順番。
 *
 * ★外部キーの実際の向きに合わせた順です。子から先に消します。
 *   ★ここを cascade 任せにしないこと。2026-09-01 の退会の失敗は、
 *     「たぶん cascade するはず」で書いた一覧が原因でした。
 *     実際に確かめた順を、明示して並べます。
 */
export const CLOSE_ORG_DELETE_ORDER = [
  { table: "lessons", column: "org_id" },
  { table: "assignments", column: "org_id" },
  { table: "enrollments", column: "org_id" },
  { table: "org_invitations", column: "org_id" },
  { table: "memberships", column: "org_id" },
  { table: "organizations", column: "id" }
];

// ---------------------------------------------------------------------------
// 文言（★画面に直接書かないこと。ここが唯一の正）
// ---------------------------------------------------------------------------

/** 教室を閉じる前の確認。★残るものを先に言うこと。 */
export const CLOSE_ORG_KEEP_LINE =
  "教室を閉じても、生徒さんが書いた記録は、消えません。ご本人のものとして残ります。";

/** ★「消えるもの」は、この3つだけ。増えたらここを直すこと。 */
export const CLOSE_ORG_DELETE_LINE =
  "消えるもの：教室そのもの／先生と生徒の紐付け／レッスンの予定";

/**
 * オーナーの退会を止めるときの知らせ。
 *
 * ★2つとも、押せるボタンにすること（Opus の訂正、2026-09-01）。
 *   最初の案は「教室を閉じる」だけがボタンで、引き継ぎは押せない文字でした。
 *   ★それでは、戻せないほうだけが押せる形になります。
 *     人は押せるものを押します。文言が中立でも、選択肢は中立ではありません。
 *
 * ★「教室を残す」は mailto: を開きます。件名に★教室のIDを入れること。
 *   入れないと、最初の返信が「どの教室ですか」から始まります。
 *   引き継ぎは運営者が手で入れ替えるので、IDが分からないと何もできません。
 */
export function departingOwnerNotice(otherCount) {
  return {
    lines: [
      `この教室には、ほかに ${otherCount}人 の方がいます。`,
      "アカウントを削除すると、この教室の契約者がいなくなります。"
    ],
    choices: [
      {
        key: "close",
        label: "教室を閉じる",
        action: "button",
        lines: [
          "このまま終わりにします。元に戻せません",
          "生徒さんが書いた記録は消えません。ご本人のものとして残ります"
        ]
      },
      {
        key: "keep",
        label: "教室を残す",
        action: "mailto",
        lines: [
          "別の先生に引き継ぎます。迷っている場合も、こちらへ",
          "運営者にご連絡ください。3日以内にお返事します"
        ]
      }
    ]
  };
}

/**
 * 「教室を残す」を押したときに開くメールの下書き。
 *
 * ★件名に教室のIDを必ず入れます。名前だけでは足りません。
 *   「マイ教室」は ensureOwnOrg がつける既定の名前なので、
 *   ★同じ名前の教室が、人数ぶん存在します。名前では特定できません。
 */
export function transferMailto(org, email) {
  const orgId = (org && org.orgId) || "";
  const name = (org && org.name) || "教室";
  const subject = `教室の引き継ぎについて（教室ID: ${orgId}）`;
  const body = [
    "Woolsong 運営者さま",
    "",
    `教室「${name}」を、別の先生に引き継ぎたいです。`,
    "（迷っている場合は、その旨をお書きください）",
    "",
    "----------------------------------------",
    "★この行より下は、消さないでください",
    `教室ID: ${orgId}`,
    `教室名: ${name}`,
    "----------------------------------------",
    ""
  ].join("\n");
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------------------------------------------------------------------------
// 判定
// ---------------------------------------------------------------------------

/**
 * その人がオーナーである教室の一覧。
 *
 * ★memberships の owner だけでなく、created_by も見ます。
 *   membership の作成だけ失敗した教室（オーナーの居ない教室）が
 *   実際に生まれうるためです（VocalTracker の ensureOwnOrg 参照）。
 *   ここで拾わないと、その教室は誰にも消せなくなります。
 */
export async function listOwnedOrgs(client, userId) {
  const ids = new Set();

  const { data: owned, error: mErr } = await client
    .from("memberships").select("org_id").eq("user_id", userId).eq("role", "owner");
  if (mErr) return { error: mErr };
  (owned || []).forEach((r) => r.org_id && ids.add(r.org_id));

  const { data: created, error: oErr } = await client
    .from("organizations").select("id").eq("created_by", userId);
  if (oErr) return { error: oErr };
  (created || []).forEach((r) => r.id && ids.add(r.id));

  return { orgIds: [...ids] };
}

/**
 * その教室にいる「ほかの方」の人数。
 *
 * ★同じ人が講師としても生徒としても入っている場合を、二重に数えません。
 *   「ほかに2人」と出たのに1人しかいない、が起きます。
 */
export async function countOtherPeople(client, orgId, userId) {
  const people = new Set();
  for (const src of OTHER_PEOPLE_SOURCES) {
    let q = client.from(src.table).select(src.userColumn).eq("org_id", orgId);
    if (src.activeFilter) q = q.eq(src.activeFilter.column, src.activeFilter.value);
    const { data, error } = await q;
    if (error) return { error };
    (data || []).forEach((row) => {
      const id = row[src.userColumn];
      if (id && id !== userId) people.add(id);
    });
  }
  return { count: people.size };
}

/**
 * 退会しようとしている人の教室を、2つに仕分ける。
 *
 *   solo    ほかに誰もいない  → 行ごと消す（判断B）
 *   blocked ほかに人がいる    → ★退会を止める（判断の追加要件）
 *
 * ★止めるほうが1つでもあれば、退会の処理は何も始めません。
 *   途中まで消してから止めると、記録だけ消えてアカウントが残ります。
 */
export async function classifyOwnedOrgs(client, userId) {
  const owned = await listOwnedOrgs(client, userId);
  if (owned.error) return { error: owned.error };

  const solo = [];
  const blocked = [];
  for (const orgId of owned.orgIds) {
    const counted = await countOtherPeople(client, orgId, userId);
    if (counted.error) return { error: counted.error };
    if (counted.count === 0) {
      solo.push(orgId);
    } else {
      const { data } = await client.from("organizations").select("id, name").eq("id", orgId).maybeSingle();
      blocked.push({ orgId, name: (data && data.name) || "教室", otherCount: counted.count });
    }
  }
  return { solo, blocked };
}

/**
 * 教室を1つ閉じる。★呼ぶ前に、閉じてよいかを確かめること。
 * この関数は権限を見ません（管理者クライアントで動かすため）。
 */
export async function closeOrg(admin, orgId) {
  const failures = [];
  for (const { table, column } of CLOSE_ORG_DELETE_ORDER) {
    const { error } = await admin.from(table).delete().eq(column, orgId);
    // ★表が無いだけなら無視します。列が無いのは無視しません（判定は1か所）。
    if (error && !isMissingTable(error)) failures.push({ table, message: error.message });
  }
  return failures;
}
