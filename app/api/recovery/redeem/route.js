import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRecoveryCode } from "@/lib/recoveryCodeServer";
import { sendEmailChangedNotice } from "@/lib/securityMail";
import {
  normalizeRecoveryCode, isWellFormedRecoveryCode,
  RECOVERY_MAX_ATTEMPTS, recoveryLockMinutes, isRecoveryLocked
} from "@/lib/recoveryCode";

// ============================================================================
// 復旧コードで、メールアドレスを付け替える（2026-09-05）
//
//   出どころ docs/reports/2026-09-05-復旧コードの使い方-設計.md（★承認済み）
//            docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §3・§7
//
//   ★★この道は、★ログインしていない方が通ります。
//     ★メールを失って、★もう入れない方のための道です。
//     ★だから、★セッションを見ません。
//
//   ★受け取るもの
//     ・いままでのアドレス   ★「受け取れない」のであって「忘れた」ではありません
//     ・復旧コード
//     ・これから使うアドレス
//
//   ★★条件は2つです。★アドレスを知っていること。★コードを持っていること。
//     ★どちらか片方では、通りません。
//
//   ★合ったら、★アドレスを付け替えます。
//     ★そのあと、★新しいアドレスに番号を送って、ふつうに入っていただきます。
//
//   ★★合っても合わなくても、★同じ答えを返します。
//     ★「そのアドレスは登録されていません」と言い分けないこと。
//     ★言い分けると、★誰が使っているかを調べる道具になります。
// ============================================================================

// ★合っても合わなくても、これを返します。★時間も、なるべく揃えます。
const SAME_ANSWER = {
  ok: true,
  // ★★「送りました」と、ここでは言いません。
  //   ★この経路は、★番号を1通も送りません（admin の経路です）。
  //   ★送るのは、★このあと画面の側です。
  //   ★2026-09-05 夜、★ここが嘘になっていました。
  message: "お手続きを受け付けました。"
};

