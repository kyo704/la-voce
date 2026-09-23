# ★管理の 口（読むだけ）。★書き出しの 道具が 共通で 使います。
import json, os, subprocess, urllib.request, urllib.error

HON = "xxjtplvpcneksrofkjmf"     # ★本番
FURUI = "smntpurraumeerselvsc"   # ★古い 試し（止まって います）

def token():
  p = os.path.expanduser("~/.bash_profile")
  return subprocess.run(["bash","-lc",'source "%s" >/dev/null 2>&1; printf %%s "$SUPABASE_ACCESS_TOKEN"' % p],
                        capture_output=True, text=True).stdout.strip()

_T = None
def q(ref, sql):
  global _T
  if _T is None: _T = token()
  r = urllib.request.Request(
    "https://api.supabase.com/v1/projects/%s/database/query" % ref,
    data=json.dumps({"query": sql}).encode(),
    headers={"Authorization": "Bearer " + _T, "Content-Type": "application/json"})
  try:
    return json.loads(urllib.request.urlopen(r, timeout=180).read().decode())
  except urllib.error.HTTPError as e:
    raise RuntimeError(e.read().decode())
