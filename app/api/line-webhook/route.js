// このファイルは app/api/line-webhook/route.js として配置してください。
//
// LINE Messaging APIのWebhook受信エンドポイント。
// 【役割】ユーザーが「今日の記録」アプリの設定画面で連携コードを発行し、それをLINEの
// 公式アカウントにメッセージとして送ると、そのLINEユーザーIDをprofilesに紐付ける。
//
// 【環境変数（Vercelに設定が必要）】
//   LINE_CHANNEL_ACCESS_TOKEN … LINE Developers > Messaging API設定 で発行した長期アクセストークン
//   LINE_CHANNEL_SECRET       … LINE Developers > チャネル基本設定 のチャネルシークレット
//
// 【Webhook URLの設定】
//   LINE Developers > Messaging API設定 > Webhook URL に、
//   https://la-voce.vercel.app/api/line-webhook を設定し、「Webhookの利用」をオンにしてください。

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function verifySignature(body, signature) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return false;
  const hash = crypto.createHmac("SHA256", secret).update(body).digest("base64");
  return hash === signature;
}

async function replyMessage(replyToken, text) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }]
    })
  });
}

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature");

  if (!verifySignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const admin = createAdminClient();

  for (const event of body.events || []) {
    const lineUserId = event.source && event.source.userId;
    if (!lineUserId) continue;

    if (event.type === "follow") {
      // 友だち追加された時点での案内。
      await replyMessage(
        event.replyToken,
        "La Voceを友だち追加いただきありがとうございます。\nアプリの「もっと」タブで発行した連携コード（6文字）を、このトーク画面にそのまま送ってください。"
      );
      continue;
    }

    if (event.type === "message" && event.message && event.message.type === "text") {
      // ★大文字に揃えてから照合する。以前は /^[A-Z0-9]{6}$/ で大文字しか
      //   受け付けず、小文字で送った人（スマホのキーボードでは珍しくない）は
      //   「コードを送ってください」と返されて、永久に連携できなかった。
      const text = event.message.text.trim().toUpperCase();
      if (/^[A-Z0-9]{6}$/.test(text)) {
        const { data: matched, error } = await admin
          .from("profiles")
          .select("id")
          .eq("line_link_code", text)
          .maybeSingle();

        if (error || !matched) {
          await replyMessage(event.replyToken, "その連携コードは見つかりませんでした。アプリの「もっと」タブで発行し直してから、もう一度送ってください。");
          continue;
        }

        await admin
          .from("profiles")
          .update({ line_user_id: lineUserId, line_link_code: null, line_linked_at: new Date().toISOString() })
          .eq("id", matched.id);

        await replyMessage(event.replyToken, "連携が完了しました。毎朝、記録のリマインドをお送りします。通知の設定は、いつでもアプリの「もっと」タブから変更できます。");
      } else {
        await replyMessage(event.replyToken, "アプリの「もっと」タブで発行した連携コード（6文字の英数字）を送ってください。");
      }
    }
  }

  return new Response("OK", { status: 200 });
}
