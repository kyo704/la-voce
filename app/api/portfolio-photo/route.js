// ============================================================================
// ★写真を 上げる ── ★2段目（★確かめて 断る）（★裁定199・2026-09-25）
//
//   ★★★ここで 落とし直しません。★**入って いないかを 確かめて 断ります**。
//     ★坂本さんの お決め（2026-09-25）── ★`sharp` 等を 入れない。
//     ★★わけ ── ★落とし直すと「★落とせた つもり」に なれます。
//       ★確かめて 断る なら、★通った ものは「★無い」と 言い切れます。
//
//   ★★★順番を 守ります ── ★① 確かめる ② 置く ③ 印を 立てる。
//     ★★★印 → 置く に すると、★置くのに 失敗した とき **印だけ 残ります**。
//       ★印の 立った 行は 他人に 出ます。★中身の 無い 写真が 出ます。
//
//   ★★断った ものは どこにも 残しません ── ★Storage にも 台帳にも。
//
//   ★★字は `lib/photoExif.js` が 持ちます。★ここでは 決めません。
// ============================================================================
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import {
  findMetadata, ACCEPT_TYPES, BUCKET, MARK_FN, MAX_PHOTOS, OUT_TYPE, REJECT_LINE
} from "@/lib/photoExif";

export async function POST(request) {
  // ★★誰が 出したかを、★みなの 鍵で 確かめます。
  //   ★★管理の 鍵で 見ては いけません ── ★それでは 誰でも 通ります。
  //   ★★時間制限を 付けます（★見張り `auth-timeout-coverage`）。
  //     ★★つながらない とき、★裸の `getUser()` は 返って きません。
  //       ★上げる 手が 止まった まま に なります。
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "写真を 上げる ときの 確かめ");
  if (unreachable) {
    return Response.json({ ok: false, line: "いまは つながりません。" }, { status: 503 });
  }
  if (!user) {
    return Response.json({ ok: false, line: "もう一度 お入りください。" }, { status: 401 });
  }

  let form;
  try { form = await request.formData(); }
  catch (e) { return Response.json({ ok: false, line: "受け取れませんでした。" }, { status: 400 }); }

  const file = form.get("file");
  const w = Number(form.get("w"));
  const h = Number(form.get("h"));
  if (!file || typeof file.arrayBuffer !== "function") {
    return Response.json({ ok: false, line: "写真が ありません。" }, { status: 400 });
  }
  if (!ACCEPT_TYPES.includes(file.type)) {
    return Response.json({ ok: false, line: "この 形の 写真は 受け取れません。" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // ★★★① 確かめる。★入って いたら ここで 終わりです。
  //   ★どこに 在ったかは 画面に 出しません ── ★`REJECT_LINE` だけ です。
  const found = findMetadata(bytes);
  if (found) {
    return Response.json({ ok: false, line: REJECT_LINE }, { status: 422 });
  }

  // ★★20枚を 超えて いないか。★台帳の `assert_photo_limit` も 止めますが、
  //   ★★置いて から 断ると、★置いた ものが 残ります。★先に 見ます。
  const { count } = await supabase
    .from("portfolio_photos").select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (typeof count === "number" && count >= MAX_PHOTOS) {
    return Response.json(
      { ok: false, line: String(MAX_PHOTOS) + "枚までです。" }, { status: 409 });
  }

  const admin = createAdminClient();
  const ext = OUT_TYPE === "image/webp" ? "webp" : "jpg";
  const path = user.id + "/" + crypto.randomUUID() + "." + ext;

  // ★★★② 置く。★入れものは 署名つきの 道で しか 出しません（★坂本さんの お決め）。
  const up = await admin.storage.from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (up.error) {
    return Response.json({ ok: false, line: "置けませんでした。" }, { status: 500 });
  }

  // ★★行を 作ります。★`exif_cleared_at` は まだ 立てません。
  const ins = await supabase.from("portfolio_photos")
    .insert({ user_id: user.id, path, w: w || null, h: h || null })
    .select("id").single();
  if (ins.error || !ins.data) {
    // ★★置いた ものを 片づけます。★行の 無い ファイルを 残しません。
    await admin.storage.from(BUCKET).remove([path]);
    return Response.json({ ok: false, line: "しまえませんでした。" }, { status: 500 });
  }

  // ★★★③ 印を 立てる。★ここまで 来て はじめて 他人に 出ます。
  const mk = await supabase.rpc(MARK_FN, { p_photo: ins.data.id });
  if (mk.error) {
    // ★★印が 立たない なら、★行も ファイルも 片づけます。
    //   ★★★印の 無い 行を 残しても 他人には 出ませんが、
    //     ★ご本人には 出ます。★出ない はず の ものを 見せません。
    await supabase.from("portfolio_photos").delete().eq("id", ins.data.id);
    await admin.storage.from(BUCKET).remove([path]);
    return Response.json({ ok: false, line: "しまえませんでした。" }, { status: 500 });
  }

  return Response.json({ ok: true, id: ins.data.id, path });
}
