#!/usr/bin/env bash
# ============================================================================
# 本番データベースのバックアップを取る（A-P0-1 ①）
#
#   使い方
#     ./scripts/backup-dump.sh
#
#   ★1コマンドで終わります。引数はありません。
#   ★接続先は .env.backup.local から読みます（このファイルには書きません）。
#
#   出力  backups/woolsong-YYYYMMDD-HHMMSS.sql
#
#   ★このファイルは、要配慮個人情報と、ログインのパスワードの
#     ハッシュを含みます。リポジトリに入れないこと（.gitignore 済み）。
#     人に送らないこと。使い終わったら消すこと。
# ============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

PGBIN="/Applications/Postgres.app/Contents/Versions/latest/bin"
ENV_FILE=".env.backup.local"
OUT_DIR="backups"

# ---------------------------------------------------------------------------
# ① 道具があるか
# ---------------------------------------------------------------------------
if [ ! -x "$PGBIN/pg_dump" ]; then
  echo "✗ pg_dump が見つかりません: $PGBIN/pg_dump" >&2
  echo "  Postgres.app を入れてください（https://postgresapp.com/）。" >&2
  echo "  入れたあと、もう一度このコマンドを実行してください。" >&2
  exit 1
fi
echo "・pg_dump: $("$PGBIN/pg_dump" --version)"

# ---------------------------------------------------------------------------
# ② 接続先。★ここに書かず、.env.backup.local から読みます
# ---------------------------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  cat >&2 <<'MSG'
✗ .env.backup.local がありません。

  次の1行だけのファイルを、このリポジトリの一番上に作ってください。
  （Supabase の Project Settings → Database → Connection string → URI）

    BACKUP_DATABASE_URL="postgresql://postgres:パスワード@db.xxxx.supabase.co:5432/postgres"

  ★このファイルは .gitignore 済みです（.env*.local）。
  ★パスワードは、坂本さんだけが扱ってください。
MSG
  exit 1
fi

# shellcheck disable=SC1090
set -a; . "./$ENV_FILE"; set +a

if [ -z "${BACKUP_DATABASE_URL:-}" ]; then
  echo "✗ .env.backup.local に BACKUP_DATABASE_URL がありません。" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# ③ 取る
#
#   ★--schema=auth を外さないこと。
#     public だけ取ると、記録は戻るのに持ち主が居ない状態になり、
#     復元先でログインできません（lib/backupTables.js に理由を書いています）。
#
#   ★--no-owner / --no-privileges
#     Supabase の役割（supabase_admin など）は手元にありません。
#     付けたまま復元しようとすると、そこで止まります。
#
#   ★--column-inserts は使いません。COPY のほうが速く、
#     scripts/backup-verify.js が数えやすいためです。
# ---------------------------------------------------------------------------
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$OUT_DIR/woolsong-$STAMP.sql"

echo "・取得中… （数分かかることがあります）"
"$PGBIN/pg_dump" \
  --schema=auth \
  --schema=public \
  --no-owner \
  --no-privileges \
  --quote-all-identifiers \
  --file="$OUT" \
  "$BACKUP_DATABASE_URL"

BYTES=$(wc -c < "$OUT" | tr -d ' ')
echo "・書き出しました: $OUT （$BYTES バイト）"

# ---------------------------------------------------------------------------
# ④ そのまま健全性を調べる（★取っただけで安心しないため）
# ---------------------------------------------------------------------------
echo
node scripts/backup-verify.js "$OUT"
