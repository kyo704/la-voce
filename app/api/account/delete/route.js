import { NextResponse } from "next/server";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeAccount, severConnections } from "@/lib/accountDeletion";
import { classifyOwnedOrgs, departingOwnerNotice, departingPayerNotice } from "@/lib/orgClosure";
// ★★契約者の 決めは lib/orgContract.js が 1つ 持ちます（★裁定 その116）。
import {
  LEAVE_BLOCKED, LEAVE_BLOCKED_HOW, CONTRACT_NONE, CONTRACT_NONE_HOW
} from "@/lib/orgContract";
import { OPERATOR_CONTACT_EMAIL } from "@/lib/brand";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { reauthStillValid } from "@/lib/reauth";
import { blocksDeletion, PAYMENT_BLOCK_LINES } from "@/lib/activeSubscription";
// ★退会の 前に、★会社の ほうを 先に 止めます（★第2段・2026-09-16）。
import { cancelLiveSubscriptions, CANCEL_FAILED_LINES } from "@/lib/stripeCancel";

// ============================================================================
// アカウントの削除（統合実行ルートv4 G3-17 / 作業指示-公開前の実装.md A-4）
//
// mode = "grace"（既定）… 30日の猶予に入れる。誤操作の救済（A-4）。
//                          ★共有だけは即座に切る（教室の側から見えなくなるのは
//                            即時。30日待たない、と A-4 が明記している）
// mode = "now"          … その場で物理削除する（A-4 の「今すぐ完全に削除する」）
//
// 実際の削除の中身は lib/accountDeletion.js に置いてある。猶予明けの定期処理
// （/api/cron/purge-deleted）と同じ処理を使うため。2通りに分かれるとズレる。
// ============================================================================

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "削除の認証確認");
  // ★「確認できなかった」と「ログインしていない」を分ける。
  //   つながらないときに 401 を返すと、利用者は「ログインし直してください」と
  //   案内され、ログインもできず途方に暮れます。503 を返して、時間を置けば
  //   直ることを伝えます。
  if (unreachable) return NextResponse.json({ error: "いま、つながりません。" }, { status: 503 });
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  // 本人確認。画面で入力させた文字列を、ここでもう一度突き合わせる。
  // 画面側だけの確認では、リクエストを直接投げれば素通りしてしまう。
  const typed = (body.confirmation || "").trim();
  const okByEmail = typed.toLowerCase() === (user.email || "").toLowerCase();
  const okByPhrase = typed === "削除します";
  if (!okByEmail && !okByPhrase) {
    return NextResponse.json(
      { error: "確認の入力が一致しません。登録メールアドレス、または「削除します」と入力してください。" },
      { status: 400 }
    );
  }

  // ==========================================================================
  // ★本人確認（判断の回答-年齢確認とアカウント削除-20260830.md §2）
  //
  //   上の確認の入力（メールアドレス or「削除します」）は、
  //   ★「間違えて押していないか」を確かめるものです。
  //     どちらも画面に出ているので、端末を一時的に触れる人なら通せます。
  //   ★パスワードは「本人かどうか」を確かめます。目的が違います。
  //
  //   ★猶予つきの削除にも要求します。猶予中でも severConnections が
  //     すぐ走り、先生との共有は戻りません（＝取り返しがつかない）。
  //     「今すぐ」だけ守っても意味がありません。
  //
  //   ★セッションを持たないクライアントで確かめます。
  //     cookie 付きのクライアントで signInWithPassword を呼ぶと、
  //     いまのセッションを書き換えてしまいます。
  // ==========================================================================
  // ★★5分以内に、もう一度の確かめが済んでいれば、★また聞きません。
  //   ★書き出してすぐ削除する、といったときのためです（Opus・2026-09-05）。
  //   ★★覚えているのは、★サーバです。★画面の言い分は聞きません。
  //   ★列がまだ無い本番では、42703 で来ます。★そのときは、聞きます。
  //   ★★ここで service role のクライアントを作らないこと。
  //     ★確かめる前に、★何でもできる鍵を手に持たないためです。
  //     ★本人の行を読むだけなので、★いまのセッションで足ります（RLS が通します）。
  //     ★（components/tests/delete-requires-password.test.js が、この順番を見ています）
  let alreadyConfirmed = false;
  {
    const { data: prof, error: peekErr } = await supabase
      .from("profiles").select("reauth_at").eq("id", user.id).maybeSingle();
    if (peekErr) console.error("★確かめの時刻を読めませんでした:", peekErr.message);
    else alreadyConfirmed = reauthStillValid(prof && prof.reauth_at, new Date());
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password && !alreadyConfirmed) {
    return NextResponse.json({ error: "パスワードをご入力ください。" }, { status: 400 });
  }
  const verifier = createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
  // ★確かめが済んでいれば、★ここは通します。
  if (!alreadyConfirmed) {
    const { error: pwError } = await verifier.auth.signInWithPassword({
      email: user.email, password
    });
    if (pwError) {
      // ★理由を細かく分けないこと。「このメールは存在する」を漏らさないためです。
      return NextResponse.json({ error: "パスワードが一致しません。" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const mode = body.mode === "now" ? "now" : "grace";

  // ==========================================================================
  // ★教室の確認（判断 2026-09-01・追加要件）
  //
  //   オーナーが抜けると、その教室は契約者のいない状態になります。
  //   ほかに人がいる教室では、退会を★ここで止めます。
  //
  //   ★猶予つきの削除でも止めます。猶予でも severConnections が
  //     すぐ走り、先生と生徒の紐付けは戻りません。
  //     「今すぐ」だけ止めても、意味がありません。
  //   ★閉じ込めるためではありません。順番の話です。
  //     「教室を閉じる」は、この画面から自分でできます。
  // ==========================================================================
  // ★★★お支払いが 続いて いる 方は、★退会させません（★2026-09-16・第1段）。
  //
  //   ★★この 道は Stripe を **一度も 呼びません**。
  //     ★消すのは `subscriptions` の **行**だけ で、★契約は 生きた まま です。
  //     ★★去った あとも、★お金が 引かれ 続けます。
  //   ★★さらに、★行を 消すと `/api/stripe/portal` が
  //     `stripe_customer_id` を 引けなく なります（★`no customer`）。
  //     ★★ご自分で 止める 道まで 塞がります。
  //   ★★webhook も 静かに 失敗します ── ★行の 無い `update` は 0行に 当たり、
  //     ★それでも 200 を 返します。★誰も 気づきません。
  //
  //   ★★だから、★順番を 示します。★先に お支払いを おやめいただく。
  //     ★★退会を 隠して いません。★道は そのまま です。★順番だけ です。
  //
  //   ★★教室の 409 より **先**に 見ます。★お金の ほうが 先に 止まる べき です。
  //   ★★読めなかった ときは 止めます（★安全側）。
  //     ★★「読めない」を「無い」と 同じに しません。
  const { data: sub, error: subErr } = await admin
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (subErr) {
    console.error("アカウント削除：お支払いを確認できませんでした。", subErr);
    return NextResponse.json(
      { error: "お支払いの状態を確認できませんでした。時間をおいて、もう一度お試しください。" },
      { status: 500 }
    );
  }
  if (blocksDeletion(sub)) {
    return NextResponse.json({
      paymentActive: true,
      lines: PAYMENT_BLOCK_LINES
    }, { status: 409 });
  }

  // ★★★会社の ほうを、★先に 止めます（★第2段・2026-09-16）。
  //
  //   ★★順番が すべて です ──
  //     ★1 会社の 解約を 先に 呼ぶ
  //     ★2 止まった ことを 確かめる
  //     ★3 止まった ときだけ 記録を 消す
  //     ★4 止まらなければ 退会を 中止し、そう 伝える
  //   ★★消してから 呼ぶ形は、★失敗した とき 何も 残りません。
  //
  //   ★★★写しを 見ません。★会社に 直に 聞きます（★台帳 ㊶）。
  //     ★★`subscriptions` は 写し です。★手で 書いた 見せかけの 行が ありました。
  //     ★写しから 引くのは `stripe_customer_id`（★どの お客さまか）だけ です。
  //     ★★「いくつ 生きて いるか」は、★会社の 答えだけ を 使います。
  //       ★★写しに 無い 契約も、★これで 見つかります。
  //
  //   ★★第1段（★上の `blocksDeletion`）は そのまま 残します（★坂本さんの お決め）。
  //     ★★退会と 解約を 1つの ボタンに まとめると、★押し間違いが 起きます。
  //     ★★ここは その あと の 守り です ── ★写しが 嘘を ついて いた ときの ため。
  const { data: payRow } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const cancelResult = await cancelLiveSubscriptions(
    payRow && payRow.stripe_customer_id ? payRow.stripe_customer_id : null
  );
  if (!cancelResult.ok) {
    console.error("アカウント削除：お支払いを止められませんでした。",
      cancelResult.failures.map((f) => f.id + ":" + f.message).join(" ／ "));
    return NextResponse.json({
      cancelFailed: true,
      lines: CANCEL_FAILED_LINES
    }, { status: 409 });
  }

  const orgs = await classifyOwnedOrgs(admin, user.id);
  if (orgs.error) {
    console.error("アカウント削除：教室を確認できませんでした。", orgs.error);
    return NextResponse.json(
      { error: "教室の状態を確認できませんでした。時間をおいて、もう一度お試しください。" },
      { status: 500 }
    );
  }
  // ==========================================================================
  // ★★★契約者は、★引き継いで からでないと 退会できません（★裁定 その116）。
  //
  //   ★★契約者が 居なく なると、★学校を 閉じられなく なります。
  //     ★★お金の 責めも、★契約を 終える 手も、★契約した ご本人の もの です。
  //   ★★★役割の 名では 見ません。★`organizations.contract_owner_user_id` です
  //     （★裁定 その115 Q2 ── ★できことに しない、★役職にも 出さない）。
  //   ★★自動で 誰かに 移しません。★承諾も 待ちません。★人が 指名します。
  // ==========================================================================
  {
    const { data: 契約, error: 契約err } = await admin
      .from("organizations")
      .select("id, name")
      .eq("contract_owner_user_id", user.id);
    if (契約err) {
      console.error("アカウント削除：契約者を確認できませんでした。", 契約err);
      return NextResponse.json(
        { error: "教室の状態を確認できませんでした。時間をおいて、もう一度お試しください。" },
        { status: 500 }
      );
    }
    if ((契約 || []).length > 0) {
      // ★★引き継げる 方が 居るか も、★一緒に お伝えします。
      //   ★★居なければ「先に 札を 渡して ください」と 言い方が 変わります。
      const 出 = [];
      for (const o of 契約) {
        const { data: 会員 } = await admin
          .from("memberships").select("user_id, post_id").eq("org_id", o.id);
        let 候補 = 0;
        for (const mm of (会員 || [])) {
          if (String(mm.user_id) === String(user.id) || !mm.post_id) continue;
          const { data: 役 } = await admin
            .from("org_posts").select("perms").eq("id", mm.post_id).maybeSingle();
          if (役 && 役.perms && 役.perms.master === true) 候補 += 1;
        }
        出.push({ orgId: o.id, name: o.name || "教室", candidates: 候補 });
      }
      return NextResponse.json({
        contractOwner: true,
        orgs: 出,
        notice: LEAVE_BLOCKED,
        how: LEAVE_BLOCKED_HOW,
        noneNotice: CONTRACT_NONE,
        noneHow: CONTRACT_NONE_HOW
      }, { status: 409 });
    }
  }

  if (orgs.blocked.length > 0) {
    return NextResponse.json({
      blocked: true,
      orgs: orgs.blocked.map((o) => ({ ...o, notice: departingOwnerNotice(o.otherCount) }))
    }, { status: 409 });
  }

  // ==========================================================================
  // ★止めないけれど、契約者が居なくなる教室（2026-09-02・Opus の裁定）
  //
  //   ★「教室を動かせるか」と「誰が払うか」は、別の問いです。
  //     責任者が残っていれば教室は動くので、★止めません。
  //     ですが契約者は居なくなるので、★黙っても通しません。
  //
  //   ★一度だけ知らせて、了解したら進みます。
  //     消したあとに知らせても、意味がありません。
  //   ★生徒には出ません。生徒は契約者ではないので、payer に入りません。
  // ==========================================================================
  if (orgs.payer.length > 0 && !body.acknowledgePayerNotice) {
    return NextResponse.json({
      payerNotice: true,
      orgs: orgs.payer.map((o) => ({
        ...o, notice: departingPayerNotice(o, OPERATOR_CONTACT_EMAIL)
      }))
    }, { status: 409 });
  }

  if (mode === "now") {
    const { ok, failures, blocked, countRecorded, countError } = await purgeAccount(admin, user.id);
    // ★数えられなかったことは、削除の失敗ではありません。返り値には出しますが、
    //   利用者には見せません（消えたことが大事で、数は運営の都合です）。
    //   ★ただし、黙って捨てません。ここでログに残します。
    if (ok && countRecorded === false) {
      console.error("★アカウントは削除できましたが、件数を記録できませんでした。", { countError });
    }
    if (!ok && blocked && blocked.length > 0) {
      // ★上の確認をすり抜けた場合の受け皿（同時に誰かが教室へ入った、など）
      return NextResponse.json({
        blocked: true,
        orgs: blocked.map((o) => ({ ...o, notice: departingOwnerNotice(o.otherCount) }))
      }, { status: 409 });
    }
    if (!ok) {
      console.error("アカウント削除：一部のデータを削除できませんでした。", failures);
      // ★どの表で止まったかだけ、画面にも返します（2026-09-02）。
      //
      //   ★2026-09-02、+g4t3 の退会が止まりました。原因が分かるまでに
      //     何度もやり取りが要り、最後は Vercel のログを見て決着しました。
      //     ★止まった表の名前さえ分かれば、その場で見当がつきます。
      //
      //   ★出すのは★表の名前だけです。message は出しません。
      //     中身には列名や制約の名前が入り、外に出す理由がありません
      //     （「column X does not exist」「violates not-null constraint」など）。
      //   ★利用者に見せる文は変えません。名前は console 用です。
      return NextResponse.json(
        {
          error: "一部のデータを削除できませんでした。お手数ですが、時間をおいてもう一度お試しください。",
          failedTables: failures.map((f) => f.table)
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, mode: "now" });
  }

  // ---- 猶予期間に入れる ----
  // ★共有は待たずに切る。削除を申し出た人の記録が、30日ものあいだ
  //   先生の画面に出続けるのは受け入れられない（A-4）。
  const severFailures = await severConnections(admin, user.id);
  if (severFailures.length > 0) {
    console.error("アカウント削除：共有の解除に失敗しました。", severFailures);
    return NextResponse.json(
      { error: "共有の解除に失敗したため、削除を中断しました。時間をおいてもう一度お試しください。" },
      { status: 500 }
    );
  }

  const { error: markError } = await admin
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", user.id);
  if (markError) {
    console.error("アカウント削除：削除の申請を記録できませんでした。", markError);
    return NextResponse.json(
      { error: "削除を受け付けられませんでした。supabase/migration_account_soft_delete.sql が未実行の可能性があります。" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, mode: "grace" });
}
