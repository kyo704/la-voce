# Woolsong ／ バックアップと復元の手順

出典 `docs/lavoce-優先順位つき残タスク.md` A-P0-1
★これは **G4（9/15）の前提条件**です。復元を1度も通さないまま G4 に入らないでください。

この文書は**坂本さんが一人で実行できる**ように書いています。
★印のついた手順は、**坂本さんだけが実行できる**もの（本番のパスワードを使うもの）です。

---

## 0. 何のためか

要配慮個人情報を、個人開発で預かっています。
データベースが失われれば、事業が終わるだけでなく、**利用者の記録が消えます。**

**★無料プランには、自動のバックアップがありません。**
つまり、ここで取るダンプが**唯一のバックアップ**です。

---

## 1. 一度だけの準備

### 1-1｜Postgres.app（★もう入っています）

このMacには、すでに Postgres.app が入っています。**ダウンロードは要りません。**

```
/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump  → 18.6
/Applications/Postgres.app/Contents/Versions/latest/bin/psql     → 18.6
```

入れ直すことになった場合だけ、<https://postgresapp.com/downloads.html> から取ります。
**★Intel 用と Apple Silicon 用を選ぶ必要はありません。**
配布物は universal binary（x86_64 と arm64 の両方入り）ひとつだけで、
このMac（Intel Core i5・macOS 12.6.7）では x86_64 の側が使われます。

確かめるコマンド：

```bash
/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump --version
# → pg_dump (PostgreSQL) 18.6 (Postgres.app)
```

> **なぜ Docker を使わないか**
> Docker Desktop は macOS 13 以上を求めます。このMacは 12.6.7 なので入りません。
> 以前うまくいかなかったのは、運が悪かったのではなく、OSの下限が理由でした。

### 1-2｜★接続先を書いたファイルを作る（坂本さんだけ）

リポジトリの一番上に `.env.backup.local` を作り、**1行だけ**書きます。

```
BACKUP_DATABASE_URL="postgresql://postgres:パスワード@db.xxxx.supabase.co:5432/postgres"
```

取り方：Supabase → **Project Settings → Database → Connection string → URI**。

- ★このファイルは `.gitignore` 済みです（`.env*.local`）。コミットされません。
- ★ここで要るのは**データベースのパスワード**です。service_role キーではありません。
  取り違えると、必要以上に強い鍵を手元に置くことになります。

---

## 2. バックアップを取る（★毎回これだけ）

```bash
cd ~/Desktop/la-voce
./scripts/backup-dump.sh
```

**1コマンドです。** 中でこうなります。

1. `pg_dump` があるか確かめる
2. `.env.backup.local` から接続先を読む
3. `auth` と `public` の両方を取る
4. `backups/woolsong-YYYYMMDD-HHMMSS.sql` に書く
5. **そのまま健全性を調べる**（取っただけで安心しないため）

最後にこう出れば成功です。

```
✅ 問題ありません。backup-baseline.json を更新しました。
```

**❌ が出たら、そのバックアップは使えません。** 取り直してください。

> **★`auth` を必ず一緒に取る理由**
> `pg_dump` は既定で `public` しか取りません。`auth` を落とすと、
> `entries` は戻るのに**その行の持ち主が存在しない**状態になります。
> 復元先でログインできず、「記録が消えた」ように見えます。
> スクリプトはこれを防ぐため `--schema=auth` を必ず付けています。

### 2-1｜取ったファイルの扱い（★大事）

`backups/*.sql` には、**体調と声の記録**そのものと、
**ログインのパスワードのハッシュ**が入っています。

- ★リポジトリに入れない（`.gitignore` 済み）
- ★人に送らない・クラウドの共有フォルダに置かない
- ★復元の練習が済んだら消す

---

## 3. 健全性だけを調べ直す

あとからもう一度調べたいときは、ファイルを指定します。

```bash
node scripts/backup-verify.js backups/woolsong-20260830-221000.sql
```

見ているもの（仕様書 A-P0-1 ②）：

| 見るもの | 異常とする条件 |
|---|---|
| テーブルごとの行数 | `profiles` か `entries` が **0行** |
| 〃 | 一覧にあるテーブルが**ダンプに入っていない** |
| 前回との比較 | **2割以上減っている**／あった行が**全部消えている** |
| 各テーブルの最新レコードの日時 | 表示のみ（目で見て、思っているより古くないか） |
| ダンプの形 | **COPY も INSERT も見つからない**（＝読めない） |

**★「読めなかった」を 0行 と報告しません。**
0 が「本当に0行」なのか「数えられなかった」のか区別できないと、
壊れたバックアップを正常と読んでしまいます。形が分からないときは必ず止まります。

比較の基準は `backup-baseline.json`（**行数だけ**。個人のデータは入っていないので、
コミットして構いません）。★異常が出たときは更新しません。壊れた値を基準にしないためです。

---

## 4. 復元する（★A-P0-1 の本番）

**目的は「戻せることを、実際に確かめる」ことです。** 読むだけでは終わりません。

### 4-1｜手元の Postgres に戻す