// ★調べる道具にされないための、待ち時間（ミリ秒）。
//   ★★合っているときも、合っていないときも、★同じだけ待ちます。
const EVEN_OUT_MS = 700;

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(request) {
  const started = Date.now();
  // ★どこで終わっても、★同じくらいの時間になるようにします。
  const evenOut = async (res) => {
    const rest = EVEN_OUT_MS - (Date.now() - started);
    if (rest > 0) await wait(rest);
    return res;
  };

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const oldEmail = String(body.oldEmail || "").trim().toLowerCase();
  const newEmail = String(body.newEmail || "").trim().toLowerCase();
  const code = normalizeRecoveryCode(body.code);

  // ★形だけは、先に見ます。★ここは秘密ではありません。
  if (!oldEmail || !newEmail || !isWellFormedRecoveryCode(code)) {
    return evenOut(NextResponse.json(
      { error: "入れていただいた内容を、もう一度お確かめください。" },
      { status: 400 }
    ));
  }
  if (oldEmail === newEmail) {
    return evenOut(NextResponse.json(
      { error: "いままでと同じアドレスです。別のアドレスをお使いください。" },
      { status: 400 }
    ));
  }

  const admin = createAdminClient();

  // ★アドレスから、その方を探します。
  //   ★★見つからなくても、★見つからなかったと言いません（上の決め）。
  let user = null;
  try {
    // ★admin の一覧から探します。★件数が増えたら、ここを索く形に変えます。
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    user = (data && data.users || []).find(
      (u) => String(u.email || "").toLowerCase() === oldEmail
    ) || null;
  } catch (e) {
    console.error("★アドレスから探せませんでした:", e && e.message);
    return evenOut(NextResponse.json(
      { error: "いま、つながりません。少し置いて、もう一度お試しください。" },
      { status: 503 }
    ));
  }

  if (!user) return evenOut(NextResponse.json(SAME_ANSWER, { status: 200 }));

  const { data: row, error: rowErr } = await admin
    .from("recovery_codes").select("*").eq("user_id", user.id).maybeSingle();
  if (rowErr) {
    console.error("★控えを読めませんでした:", rowErr.message);
    return evenOut(NextResponse.json(
      { error: "いま、つながりません。少し置いて、もう一度お試しください。" },
      { status: 503 }
    ));
  }
  if (!row) return evenOut(NextResponse.json(SAME_ANSWER, { status: 200 }));

  // ★★とめている間は、★照らしません。★総当たりは、ただで回せます。
  if (isRecoveryLocked(row.locked_until, new Date())) {
    return evenOut(NextResponse.json(SAME_ANSWER, { status: 200 }));
  }
  // ★一度使った控えは、★もう使えません。
  if (row.used_at) return evenOut(NextResponse.json(SAME_ANSWER, { status: 200 }));

  const matched = await verifyRecoveryCode(code, row.code_salt, row.code_hash);

  if (!matched) {
    // ★まちがえた回数を増やし、★5回からは、まちがえるたびに長くとめます。
    const attempts = (Number(row.failed_attempts) || 0) + 1;
    const minutes = recoveryLockMinutes(attempts);
    const patch = { failed_attempts: attempts };
    if (minutes > 0) {
      patch.locked_until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    }
    const { error: upErr } = await admin
      .from("recovery_codes").update(patch).eq("user_id", user.id);
    if (upErr) console.error("★とめる印を書けませんでした:", upErr.message);
    return evenOut(NextResponse.json(SAME_ANSWER, { status: 200 }));
  }

  // ------------------------------------------------------------------
  // ★合いました。★アドレスを付け替えます。
  //
  //   ★★順番を守ること。
  //     ① 控えを使用済みにする  ★先に閉じます。★同じ控えで2度通させません
  //     ② アドレスを付け替える
  //     ③ 履歴を残す（★乗っ取りに気づく、唯一の手がかりです）
  //   ★②が失敗したら、★①を戻します。★控えを失わせないためです。
  // ------------------------------------------------------------------
  const usedAt = new Date().toISOString();
  const { error: closeErr } = await admin
    .from("recovery_codes")
    .update({ used_at: usedAt, failed_attempts: 0, locked_until: null })
    .eq("user_id", user.id)
    .is("used_at", null);
  if (closeErr) {
    console.error("★控えを閉じられませんでした:", closeErr.message);
    return evenOut(NextResponse.json(
      { error: "いま、つながりません。少し置いて、もう一度お試しください。" },
      { status: 503 }
    ));
  }

  // ★★email_confirm について（2026-09-05 夜・★書き直しました）
  //
  //   ★はじめ false にしていました。★狙いは正しかったのですが、★噛み合いません。
  //
  //   ★false のとき、そのアドレスは「まだ確かめていない」状態です。
  //     ★その状態で signInWithOtp を呼ぶと、Supabase は
  //     ★★「登録の確認」の側の番号を送ります。
  //     ★こちらの画面は verifyOtp({ type: "email" }) で受けています。
  //     ★★噛み合いません。★番号が届いても、通らない形です。
  //
  //   ★true にすると、★「ログインの番号」が送られ、★type: "email" で受かります。
  //
  //   ★★安全は、落ちません。
  //     ★この印が決めるのは「どちらの番号を送るか」だけです。
  //     ★★入れるかどうかを決めるのは、★番号そのものです。
  //     ★番号を入れるまで、★セッションは1つも作られません。
  //       （この経路は cookie を1行も触りません）
  //
  //   ★打ち間違いの危険は、★画面で2回入れていただくことで止めています。
  const { error: mailErr } = await admin.auth.admin.updateUserById(user.id, {
    email: newEmail,
    email_confirm: true
  });
  if (mailErr) {
    console.error("★アドレスを付け替えられませんでした:", mailErr.message);
    // ★控えを戻します。★★使えない控えを残さないこと。
    await admin.from("recovery_codes")
      .update({ used_at: null }).eq("user_id", user.id);
    return evenOut(NextResponse.json(
      { error: "いま、つながりません。少し置いて、もう一度お試しください。" },
      { status: 503 }
    ));
  }

  // ★履歴。★足すだけです。★消しません。
  const { error: logErr } = await admin.from("email_change_log").insert({
    user_id: user.id,
    old_email: oldEmail,
    new_email: newEmail,
    via: "recovery"
  });
  if (logErr) console.error("★履歴を残せませんでした:", logErr.message);

  // ★★新旧の両方に、お知らせします（判断-メールを失うこと §7）。
  //   ★古いほうは、受け取れないかもしれません。★それでも送ります。
  //   ★★「古いアドレスがまだ生きていた」場合が、★いちばん危ないからです。
  //   ★送れなくても、★ここで止めません。
  //     ★送れないことより、★入れないことのほうが重いです。
  const notified = await sendEmailChangedNotice({
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.FEEDBACK_FROM_EMAIL,
    oldEmail,
    newEmail,
    changedVia: "recovery"
  });
  if (notified === 0) console.error("★変更のお知らせを送れませんでした");

  return evenOut(NextResponse.json(SAME_ANSWER, { status: 200 }));
}
