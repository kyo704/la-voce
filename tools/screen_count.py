#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★画面の 数を 数える（★裁定214・2026-09-27）

★なぜ 要るか:
  ★198／168／169／170／195 ── ★5つの 数が 出回りました
  ★★原因は ★数え方が 決まっていなかった ことと、
    ★★見本/ に ★旧名の 古い写しが 3本 混ざっていた こと です
  ★★人が 数えると また ずれます。★★道具で 数えます

★数え方（★裁定214）:
  ★画面 ＝ SC（遷移して 出る 面）★＋ SC に 無い タブ
  ★シート（下から 出る もの）は ★別に 数える。★合計に 混ぜない
  ★重なりは 除く（★同じ名前は 1つ）
  ★数える 見本は ★下の LIVE の 4本だけ。★ほかは 数えない

使い方:
  python3 tools/screen_count.py            → 数えて 出す
  python3 tools/screen_count.py --write    → 文書/画面の数_<日付>.md を 書く
  python3 tools/screen_count.py --check    → ★確定値と 違ったら 1 を 返す（CI 用）
  python3 tools/screen_count.py --selftest
"""
import os,sys,json,asyncio,urllib.parse,datetime
HERE=os.path.dirname(os.path.abspath(__file__)); PACK=os.path.dirname(HERE)
# ★★★置き場の 直し（★この 蔵の 側・2026-09-27）──
#   ★元の 1行は `MOCKS=os.path.join(PACK,'見本')` でした。
#   ★★あの 形は **pack の 中**（`pack/tools/` と `pack/見本/`）を 前提に して います。
#     ★この 蔵では 道具が `tools/`、★見本が `docs/design/pack-final/` の 直下 です。
#   ★★★中身は 1文字も 変えて いません。★さがす ところ を 増やした だけ です。
#     ★★見つからない ときは 元の 形で 落ちます（`miss` が 数えます）。
def _見本の在処():
  候 = [os.path.join(PACK,'見本'),
        os.path.join(PACK,'docs','design','pack-final'),
        os.path.join(PACK,'docs','design','pack-final','見本')]
  for c in 候:
    if all(os.path.exists(os.path.join(c,f)) for f in _LIVE_NAMES): return c
  return 候[0]
_LIVE_NAMES=['00-動く見本-iPhoneで開く用.html',
             '00-動く見本（さわれる・全画面）.html',
             '00-動く見本-PC・iPad（運営）.html',
             '00-動く見本-PC・iPad（個人）.html']

# ★数える 見本 ── ★これ以外は 数えません（★旧名の 写しを 混ぜない ため）
LIVE=['00-動く見本-iPhoneで開く用.html',
      '00-動く見本（さわれる・全画面）.html',
      '00-動く見本-PC・iPad（運営）.html',
      '00-動く見本-PC・iPad（個人）.html']

MOCKS=_見本の在処()

# ★確定値（★裁定214・2026-09-27）── ★増えたら ここを 直し、★同じ日に 実行ルートも 直す
FIXED={'画面':209,'シート':30}

JS = """() => {
  const g = n => { try { return eval(n) } catch(e) { return undefined } };
  const ks = o => (o && typeof o === 'object') ? Object.keys(o) : [];
  const str = a => a.filter(x => typeof x === 'string');  /* ★★文字列だけ 残す（中身が 物の ことが ある） */
  /* ★TAB は 見本に よって 形が 違う:
       ★① タブ名 → 画面を 返す 関数（運営）  → ★鍵が タブ名
       ★② 役職 → タブ名の 配列（スマホ）     → ★★鍵は 役職。★値が タブ名
     ★②の 鍵を 数えると admin/owner/staff/teacher が 画面に 化けます（2026-09-27 に 起きました）*/
  const tabOf = o => {
    if (!o) return [];
    if (Array.isArray(o)) return o;                                              /* ★配列は そのまま */
    if (typeof o !== 'object') return [];
    const vs = Object.values(o);
    if (vs.length && vs.every(v => Array.isArray(v))) return [].concat(...vs);  /* ★②値を 取る */
    return Object.keys(o);                                                       /* ★①鍵を 取る */
  };
  /* ★★TABS_O も 同じ形でした（役職 → タブ名の 配列）。★4つ とも tabOf を 通します */
  const tabs = str([].concat(tabOf(g('TABS')), tabOf(g('TABS_P')), tabOf(g('TABS_O')), tabOf(g('TAB'))));
  return { sc: str(ks(g('SC'))), sh: str(ks(g('SHEET')).concat(ks(g('SH')))), tb: [...new Set(tabs)] };
}"""

async def scan(paths):
    from playwright.async_api import async_playwright
    out={}
    async with async_playwright() as pw:
        b=await pw.chromium.launch()
        for f in paths:
            p=await b.new_page(); errs=[]
            p.on('pageerror',lambda e: errs.append(str(e)))
            await p.goto('file://'+urllib.parse.quote(os.path.join(MOCKS,f)))
            await p.wait_for_timeout(500)
            r=await p.evaluate(JS); r['err']=len(errs)
            out[f]=r; await p.close()
        await b.close()
    return out

def tally(d):
    sc=set(); sh=set(); tb=set()
    for v in d.values():
        sc|=set(v['sc']); sh|=set(v['sh']); tb|=set(v['tb'])
    return {'SC':sc,'SH':sh,'TB':tb,'画面':sc|tb,'シート':sh-sc}

def main(argv):
    miss=[f for f in LIVE if not os.path.exists(os.path.join(MOCKS,f))]
    if miss:
        print('SCREEN_COUNT ★数える 見本が 見つかりません:',miss); return 2
    d=asyncio.run(scan(LIVE))
    t=tally(d)
    bad=[f for f,v in d.items() if v['err']]
    print('SCREEN_COUNT ★数え方: 画面＝SC＋(SC に無い タブ) ／ シートは 別勘定 ／ 重なり除く')
    for f in LIVE:
        v=d[f]; print('  %-38s SC %3d  シート %2d  タブ %2d  誤り %d'%(f[:38],len(v['sc']),len(v['sh']),len(v['tb']),v['err']))
    print('  ── 重なりを 除いて ──')
    print('  SC %d ／ SC に無い タブ %d ／ ★★画面 %d'%(len(t['SC']),len(t['画面'])-len(t['SC']),len(t['画面'])))
    print('  ★★シート %d（★SC と 重なり %d）'%(len(t['シート']),len(t['SH']&t['SC'])))
    if bad: print('  ★JavaScript の 誤りが 出た 見本:',bad)
    if '--write' in argv:
        day=datetime.date.today().isoformat()
        p=os.path.join(PACK,'文書','画面の数_%s.md'%day)
        with open(p,'w',encoding='utf-8') as w:
            w.write('# 画面の数（★道具が 数えました）\n\n%s ／ tools/screen_count.py\n\n'%day)
            w.write('```yaml\n★数え方（裁定214）: 画面＝SC＋(SC に無い タブ) ／ シートは 別勘定 ／ 重なり除く\n')
            w.write('★★画面: %d\n★★シート: %d\n\n見本ごと:\n'%(len(t['画面']),len(t['シート'])))
            for f in LIVE:
                v=d[f]; w.write('  %s: {SC: %d, シート: %d, タブ: %d}\n'%(f,len(v['sc']),len(v['sh']),len(v['tb'])))
            w.write('```\n\n## 画面の 名前（%d）\n\n'%len(t['画面']))
            for n in sorted(t['画面']): w.write('- %s\n'%n)
            w.write('\n## シートの 名前（%d）\n\n'%len(t['シート']))
            for n in sorted(t['シート']): w.write('- %s\n'%n)
        print('  ★書きました:',os.path.relpath(p,PACK))
    if '--check' in argv:
        now={'画面':len(t['画面']),'シート':len(t['シート'])}
        if now!=FIXED:
            print('  ★★確定値と 違います: 確定 %s ／ いま %s'%(FIXED,now))
            print('  ★増やした／減らしたなら ★tools/screen_count.py の FIXED と')
            print('  ★実行ルートの 数を ★同じ日に 直してください')
            return 1
        print('  ★確定値と 一致:',FIXED)
    return 0

def selftest():
    # ★★2026-09-27 に 実際に 起きた 形を 仕込みます:
    #   ★TAB が「役職 → タブ名の 配列」だった ため、
    #   ★admin/owner/staff/teacher が ★画面として 数えられました（4件 水増し）
    #   ★JS 側で 直しました。★ここでは「役職が 混ざったら 気づく」ことを 確かめます
    d={'a.html':{'sc':['X','Y'],'sh':['s1'],'tb':['きょう','X'],'err':0},
       'b.html':{'sc':['Y','Z'],'sh':['s1','s2'],'tb':['きょう'],'err':0}}
    ROLES={'admin','owner','staff','teacher'}
    t=tally(d)
    assert len(t['SC'])==3, t['SC']            # X Y Z ── ★重なりを 除く
    assert len(t['画面'])==4, t['画面']         # ＋ きょう（★SC に 無い タブ）
    assert len(t['シート'])==2, t['シート']      # s1 s2
    # ★タブが SC にも ある とき 二重に 数えない
    assert 'X' in t['SC'] and len(t['画面'])==4
    assert not (t['画面'] & ROLES), '★役職が 画面に 混ざっています'
    bad=tally({'c.html':{'sc':['X'],'sh':[],'tb':sorted(ROLES),'err':0}})
    assert bad['画面'] & ROLES, '★仕掛けが 効いていません（★番人を 壊して 確かめる・M21f）'
    print('SELFTEST OK ── 重なり除き／タブの 二重計上なし／シート 別勘定／役職の 混入を 見張る')
    return 0

if __name__=='__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main(sys.argv[1:]))