```bash
# ① Postgres.app を起動する（メニューバーのゾウのアイコン → Start）

# ② 道具にパスを通す（このターミナルの間だけ）
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"

# ③ 復元用のからのデータベースを作る（★毎回作り直す）
dropdb --if-exists woolsong_restore
createdb woolsong_restore

# ④ 戻す
#    ★エラーは出ます。Supabase 独自の役割や拡張が手元に無いためです。
#    　「role "supabase_admin" does not exist」などは無視して構いません。
#    　大事なのは、このあと⑤で行数が合うことです。
psql -d woolsong_restore -f backups/woolsong-20260830-221000.sql 2>&1 | tail -20
```

### 4-2｜戻ったことを数で確かめる

```bash
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"

# 主なテーブルの行数
psql -d woolsong_restore -c "
select 'profiles' as t, count(*) from public.profiles
union all select 'entries',    count(*) from public.entries
union all select 'auth.users', count(*) from auth.users
order by 1;"

# いちばん新しい記録の日
psql -d woolsong_restore -c "select max(date) as 最新の記録 from public.entries;"
```

**★この数字が、`./scripts/backup-dump.sh` の出力と一致していれば、復元は成功です。**
一致しなければ、ダンプか復元のどちらかが壊れています。

### 4-3｜中身を目で見る

```bash
psql -d woolsong_restore -c "
select date, throat_condition, resonance_score
  from public.entries
 order by date desc
 limit 5;"
```

自分の直近の記録が並んでいれば、**記録が読める**ことの確認になります。

---

## 5. ★「ログインして記録が読める」について（未解決）

仕様書 A-P0-1 の完了条件は、こう書かれています。

> 坂本さんが手順書を見ながら復元を実行し、**復元先でログインして記録が読める**ことを確認できた状態

**§4 までで確かめられるのは「記録が戻っていること」までです。**
**ログインは、まだ確かめられません。**

理由：ログインを処理しているのは Supabase の **Auth（GoTrue）という別のサーバ**で、
Postgres そのものではありません。手元でそれを動かすには `supabase start` が要り、
それには Docker が要り、Docker は macOS 13 以上を求めます（このMacは 12.6.7）。

`auth.users` の**中身はダンプに入っています**。足りないのは、それを使う**サーバ**です。

### 選べる道

| | やり方 | よいところ | 気をつけること |
|---|---|---|---|
| **A** | Supabase に**もう1つ無料のプロジェクト**を作り、そこへ復元して、手元の `npm run dev` をそちらへ向けてログインする | 完了条件をそのまま満たせる。費用なし | ★本物の要配慮個人情報が、もう1つのプロジェクトに置かれます。確認が済んだら**必ずプロジェクトごと削除**してください |
| **B** | §4 までで区切り、ログインの確認は macOS を 13 以上に上げてから行う | 個人データが増えない | ★完了条件を**部分的にしか満たしていない**状態で G4 に入ることになります |

**★どちらにするかは坂本さんの判断です。** 決まり次第、この節に手順を足します。

---

## 6. かたづけ

```bash
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
dropdb --if-exists woolsong_restore     # 復元先を消す
rm backups/woolsong-*.sql               # ★ダンプを消す（練習が済んだら）
```

★A を選んだ場合は、**Supabase のもう1つのプロジェクトも削除**してください。

---

## 7. どれくらいの頻度で取るか

| いつ | なぜ |
|---|---|
| **★構造を変える移行の直前** | いちばん壊れやすい瞬間です。声の構造変更の前に必ず |
| 配布の直前・直後 | 人が増えた前後の状態を残す |
| 週に1回 | 平常時 |

---

## 8. 困ったときに見るところ

| 症状 | 見るところ |
|---|---|
| `pg_dump が見つかりません` | Postgres.app が入っているか。§1-1 |
| `.env.backup.local がありません` | §1-2 |
| `password authentication failed` | 接続文字列のパスワード。★Supabase で再発行できます |
| 復元中に `role ... does not exist` | **無視して構いません**。§4-1 ④ |
| `★ダンプの形が分かりませんでした` | ダンプが途中で切れています。取り直してください |
| `★あった行が全部消えている` | ★止めてください。取り直して、それでも同じなら本番を確認 |

---

## 9. 自動化されているもの／坂本さんが手を動かすもの

| | 誰が | 何を |
|---|---|---|
| バックアップの取得 | **自動** | `./scripts/backup-dump.sh` の1コマンド |
| 健全性の検査 | **自動** | 取得のあと、続けて走ります |
| 減りすぎの判定 | **自動** | 前回との比較。異常なら止まります |
| ★接続先の用意 | **坂本さん** | `.env.backup.local`（1回だけ・§1-2） |
| ★復元の実行 | **坂本さん** | §4 のコマンドを順に |
| ★中身の確認 | **坂本さん** | §4-2・§4-3 |
| ★ログインの確認 | **坂本さん** | §5。★道を選ぶところから |

**★アシスタント（Claude）は、本番の認証情報を扱いません。**
ダンプの取得と復元は、**坂本さんの手元でだけ**実行されます。
