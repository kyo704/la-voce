import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { PERM_KEYS, isSchoolWide, permSet, TEMPLATE_POSTS } from "@/lib/opsPerms";
import { tx } from "@/lib/t";

// ============================================================================
// 役職と できること ── 書き込む 道（★権限の 作り直し・2段目）
//
//   ★出どころ docs/design/pack-final/裁定-9月10日夜の7点（役職への一本化ほか）.md §7
//            見本 SC['役職の一覧'] ／ SC['役職の中身']
//
//   ★★なぜ サーバで 書くか。
//     ★器の SQL（1段目）で、★画面には select しか 渡していません。
//     ★★渡さない ままに します。★渡すと、★画面の 確かめだけが 守りに なります。
//     ★★渡せる／渡せないの 決まりは、★ここで 確かめます。
//       ★見本は 灰色の つまみで 止めますが、★それは 見た目です。
//       ★★見た目だけの 守りは、守りでは ありません。
//
//   ★★決まりは 1つ（★裁定 §7-4）。
//     「学校ぜんぶに かかる ことは、★自分が 持っていないと 渡せません」
//     ★★これで 権限の 持ち上げが 起きません。
//
//   ★見張り components/tests/ops-posts-route.test.js
// ============================================================================

/** ★その方の、その学校での「できること」。★役職が 無ければ null。 */
async function permsOf(admin, orgId, userId) {
  const { data: me } = await admin.from("memberships")
    .select("role, post_id").eq("org_id", orgId).eq("user_id", userId).maybeSingle();
  if (!me) return { member: null, perms: null };
  if (!me.post_id) return { member: me, perms: null };
  const { data: post } = await admin.from("org_posts")
    .select("perms").eq("id", me.post_id).maybeSingle();
  return { member: me, perms: post ? permSet(post.perms) : null };
}

/**
 * ★役職を 触ってよいか。
 *
 *   ★★役職を 持っている 方 … 「ひとの 役職を 変える」（post）が 要ります。
 *   ★★まだ 誰も 役職を 持っていない あいだ … ★学校を 作った方（owner）だけ。
 *     ★★はじめの ひな型を 作る 人が いないと、★1つも 始まりません。
 *     ★3段目で、★ここを 狭めます。
 */
function mayTouchPosts(member, perms) {
  if (!member) return false;
  if (perms) return perms.has("post");
  return member.role === "owner";
}

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } = {}, error: authError } = await getUserWithTimeout(supabase);
  if (authError || !user) {
    return NextResponse.json({ error: tx("ログインが必要です。") }, { status: 401 });
  }

  let body = null;
  try { body = await request.json(); } catch (e) { body = null; }
  const orgId = body && typeof body.orgId === "string" ? body.orgId : null;
  const action = body && typeof body.action === "string" ? body.action : null;
  if (!orgId || !action) {
    return NextResponse.json({ error: tx("足りない指定があります。") }, { status: 400 });
  }

  const admin = createAdminClient();
  const { member, perms } = await permsOf(admin, orgId, user.id);
  if (!member) {
    // ★★その学校の 名簿に いない 方には、★何も 返しません。
    //   ★「無い」と「見られない」を 言い分けません。★探れなく する ためです。
    return NextResponse.json({ error: tx("見つかりませんでした。") }, { status: 404 });
  }
  if (!mayTouchPosts(member, perms)) {
    return NextResponse.json(
      { error: tx("あなたの役職では、役職を変えられません。") }, { status: 403 });
  }

  // ★★ひな型を 作る（★はじめの 1回）。
  if (action === "template") {
    const { data: had } = await admin.from("org_posts").select("id").eq("org_id", orgId).limit(1);
    if (had && had.length > 0) {
      // ★★すでに ある ところに、★重ねて 作りません。
      //   ★消したはずの 役職が 戻ってきます。
      return NextResponse.json({ error: tx("もう役職があります。") }, { status: 409 });
    }
    const rows = TEMPLATE_POSTS.map((p, i) => ({
      org_id: orgId, name: p.name, sort_order: i,
      perms: Object.fromEntries(p.perms.map((k) => [k, true]))
    }));
    const { error } = await admin.from("org_posts").insert(rows);
    if (error) return NextResponse.json({ error: tx("いま、つながりません。") }, { status: 503 });
    return NextResponse.json({ made: rows.length });
  }

  // ★★役職を 足す。★はじめは できることが 1つも ありません（★見本の 注記）。
  if (action === "add") {
    const name = body && typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 40) {
      return NextResponse.json({ error: tx("名前を入れてください。") }, { status: 400 });
    }
    const { error } = await admin.from("org_posts")
      .insert({ org_id: orgId, name, perms: {}, sort_order: 999 });
    if (error) {
      // ★同じ 名前が ある ときは、★そう 言います。★黙って 落としません。
      return NextResponse.json({ error: tx("その名前は、もうあります。") }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  }

  const postId = body && typeof body.postId === "string" ? body.postId : null;
  if (!postId) return NextResponse.json({ error: tx("足りない指定があります。") }, { status: 400 });

  // ★★その 役職が、★その学校の ものか。★よその 学校の 役職を 触らせません。
  const { data: target } = await admin.from("org_posts")
    .select("id, org_id, name, perms").eq("id", postId).maybeSingle();
  if (!target || target.org_id !== orgId) {
    return NextResponse.json({ error: tx("見つかりませんでした。") }, { status: 404 });
  }

  if (action === "rename") {
    const name = body && typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 40) {
      return NextResponse.json({ error: tx("名前を入れてください。") }, { status: 400 });
    }
    const { error } = await admin.from("org_posts").update({ name }).eq("id", postId);
    if (error) return NextResponse.json({ error: tx("その名前は、もうあります。") }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  if (action === "perm") {
    const key = body && typeof body.key === "string" ? body.key : null;
    const on = body && body.on === true;
    if (!PERM_KEYS.includes(key)) {
      return NextResponse.json({ error: tx("知らない項目です。") }, { status: 400 });
    }
    // ★★ここが 要です（★裁定 §7-4）。
    //   ★学校ぜんぶに かかる ことは、★自分が 持っていないと 渡せません。
    //   ★★画面でも 灰色に しますが、★守りは ここです。
    if (on && isSchoolWide(key) && !(perms && perms.has(key))) {
      return NextResponse.json({
        error: tx("学校全部に かかる ことは、自分が 持っていないと 渡せません。")
      }, { status: 403 });
    }
    const next = { ...(target.perms || {}) };
    // ★★true の ものだけ 入れます。★false を 並べません（★器の SQL §1）。
    if (on) next[key] = true; else delete next[key];
    const { error } = await admin.from("org_posts").update({ perms: next }).eq("id", postId);
    if (error) return NextResponse.json({ error: tx("いま、つながりません。") }, { status: 503 });
    return NextResponse.json({ perms: next });
  }

  if (action === "delete") {
    // ★★その 役職の方が いる あいだは、消せません（★見本の 注記）。
    //   ★★消すと、★その方の 役職が 外れます。★人を 迷子に しません。
    const { count } = await admin.from("memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("org_id", orgId).eq("post_id", postId);
    if (count && count > 0) {
      return NextResponse.json({
        error: tx("この役職の方がいるので、消せません。")
      }, { status: 409 });
    }
    const { error } = await admin.from("org_posts").delete().eq("id", postId);
    if (error) return NextResponse.json({ error: tx("いま、つながりません。") }, { status: 503 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: tx("知らない指定です。") }, { status: 400 });
}
