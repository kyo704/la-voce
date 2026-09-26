/* ★試しの 口座で 入り、★画面と 同じ 決まりの 下で 台帳を 引きます。 */
const fs=require("fs");
const env={};
for (const f of ["/Users/sakamotokyou/Desktop/la-voce/.env.e2e",
                 "/Users/sakamotokyou/Desktop/la-voce/.env.local"]) {
  try { fs.readFileSync(f,"utf8").split("\n").forEach((l)=>{
    const m=/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l); if(m && !env[m[1]]) env[m[1]]=m[2].trim().replace(/^["']|["']$/g,"");
  }); } catch(e) {}
}
(async()=>{
  const { createClient } = require("@supabase/supabase-js");
  const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { error: e0 } = await c.auth.signInWithPassword({
    email: env.E2E_LOCAL_EMAIL, password: env.E2E_LOCAL_PASSWORD });
  if (e0) { console.log("★入れません ……", e0.message); process.exit(1); }
  const u = (await c.auth.getUser()).data.user;
  console.log("★入りました ……", u.id);
  for (const [名, q] of [
    ["koen_members", c.from("koen_members").select("koen_id, user_id, left_at").eq("user_id", u.id)],
    ["koen",         c.from("koen").select("id, title, owner_user_id")],
    ["koen_kids",    c.from("koen_kids").select("id, koen_id, nickname, guardian_user_id")],
    ["koen_kid_contact_reads", c.from("koen_kid_contact_reads").select("id, kid_id, viewer_role_at, viewed_at")],
    ["koen_kid_contacts", c.from("koen_kid_contacts").select("kid_id")]
  ]) {
    const { data, error } = await q;
    console.log("  %s …… %s", 名.padEnd(24),
      error ? "★誤り " + error.code + " " + error.message.slice(0,90)
            : (data || []).length + "件 " + JSON.stringify(data).slice(0,120));
  }
})();
