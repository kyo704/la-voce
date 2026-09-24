import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
// ★★年齢の 帯の 決めは lib が 持ちます（★裁定 その107）。
import { ageBandOf } from "@/lib/ageGate";

// ============================================================================
// 招待を受けた生徒を、教室に在籍させる（2026-09-01）
//
//   ★なぜサーバ側に移したか
//     これまでは生徒の画面から、★先生の memberships を読んでいました。
//       supabase.from("memberships").select("org_id")
//         .eq("user_id", 先生).eq("role", "owner").maybeSingle()
//     memberships_select は「本人か、教室のオーナー・管理者」だけなので、
//     生徒には0行が返ります。★エラーではなく、ただの0行です。
//     その結果 enrollments の upsert は一度も実行されず、
//     ★enrollments はこの日まで全体で0行でした。
//     生徒の一覧・先生の名簿・担当・レッスンが、すべて空のままでした。
//
//   ★RLS をゆるめる直し方は採りません
//     「生徒が enrollments を自分で入れてよい」ことにすると、
//     ★教室のIDさえ知っていれば誰でも在籍できます。
//     共有範囲の設計（lib/shareScope.js）と逆向きです。
//
//   ★権限の根拠
//     「先生と生徒の紐付けが、いま有効であること」だけです。
//     招待コードは★教室を特定するために使い、権限の根拠にはしません。
//     コードは使用済みになるので、根拠にすると再試行が通らなくなります。
// ============================================================================

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "在籍の認証確認");
  if (unreachable) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) return NextResponse.json({ error: "招待コードがありません。" }, { status: 400 });

  const admin = createAdminClient();

  // ---- 招待から、先生と教室を引く ----
  const { data: invitation, error: invError } = await admin
    .from("teacher_invitations")
    // ★★★招く ときに 決めて おいた 学年・学科も 読みます（★2026-09-19）。
    //   ★★読まないと、★下で 写せません。★列を 足しただけ では 動きません。
    // ★★★`draft_id` …… ★名簿の 下書きの ぶん か（★裁定 その109・2026-09-20）。
    //   ★★紐付けの 根拠は **これ** です。★学籍番号では ありません。
    .select("code, teacher_id, org_id, monka_teacher_id, grade_year, division_id, draft_id")
    .eq("code", code)
    .maybeSingle();
  if (invError) {
    console.error("在籍：招待を読めませんでした。", invError);
    return NextResponse.json({ error: "在籍の登録に失敗しました。" }, { status: 500 });
  }
  if (!invitation) {
    return NextResponse.json({ error: "招待が見つかりません。" }, { status: 404 });
  }

  // ==========================================================================
  // ★権限の確認：いま有効な紐付けがあること
  //
  //   ★招待が使用済みかどうかは見ません。この処理は、紐付けを作った
  //     直後に呼ばれます。そのとき招待は既に使用済みになっています。
  //     使用済みを弾くと、★正しい流れが通らなくなります。
  //   ★見るのは「その先生と、いまつながっているか」だけです。
  // ==========================================================================
  const { data: link, error: linkError } = await admin
    .from("teacher_student_links")
    .select("id")
    .eq("teacher_id", invitation.teacher_id)
    .eq("student_id", user.id)
    .eq("status", "active")
    .limit(1);
  if (linkError) {
    console.error("在籍：紐付けを確認できませんでした。", linkError);
    return NextResponse.json({ error: "在籍の登録に失敗しました。" }, { status: 500 });
  }
  if (!link || link.length === 0) {
    // ★「招待が違う」と「つながっていない」を分けません。
    //   分けると、招待コードの当たりはずれを調べる道具になります。
    return NextResponse.json({ error: "この招待で在籍することはできません。" }, { status: 403 });
  }

  // ---- 教室を決める ----
  // ★新しい招待は org_id を持っています。
  //   古い招待（2026-09-01 より前）は null なので、そのときだけ
  //   先生のオーナー教室を見にいきます。★埋め戻しはしません。
  let orgId = invitation.org_id || null;
  if (!orgId) {
    const { data: owned, error: ownedError } = await admin
      .from("memberships")
      .select("org_id")
      .eq("user_id", invitation.teacher_id)
      .eq("role", "owner")
      .order("created_at", { ascending: true })
      .limit(1);
    if (ownedError) {
      console.error("在籍：先生の教室を確認できませんでした。", ownedError);
      return NextResponse.json({ error: "在籍の登録に失敗しました。" }, { status: 500 });
    }
    orgId = owned && owned.length > 0 ? owned[0].org_id : null;
  }

  // ★先生が教室を持っていないことは、失敗ではありません。
  //   つながり自体は成立しています。在籍だけが作られません。
  if (!orgId) {
    return NextResponse.json({ ok: true, enrolled: false, reason: "no_org" });
  }

  // ==========================================================================
  // ★★★保護者の 同意（★裁定 その107・2026-09-20）
  //
  //   ★★15〜17歳の 方は、★同意が 済むまで 学校に 入れません。
  //     ★★止めるのは ここ だけ です。★個人で 使う ぶんは 何も 変わりません。
  //   ★★★帯が 分からない 方も 止めます（★安全な 側へ 倒します）。
  //     ★★15歳未満は 登録の ときに 弾いて います（★お決め 6㋐）。
  //   ★★★合言葉は もう 使われた ことに なって います。
  //     ★★だから「入れません」で 終わりに しません。★やり直せます
  //       （★画面が 保護者の メールを 尋ね、★済んだら もう一度 押せます）。
  // ==========================================================================
  {
    const { data: 帯行 } = await admin
      .from("profiles").select("age_band, is_under_18").eq("id", user.id).maybeSingle();
    const 帯 = ageBandOf(帯行 || {});
    if (帯 !== "adult") {
      const { data: 同意 } = await admin
        .rpc("has_guardian_consent", { p_user_id: user.id, p_org_id: orgId });
      if (同意 !== true) {
        // ★★学校の 名を 返します（★2026-09-24・見本 `SC['保護者にお知らせ']` の 2行目）。
        //   ★★★画面からは `organizations` を 引けません ── ★在籍が まだ 無い ため です。
        //     ★★名が 無い まま 出すと、★どの 学校の 話か 分からない まま
        //       ★保護者の メールを 預けて いただく ことに なります。
        //   ★★返すのは **名だけ** です。★ほかの 列を 足さない こと。
        const { data: 校 } = await admin
          .from("organizations").select("name").eq("id", orgId).maybeSingle();
        return NextResponse.json({
          ok: false,
          reason: "guardian_consent_required",
          orgId,
          orgName: (校 && 校.name) || "",
          band: 帯
        }, { status: 200 });
      }
    }
  }

  const { error: enrollError } = await admin
    .from("enrollments")
    // ★★`left_at` を **戻します**（★2026-09-16）。
    //   ★★やめた あと、★もう一度 招かれた とき の 話 です。
    //     ★★`onConflict` で 同じ 行が 生き返ります。★`status` は active に 戻ります。
    //     ★★けれど `left_at` は 前の 日付の まま 残ります。
    //   ★★`lib/orgRoster.js` は それを `left_on` に 写します。
    //     ★★在籍中の 方に、★やめた 日が 付いた まま に なります。
    //   ★★「入り直せる」と お約束して います（★`LEAVE_NOTE`）。
    //     ★その 約束を、★台帳の 側でも 揃えます。
    // ★★★招く ときに 決めて おいた 学年・学科を 写します（★2026-09-19）。
    //   ★★見本 `P_maneku` の 字 ──「あとから ご本人が 直せます」。
    //   ★★決めて いなければ 触りません（`undefined` は 送りません）。
    //     ★★★入り直しの とき、★前の 学年を 空で 上書き しない ため です。
    .upsert({
      org_id: orgId, student_id: user.id, status: "active", left_at: null,
      ...(invitation.grade_year != null ? { grade_year: invitation.grade_year } : {}),
      ...(invitation.division_id ? { division_id: invitation.division_id } : {})
    }, { onConflict: "org_id,student_id" });
  if (enrollError) {
    console.error("在籍：登録できませんでした。", { orgId, message: enrollError.message });
    return NextResponse.json({ error: "在籍の登録に失敗しました。" }, { status: 500 });
  }

  // ==========================================================================
  // ★★★名簿の 下書きと 結びます（★裁定 その109・2026-09-20）
  //
  //   ★★結ぶのは、★**その 招待を 受け取った 方** です。
  //     ★★学籍番号を 知って いる だけ では 結びません。
  //     ★★お名前と 番号の 一致でも 結びません。★照らし合わせを しません。
  //   ★★★結べなくても、★在籍は もう できて います。★止めません。
  //     ★★下書きが 消えて いた／すでに 結ばれて いた ── ★どちらも あり得ます。
  // ==========================================================================
  if (invitation.draft_id) {
    const { error: draftError } = await admin
      .from("roster_drafts")
      .update({ linked_user_id: user.id, linked_at: new Date().toISOString() })
      .eq("id", invitation.draft_id)
      .eq("org_id", orgId)
      .is("linked_user_id", null);
    if (draftError) {
      console.warn("在籍：下書きと結べませんでした。", draftError.message);
    }
  }

  // ==========================================================================
  // 担当（assignments）も、ここで作ります。
  //
  //   ★画面からは作れません。生徒は org_id を知る手段が無く、
  //     assignments の RLS もオーナー・管理者向けだからです。
  //   ★二重に作らないよう、先に有無を見ます。
  //     一意制約の形が分からないので、upsert の onConflict に頼りません。
  // ==========================================================================
  // ==========================================================================
  // ★★★受け持ちの 先生は、★`monka_teacher_id` です（★裁定 その83 訂正）。
  //
  //   ★★これまでは `teacher_id`（★合言葉を 出した 方）を 使って いました。
  //   ★★★2026-09-18、★名簿の「＋ 招く」を 作りました。
  //     ★★あれは 事務や 学長が 押します。★`teacher_id` は その 方 です。
  //     ★★★そのまま だと ── ★**学長が 生徒の 先生に なります**。
  //   ★★「誰が 出したか」と「どの 門下か」は 別の こと です。★分けました。
  //
  //   ★★`null` なら 受け持ちを 作りません。★学校に 入る だけ です。
  //     ★★門下は あとから、★名簿か 日程で 決めます。
  //
  //   ★★★Q1（★裁定 その83 の 確かめ）── ★その 先生が、★その 学校に いるか。
  //     ★★別の 学校の 先生の 番号を 入れられない ように します。
  //     ★★合言葉を 作る 側でも 見ますが、★ここでも 見ます。★二重に します。
  const monkaTeacher = invitation.monka_teacher_id || null;
  let assignTo = null;
  if (monkaTeacher) {
    const { data: teacherHere, error: thErr } = await admin
      .from("memberships")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("user_id", monkaTeacher)
      .limit(1);
    if (thErr) {
      console.error("在籍：門下の先生を確認できませんでした。", thErr);
      return NextResponse.json({ ok: true, enrolled: true, assigned: false, orgId });
    }
    if (teacherHere && teacherHere.length > 0) {
      assignTo = monkaTeacher;
    } else {
      // ★★その 学校に いない 先生でした。★受け持ちを 作りません。
      //   ★★在籍は できて います。★そこは 巻き戻しません。
      console.error("在籍：門下の先生が、この学校にいません。", { orgId, monkaTeacher });
      return NextResponse.json({ ok: true, enrolled: true, assigned: false, orgId, reason: "monka_not_in_org" });
    }
  }
  if (!assignTo) {
    // ★★学校だけ の 合言葉 です。★門下は 未定 の まま。
    return NextResponse.json({ ok: true, enrolled: true, assigned: false, orgId, reason: "no_monka" });
  }

  const { data: existingAssignment, error: findError } = await admin
    .from("assignments")
    .select("id")
    .eq("org_id", orgId)
    .eq("teacher_id", assignTo)
    .eq("student_id", user.id)
    // ★★★閉じた 受け持ちを 数に 入れません（★2026-09-16）。
    //   ★★`leave_enrollment` が、★やめる とき `ended_at` を 入れる ように
    //     なりました。★その 行が ここで 見つかって しまうと、
    //     ★入り直した 方に、★新しい 受け持ちが 作られません。
    //   ★★受け持ちが 無ければ、★先生からの 連絡も 門下も 出ません
    //     （★`org_messages_select` が `ended_at is null` を 見ます）。
    //   ★★台帳に 一意の 束ねは ありません（★2026-09-16 に 確かめました ──
    //     ★主キーと 外つなぎ 3つ だけ）。★だから もう1本 足せます。
    //     ★★過去の 受け持ちは、★記録として 残ります。
    .is("ended_at", null)
    .limit(1);
  if (findError) {
    // ★在籍は作れています。担当が作れなくても、そこは巻き戻しません。
    console.error("在籍：担当を確認できませんでした。", findError);
    return NextResponse.json({ ok: true, enrolled: true, assigned: false, orgId });
  }
  if (!existingAssignment || existingAssignment.length === 0) {
    const { error: assignError } = await admin
      .from("assignments")
      .insert({ org_id: orgId, teacher_id: assignTo, student_id: user.id });
    if (assignError) {
      console.error("在籍：担当を作れませんでした。", { orgId, message: assignError.message });
      return NextResponse.json({ ok: true, enrolled: true, assigned: false, orgId });
    }
  }

  return NextResponse.json({ ok: true, enrolled: true, assigned: true, orgId });
}
