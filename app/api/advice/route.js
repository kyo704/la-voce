import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdvice } from "@/lib/anthropic";
import { getUserWithTimeout } from "@/lib/withTimeout";

const SYSTEM_PROMPT = `あなたは声楽家の体調管理をサポートするアシスタントです。
ユーザーが記録した直近の体調データ（喉のコンディション、声の調子、睡眠、水分、気候、活動内容、
公演の出来、心の余裕）と、ユーザーが書いた自由記述のメモ（食事内容・その日のメモ）を読み、
実践的で具体的なアドバイスを日本語で提供してください。

必ず守ること:
- 医学的な診断や病名の判断は行わない
- 薬の服用や具体的な投薬量については助言しない
- 気になる症状が続いている場合は、医療専門家への相談を勧める
- データの中に具体的な傾向やパターンがあれば、それに触れる（例:睡眠が少ない日の翌日は喉の調子が悪い傾向がある、など）
- 前向きで、押し付けがましくなく、温かみのあるトーンで書く
- 日本語で300〜400字程度に簡潔にまとめる。箇条書きは使わず、自然な文章で書く`;

function buildSummary(rows) {
  return rows
    .map((r) => {
      const parts = [r.date];
      parts.push(`喉:${r.throat_condition ?? "-"}/5`);
      parts.push(`声:${r.voice_quality ?? "-"}/5`);
      parts.push(`睡眠:${r.sleep_hours ?? "-"}h(質${r.sleep_quality ?? "-"}/5)`);
      parts.push(`水分:${r.water_intake ?? "-"}ml`);
      if (r.temperature != null) parts.push(`気温${r.temperature}°C`);
      if (r.humidity != null) parts.push(`湿度${r.humidity}%`);
      parts.push(`活動:${r.activity_type ?? "-"}`);
      if (r.performance_quality != null) parts.push(`公演の出来:${r.performance_quality}/5`);
      parts.push(`心の余裕:${r.ease ?? "-"}/5`);
      if (r.throat_symptoms && r.throat_symptoms.length) parts.push(`症状:${r.throat_symptoms.join("、")}`);
      if (r.meal_notes) parts.push(`食事メモ:${r.meal_notes}`);
      if (r.notes) parts.push(`メモ:${r.notes}`);
      return parts.join(" / ");
    })
    .join("\n");
}

export async function POST() {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "アドバイスの認証確認");
  // ★「確認できなかった」と「ログインしていない」を分ける。
  //   つながらないときに 401 を返すと、利用者は「ログインし直してください」と
  //   案内され、ログインもできず途方に暮れます。503 を返して、時間を置けば
  //   直ることを伝えます。
  if (unreachable) return Response.json({ error: "いま、つながりません。" }, { status: 503 });
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 14);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: rows, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", sinceStr)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "記録の取得に失敗しました。" }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({
      advice: "まだ記録がありません。まずは数日分「今日の記録」をつけてみましょう。記録がたまるほど、アドバイスの精度が上がります。"
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "サーバーにANTHROPIC_API_KEYが設定されていません。" },
      { status: 500 }
    );
  }

  try {
    const summary = buildSummary(rows);
    const advice = await getAdvice(
      SYSTEM_PROMPT,
      `直近の記録です:\n\n${summary}\n\nこの記録をもとに、アドバイスをください。`
    );
    return NextResponse.json({ advice: advice || "アドバイスを生成できませんでした。" });
  } catch (e) {
    return NextResponse.json({ error: "AIアドバイスの生成に失敗しました。時間をおいて再度お試しください。" }, { status: 502 });
  }
}
