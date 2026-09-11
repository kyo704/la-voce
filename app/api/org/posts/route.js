import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import {
  PERM_KEYS, isSchoolWide, permSet, TEMPLATE_POSTS,
  mayGrantPost, mayChangePerson, CANNOT_CHANGE_REASON
} from "@/lib/opsPerms";
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
  const { data: me, error } = await admin.from("memberships")
    .select("role, post_id").eq("org_id", orgId).eq("user_id", userId).maybeSingle();
  // ★★黙って 落とさない こと（★2026-09-11・実機の ご報告）。
  //   ★★はじめ error を 捨てていました。★列が 無い・行が 2つ ある などで
  //     ★me が null に なり、★「見つかりません」に 化けていました。
  if (error) console.error("名簿を読めませんでした:", error, { orgId, userId });
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
  // ★★2026-09-11、★受け取り方を まちがえていました。
  //   ★getUserWithTimeout が 返すのは { user, unreachable } です。
  //   ★★{ data: { user } } で 受けていたので、★user が いつも undefined。
  //     ★★どなたでも 401 に なっていました（★実機で ご報告を いただきました）。
  //   ★「確かめられなかった」と「入っておられない」を、★分けます。
  const { user, unreachable } = await getUserWithTimeout(supabase, "役職を触るときの認証確認");
  if (unreachable) {
    return NextResponse.json({ error: tx("いま、つながりません。") }, { status: 503 });
  }
  if (!user) {
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
    console.error("役職を触れませんでした:", { role: member.role, hasPerms: !!perms, action });
    return NextResponse.json({
      // ★★なぜ だめかを 言います。★黙って 断りません。
      error: perms
        ? tx("あなたの役職には「ひとの 役職を 変える」が ありません。")
        : tx("まだ 役職が ありません。はじめの ひな型は、学校を 作った方が 作れます。")
    }, { status: 403 });
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
    const { data: made, error } = await admin.from("org_posts").insert(rows).select("id, name");
    if (error) return NextResponse.json({ error: tx("いま、つながりません。") }, { status: 503 });

    // ★★作った方に、★いちばん 上の 役職を その場で お付けします。
    //   ★★2026-09-11、★行き止まりが 1つ ありました。
    //     ★★役職の 無い 方は、★ここで 10を 作れます。
    //       ★けれど mayGrantPost が、★学校ぜんぶに かかる できこと（meibo・post …）を
    //       ★★「自分が 持っていない ものは 人に 渡せない」として 落とします。
    //     ★★だから、★10を 作った その方が、★その どれも 名乗れませんでした。
    //       ★名乗れるのは 教授・准教授・講師だけ（★学校ぜんぶに かからない ため）。
    //     ★★新しい 学校が、★誰も 学長の いない まま 始まっていました。
    //   ★★ここで 力は 1つも 増えません。
    //     ★その方は たった今、★10すべてを 自分で 決められたのですから。
    //   ★★付けるのは、★まだ 役職を お持ちでない ときだけです。
    //     ★上書きしません（★この家の「黙って 消さない」の ままです）。
    const top = (made || []).find((r) => r.name === TEMPLATE_POSTS[0].name);
    let mine = null;
    if (top && !member.post_id) {
      const { error: e2 } = await admin.from("memberships")
        .update({ post_id: top.id }).eq("org_id", orgId).eq("user_id", user.id);
      // ★★付けられなくても、★10は できています。★そこは 巻き戻しません。
      //   ★★返事で はっきり お伝えします（★mine が null のまま）。
      if (!e2) mine = top.name;
    }
    return NextResponse.json({ made: rows.length, mine });
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

  // ★★役職を 外す。★postId は 要りません。
  //   ★★人を 消しません。★役職だけを 外します。
  if (action === "unassign") {
    const targetUser = body && typeof body.userId === "string" ? body.userId : null;
    if (!targetUser) {
      return NextResponse.json({ error: tx("足りない指定があります。") }, { status: 400 });
    }
    const { data: them } = await admin.from("memberships")
      .select("user_id, post_id").eq("org_id", orgId).eq("user_id", targetUser).maybeSingle();
    if (!them) return NextResponse.json({ error: tx("見つかりませんでした。") }, { status: 404 });
    if (them.post_id) {
      const { data: cur } = await admin.from("org_posts")
        .select("perms").eq("id", them.post_id).maybeSingle();
      if (!mayChangePerson(perms, cur)) {
        return NextResponse.json({ error: CANNOT_CHANGE_REASON }, { status: 403 });
      }
    }
    const { error } = await admin.from("memberships")
      .update({ post_id: null }).eq("org_id", orgId).eq("user_id", targetUser);
    if (error) return NextResponse.json({ error: tx("いま、つながりません。") }, { status: 503 });
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

  // ★★人に 役職を 付ける／外す（★見本 SC['役職を変える']）。
  //   ★★決まりは 2つ（★裁定 §7-4）。
  //     ① 付ける 役職の「学校ぜんぶに かかる」ことを、★自分が ぜんぶ 持っていること
  //     ② いま 付いている 役職の それも、★ぜんぶ 持っていること
  //   ★★②が 無いと、★自分より 強い 人を 降ろせて しまいます。
  if (action === "assign") {
    const targetUser = body && typeof body.userId === "string" ? body.userId : null;
    if (!targetUser) {
      return NextResponse.json({ error: tx("足りない指定があります。") }, { status: 400 });
    }
    const { data: them } = await admin.from("memberships")
      .select("user_id, post_id").eq("org_id", orgId).eq("user_id", targetUser).maybeSingle();
    if (!them) return NextResponse.json({ error: tx("見つかりませんでした。") }, { status: 404 });

    // ★① 付ける ほう
    if (!mayGrantPost(perms, target)) {
      return NextResponse.json({ error: CANNOT_CHANGE_REASON }, { status: 403 });
    }
    // ★② いま 付いている ほう
    if (them.post_id) {
      const { data: cur } = await admin.from("org_posts")
        .select("perms").eq("id", them.post_id).maybeSingle();
      if (!mayChangePerson(perms, cur)) {
        return NextResponse.json({ error: CANNOT_CHANGE_REASON }, { status: 403 });
      }
    }
    const { error } = await admin.from("memberships")
      .update({ post_id: postId }).eq("org_id", orgId).eq("user_id", targetUser);
    if (error) return NextResponse.json({ error: tx("いま、つながりません。") }, { status: 503 });
    return NextResponse.json({ ok: true });
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
