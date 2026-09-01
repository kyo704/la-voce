# バックアップと復元 ── 坂本さん向け手順（2026-09-01）

A-P0-1 ／ `lavoce-公開前チェック-坂本さんレーン.md` §B-8
★これは **G4 の前提条件**です。復元を一度も通さないまま G4 に入らないでください。

★印は、**坂本さんご自身の手で行う手順**です。
★認証情報（パスワード）を、チャットに貼らないでください。

---

## この手順で分かること

```
① 本番のデータを、手元に丸ごと取り出せる
② 取り出したものが、壊れていない
③ 別の場所に、そのまま戻せる
④ 戻した先で、記録が読める
```

★無料プランには自動バックアップがありません。**ここで取るダンプが唯一の控えです。**

---

# 手順 1｜Postgres.app（★もう入っています。ダウンロード不要）

ターミナルを開いて、次の1行を貼って Enter：

```bash
/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump --version
```

**期待する結果**

```
pg_dump (PostgreSQL) 18.6 (Postgres.app)
```

これが出れば準備完了です。

**★Postgres.app を起動しておいてください。**
　メニューバーのゾウのアイコン → Start（動いていれば緑のチェック）

> 入れ直す場合だけ https://postgresapp.com/downloads.html
> ★Intel 用と Apple Silicon 用を選ぶ必要はありません。
> 　配布物は universal binary ひとつで、このMac（Intel Core i5・
> 　macOS 12.6.7）では x86_64 の側が自動で使われます。
>
> ★なぜ Docker を使わないか
> 　Docker Desktop は macOS 13 以上を求めます。このMacは 12.6.7 です。
> 　以前入らなかったのは運ではなく、OSの下限が理由でした。

---

# 手順 2｜★接続先のファイルを作る（1回きり）

**★認証情報を扱うのは、この手順だけです。**

**2-1.** Supabase を開く
　→ 左下 **Project Settings**
　→ **Database**
　→ **Connection string**
　→ ★**「Session pooler」タブ**（URI／Direct connection ではありません）
　→ 表示された文字列をコピー

★**Direct connection（`db.xxxx.supabase.co:5432`）は使えません。**
　2026-09-01 に確認しました。無料プランでは IPv6 のみになっており、
　手元の Mac からは `Connection refused` になります。
　（それまでは通っていました。ある時点で切り替わったようです）

★Session pooler は、**ユーザー名の形が違います**。プロジェクトIDが付きます。

```
postgresql://postgres.xxjtplvpcneksrofkjmf:パスワード@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
             ★postgres. のあとにプロジェクトID        ★pooler のホスト
```

★**Transaction pooler（ポート6543）は使わないでください。**
　`pg_dump` が通りません（prepared statement が使えないため）。
　★必ず **Session pooler（ポート5432）** です。

**2-2.** `~/Desktop/la-voce/` の中に `.env.backup.local` という名前のファイルを作る

いちばん確実なのは、ターミナルでこの2行です（パスワードが画面に出ません）:

```bash
cd ~/Desktop/la-voce
read -s "URI?接続文字列を貼り付けて Enter: "; echo; printf 'BACKUP_DATABASE_URL="%s"\n' "$URI" > .env.backup.local; unset URI; echo "作成しました"
```

2行目で入力待ちになります。**貼り付けて Enter**。何も表示されませんが、それが正常です。

> bash をお使いの場合は2行目だけこちらに：
> ```bash
> read -s -p "接続文字列を貼り付けて Enter: " URI; echo; printf 'BACKUP_DATABASE_URL="%s"\n' "$URI" > .env.backup.local; unset URI; echo "作成しました"
> ```

**2-3.** 伏せた形で確かめる

```bash
sed -E 's|(postgres[^:]*:)[^@]*(@)|\1●●●●\2|' .env.backup.local
```

期待する形：

