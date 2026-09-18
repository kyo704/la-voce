# ★Code を 台帳（Supabase）に 直に つなぐ ── ★やって みた 記録

全110行 / 末尾は「★★★けれど、★**書く ほう は つなぎません。**★そこは 変えません。」

## 一 ★もう 1本 つながって いました（★お知らせ）

```
$ claude mcp list
claude.ai Claude Docs : ✔ つながって います
claude.ai Supabase    : ✔ つながって います   ← ★★これ
```

★★`claude.ai Supabase` は **すでに** つながって います。★坂本さんの claude.ai の 側の 設定 です。
　★★ただし ── ★**この 仕事場（Claude Code の いまの 話）には 道具が 降りて きて いません。**
　　★★道具を 探しても、★Supabase の 道具は 1つも 出ません。
　　★★つまり「つながって いる」のは claude.ai の 画面の 話 で、
　　　★★私が いま この 場から 呼べる わけでは ありません。

★★`STATUS: REQUEST` の 前置き「Codeには接続手段がありません」は、★半分 当たりです。
　★★正しくは ──「★口は ある。★けれど この 場に 降りて いない」。

## 二 ★言われた とおり 足しました ── ★止まりました

```
$ claude mcp add supabase -- npx -y @supabase/mcp-server-supabase@latest \
    --read-only --project-ref=xxjtplvpcneksrofkjmf
Added stdio MCP server supabase … to local config
（/Users/sakamotokyou/.claude.json の この 仕事場の ところ）

$ claude mcp list
supabase : ✘ つながりません — CONNECTION_CLOSED
```

★★中身を 直に 動かして、★言い分を 取りました ──

```
Please provide a personal access token (PAT) with the --access-token flag
or set the SUPABASE_ACCESS_TOKEN environment variable
```

★★**合言葉（PAT）が ありません。★それだけ です。**★ほかに 障りは ありません。

★★★`--read-only` を 付けました（★言われた 形には ありません）。
　★★私の 判断 です。★書けない 形から 始めます。

## 三 ★★坂本さんに していただく こと ── ★1つ だけ

```
1  https://supabase.com/dashboard/account/tokens
2  「Generate new token」── 名は  claude-code-readonly  など
3  出た 字を、★**私に 見せず**に、★下の どちらかで 置いて ください
```

★★置き方 ㋐ ── ★端末の 環境に 置く（★お勧め）

```
（ターミナルで）
echo 'export SUPABASE_ACCESS_TOKEN="ここに 貼る"' >> ~/.zshrc
source ~/.zshrc
claude mcp list
```

★★置き方 ㋑ ── ★この 仕事場の 設定に 置く

```
claude mcp remove supabase
claude mcp add supabase -e SUPABASE_ACCESS_TOKEN=ここに貼る -- \
  npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=xxjtplvpcneksrofkjmf
```

★★★㋐ を お勧めします。★㋑ は 合言葉が `~/.claude.json` に **字のまま** 残ります。

## 四 ★★私から 申し上げたい こと ── ★1つ、★重い ほうの 話

★★`--read-only` は **私の 側の 縛り** です。★合言葉 そのものは 縛られて いません。
　★★Supabase の PAT は **口座ぜんぶ** に 効きます。★表を 落とすことも できる 強さ です。
　★★漏れた ときに 効く 縛りでは ありません。

★★そして ── ★読むだけ でも、★**38人の 記録が 読めます**。
　★★のどの 具合、★体の 記録、★書かれた ノート。
　★★`--read-only` は それを 止めません。

★★★だから、★つながった あとも、★私は こう します（★自分で 決めます）:

```
★私が 尋ねるのは  … pg_class / pg_policy / pg_constraint / pg_indexes
                    information_schema ── ★★「台帳の 形」だけ
★私が 尋ねないのは … entries / notes / profiles の **中身**
                    ★★人の 記録は 読みません。★数が 要る ときは count だけ。
★書く ときは     … いままで どおり、★SQL を 紙に して お渡しします。
                    ★★自分で は 走らせません。
```

★★きょう 一日 積んだ 決まりは、★口が 増えても そのまま です ──
　★★危ない ことの 前に お尋ねする。★書く 前に 届く 範囲を 数える。
　★★`BEGIN/ROLLBACK` の 中で 書く 紙を お渡ししない（★9月15日の 一件）。

## 五 ★つながった ら、★何が 楽に なるか

★★きょう だけで、★台帳に お尋ねする 紙を **4枚** お渡しして います。
　★★そのたび、★坂本さんが 貼って、★結果を 戻して ── ★往復が 要りました。

```
★いま 詰まって いる もの
  ・+forcode に 役職が 付いて いるか（★運営に 入れず、★実装の 絵が 撮れません）
  ・「紙と 台帳を 重ねる」工程（★私の 決まり）が、★毎回 人手 頼み
```

★★つながれば、★この 2つが その場で 済みます。
★★★けれど、★**書く ほう は つなぎません。**★そこは 変えません。