```
BACKUP_DATABASE_URL="postgresql:●●●●@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

★ホストが `db.…supabase.co` になっていたら、Direct connection を選んでいます。2-1 からやり直してください。

- ★このファイルは `.gitignore` 済み（`.env*.local`）。GitHub には上がりません
- ★要るのは**データベースのパスワード**です。**service_role キーではありません。**

---

# 手順 3｜バックアップを取る（★1コマンド）

```bash
cd ~/Desktop/la-voce
./scripts/backup-dump.sh
```

**中で自動的にこうなります**

```
① pg_dump があるか確かめる
② .env.backup.local から接続先を読む
③ auth と public の両方を取る
④ backups/woolsong-YYYYMMDD-HHMMSS.sql に書く
⑤ そのまま健全性を調べる（取っただけで安心しないため）
```

**成功なら、最後にこう出ます**

```
✅ 問題ありません。backup-baseline.json を更新しました。
```

**❌ が出たら、そのバックアップは使えません。取り直してください。**

> ★`auth` を必ず一緒に取る理由
> 　pg_dump は既定で public しか取りません。auth を落とすと、
> 　entries は戻るのに**その行の持ち主が存在しない**状態になります。
> 　復元先でログインできず、「記録が消えた」ように見えます。

### ★取ったファイルの扱い（大事）

`backups/*.sql` には、**体調と声の記録そのもの**と、
**ログインのパスワードのハッシュ**が入っています。

```
★リポジトリに入れない（.gitignore 済み）
★人に送らない・クラウドの共有フォルダに置かない
★復元の練習が済んだら消す
```

---

# 手順 4｜健全性の検査（手順3で自動実行済み。単独でも可）

```bash
cd ~/Desktop/la-voce
node scripts/backup-verify.js backups/woolsong-20260901-XXXXXX.sql
```

★`XXXXXX` は実際のファイル名に置き換えてください。
　`ls backups/` で一覧が見られます。

**見ているもの**

| 見るもの | 異常とする条件 |
|---|---|
| テーブルごとの行数 | `profiles` か `entries` が **0行** |
| 〃 | 一覧にあるテーブルが**ダンプに入っていない** |
| 前回との比較 | **2割以上減っている**／あった行が**全部消えている** |
| 各テーブルの最新レコードの日時 | 表示のみ（思っているより古くないか、目で見る） |
| ダンプの形 | **COPY も INSERT も見つからない**（＝読めない） |

**★「読めなかった」を 0行 と報告しません。**
0 が「本当に0行」なのか「数えられなかった」のか区別できないと、
壊れたバックアップを正常と読んでしまいます。形が分からないときは必ず止まります。

比較の基準は `backup-baseline.json`（**行数だけ**。個人のデータは入っていません）。
★異常が出たときは更新しません。壊れた値を基準にしないためです。

---

# 手順 5｜★手元に復元する

```bash
# ① Postgres.app が起動していることを確認（メニューバーのゾウ）

# ② 道具にパスを通す（このターミナルを閉じるまで有効）
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"

# ③ 復元用のからのデータベースを作る（★毎回作り直す）
dropdb --if-exists woolsong_restore
createdb woolsong_restore

# ④ 戻す（★ファイル名は実際のものに置き換える）
psql -d woolsong_restore -f backups/woolsong-20260901-XXXXXX.sql 2>&1 | tail -20
```

**★④でエラーが出ます。それで正常です。**

```
role "supabase_admin" does not exist
extension "pg_graphql" is not available
    …のような行が並びます
```

Supabase 独自の役割や拡張が手元に無いためで、**無視して構いません。**
大事なのは、次の手順6で行数が合うことです。

---

# 手順 6｜★戻ったことを、数で確かめる

```bash
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"

psql -d woolsong_restore -c "
select 'profiles' as t, count(*) from public.profiles
union all select 'entries',    count(*) from public.entries
union all select 'auth.users', count(*) from auth.users
order by 1;"
```

```bash
psql -d woolsong_restore -c "select max(date) as 最新の記録 from public.entries;"
```

**★この数字が、手順3の出力と一致していれば、復元は成功です。**
一致しなければ、ダンプか復元のどちらかが壊れています。

---

# 手順 7｜★中身を目で見る

```bash
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"

psql -d woolsong_restore -c "
select date, throat_condition, resonance_score, morning_edema
  from public.entries
 order by date desc
 limit 5;"
```

ご自身の直近の記録が並べば、**記録が読める**ことの確認になります。

**★ここまでで、手順1〜7は完了です。**

---

# 手順 8｜「ログインして記録が読める」について（★未解決）

仕様の完了条件は、こう書かれています。

> 坂本さんが手順書を見ながら復元を実行し、
> **復元先でログインして記録が読める**ことを確認できた状態

**手順7までで確かめられるのは「記録が戻っていること」までです。**
**ログインは、まだ確かめられません。**

理由：ログインを処理しているのは Supabase の **Auth（GoTrue）という別のサーバ**で、
Postgres そのものではありません。手元で動かすには `supabase start` が要り、
それには Docker が要り、Docker は macOS 13 以上を求めます（このMacは 12.6.7）。

**`auth.users` の中身はダンプに入っています。足りないのは、それを使うサーバです。**

### 選べる道（★坂本さんの判断）

| | やり方 | よいところ | 気をつけること |
|---|---|---|---|
| **A** | Supabase に**もう1つ無料のプロジェクト**を作り、そこへ復元して、手元の `npm run dev` をそちらへ向けてログインする | 完了条件をそのまま満たせる。費用なし | ★本物の要配慮個人情報が、もう1つのプロジェクトに置かれます。確認が済んだら**必ずプロジェクトごと削除** |
| **B** | 手順7で区切り、ログインの確認は macOS を 13 以上に上げてから | 個人データが増えない | ★完了条件を**部分的にしか満たしていない**状態で G4 に入る |

**今夜は手順1〜7を通してください。**
それだけでも「ダンプが取れて、別の場所に完全に戻せる」ことは確認できます。
A / B の判断は、その結果を見てからで構いません。

---

# 手順 9｜かたづけ

```bash
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"

dropdb --if-exists woolsong_restore     # 復元先を消す
rm backups/woolsong-*.sql               # ★ダンプを消す（練習が済んだら）
```

★A を選んだ場合は、**Supabase のもう1つのプロジェクトも削除**してください。

---

# 困ったときに見るところ

| 症状 | 見るところ |
|---|---|
| `pg_dump が見つかりません` | 手順1。Postgres.app が入っているか |
| `.env.backup.local がありません` | 手順2 |
| `password authentication failed` | 接続文字列のパスワード。★Supabase で再発行できます |
| `Connection refused` | ★Direct connection を使っています。**Session pooler** に変えてください（手順2-1） |
| `prepared statement ... already exists` | ★Transaction pooler（6543）を使っています。**Session pooler（5432）** に変えてください |
| `could not translate host name` | 接続文字列のホスト名。2-1 からやり直し |
| 復元中に `role ... does not exist` | **無視して構いません**（手順5④） |
| `★ダンプの形が分かりませんでした` | ダンプが途中で切れています。取り直してください |
| `★あった行が全部消えている` | ★止めてください。取り直して、同じなら本番を確認 |
| `permission denied: ./scripts/backup-dump.sh` | `chmod +x scripts/backup-dump.sh` を1回実行 |

**詰まったら、ターミナルの出力をそのまま貼ってください。**
★ただし `postgresql://` を含む行だけは伏せてお送りください。

---

# どれくらいの頻度で取るか

| いつ | なぜ |
|---|---|
| **★構造を変える移行の直前** | いちばん壊れやすい瞬間です。声の構造変更の前に必ず |
| 配布の直前・直後 | 人が増えた前後の状態を残す |
| 週に1回 | 平常時 |

---

# 誰が何をするか

| | 誰が | 何を |
|---|---|---|
| バックアップの取得 | **自動** | `./scripts/backup-dump.sh` の1コマンド |
| 健全性の検査 | **自動** | 取得のあと、続けて走ります |
| 減りすぎの判定 | **自動** | 前回との比較。異常なら止まります |
| ★接続先の用意 | **坂本さん** | `.env.backup.local`（1回だけ・手順2） |
| ★復元の実行 | **坂本さん** | 手順5 |
| ★中身の確認 | **坂本さん** | 手順6・7 |
| ★ログインの確認 | **坂本さん** | 手順8。★道を選ぶところから |

**★アシスタント（Claude）は、本番の認証情報を扱いません。**
ダンプの取得と復元は、**坂本さんの手元でだけ**実行されます。
