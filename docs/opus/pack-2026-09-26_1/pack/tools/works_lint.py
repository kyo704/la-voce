#!/usr/bin/env python3
"""★作品データの 検査。
★★香盤表は ★行（場面）× 列（役）で 立ちます。
　★その2つが 食い違っていると ★公演が 立ちません。

★見るもの
  ★A JSON が 読めるか
  ★B 場面の 役が ★役の一覧に あるか（★行き先の無い 札を 作らない）
  ★C 場面が 0 の 作品（★香盤表が 立たない）
  ★D 同じ 題名で ★中身が 違うもの（★別の作曲家なら よい／同じなら 重複）
  ★E 弦の count が 0 に ★note が 付いているか（★0＝公演ごと の しるし）
  ★F ★count が 0 で note も 無い 楽器（★「誰も いない」と 読まれる）
  ★G kind が ★決めた ものの中に あるか

★使い方: python3 tools/works_lint.py <works フォルダ> [--selftest]"""
import glob, json, os, sys, collections

KINDS = {'opera', 'orchestra', 'drama', 'chamber', 'chorus', 'band', 'dance',
         'song_cycle', 'musical',
         # ★★2026-09-26 伝統芸能を 6つに 分けました
         #   ★理由: ★種類で『稽古の言葉』が 違う（能＝申合せ／歌舞伎＝附立／文楽＝床稽古）
         #   ★1つに まとめると 出し分けられません
         'noh', 'kyogen', 'kabuki', 'bunraku', 'gagaku', 'kumiodori'}
# ★★kind の一覧は works/_kinds.json と 揃えます（★片方だけ足すと ここで NG になります）
# ★弦は 人数が 公演ごとに 変わるので count 0 ＋ note が 正しい形
STRINGS = {'第1ヴァイオリン', '第2ヴァイオリン', 'ヴィオラ', 'チェロ', 'コントラバス', 'ヴァイオリン'}


def check(root):
    out = collections.defaultdict(list)
    titles = collections.defaultdict(list)
    n = sc = 0
    for f in sorted(glob.glob(os.path.join(root, '*.json'))):
        b = os.path.basename(f)
        if b.startswith('_'):   # ★_kinds.json など 作品でないもの
            continue
        try:
            d = json.load(open(f, encoding='utf-8'))
        except Exception as e:
            out['A'].append((b, str(e)[:80])); continue
        for w in (d if isinstance(d, list) else [d]):
            if not isinstance(w, dict) or 'title' not in w: continue
            n += 1
            rr = {r.get('label') for r in (w.get('roles') or [])}
            ss = w.get('scenes') or []
            sc += len(ss)
            for s in ss:
                for r in (s.get('roles') or []):
                    if r not in rr:
                        out['B'].append((b, s.get('label'), r))
            if not ss:
                out['C'].append((b, w['title']))
            titles[w['title']].append((b, w.get('composer')))
            for i in (w.get('instruments') or []):
                p, c, nt = i.get('part', ''), i.get('count'), i.get('note')
                if p in STRINGS and c == 0 and not nt:
                    out['E'].append((b, p))
                elif c == 0 and not nt and p not in STRINGS:
                    out['F'].append((b, p))
            if w.get('kind') not in KINDS:
                out['G'].append((b, w.get('kind')))
            # ★H ★ミュージカルは 版で 曲が 変わるので edition が 要ります
            if w.get('kind') == 'musical' and not w.get('edition'):
                out['H'].append((b, w['title']))
    for t, v in titles.items():
        comps = {c for _, c in v}
        if len(v) > 1 and len(comps) == 1:
            out['D'].append((t, [b for b, _ in v]))
    return n, sc, out


MSG = {
 'A': '★JSON が 読めない',
 'B': '★場面の 役が 一覧に 無い ── ★香盤表の 行き先が 無い',
 'C': '★場面が 0 ── ★香盤表が 立たない',
 'D': '★★同じ 題名・同じ 作曲家 ── ★重複の おそれ',
 'E': '★弦の count 0 に note が 無い',
 'F': '★★count 0 で note も 無い ── ★「誰も いない」と 読まれます',
 'G': '★kind が 決めたもの以外',
 'H': '★★ミュージカルに 版（edition）が 無い ── ★版で 曲が 変わります',
}
HARD = {'A', 'B', 'C', 'D', 'G', 'H'}   # ★これは 直す
SOFT = {'E', 'F'}                  # ★これは 知らせるだけ


def main():
    root = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'works'
    n, sc, out = check(root)
    print('WORKS_LINT', root)
    print(f'  ★作品 {n} ／ ★場面 {sc}')
    hard = soft = 0
    for k in 'ABCDEFGH':
        v = out.get(k) or []
        if not v: continue
        tag = 'DIFF' if k in HARD else 'NOTE'
        print(f'  {tag} {MSG[k]} … {len(v)}件')
        for x in v[:6]:
            print('       ', x)
        if len(v) > 6: print(f'        …ほか {len(v)-6}件')
        if k in HARD: hard += len(v)
        else: soft += len(v)
    print('★★香盤表は 行（場面）× 列（役）。★その2つが 合っていないと 公演が 立ちません')
    tail = f' ／ 知らせ {soft}件' if soft else ''
    print(f'RESULT: {"OK" if hard == 0 else f"NG（{hard}件）"}' + tail)
    return 0


def selftest():
    import tempfile, json as J
    d = tempfile.mkdtemp()
    ok = {"title": "よい作", "composer": "甲", "kind": "opera",
          "roles": [{"label": "ア"}], "scenes": [{"label": "1", "group_label": "第1幕", "roles": ["ア"]}],
          "instruments": [{"part": "チェロ", "count": 0, "section": "strings", "note": "人数は公演ごと"}]}
    J.dump(ok, open(os.path.join(d, 'a.json'), 'w'))
    n, sc, o = check(d)
    assert n == 1 and sc == 1 and not any(o.get(k) for k in 'ABCDEFG'), f'よい作を NG にした: {dict(o)}'

    ng = {"title": "わるい作", "composer": "甲", "kind": "opera",
          "roles": [{"label": "ア"}], "scenes": [{"label": "1", "group_label": "第1幕", "roles": ["イ"]}],
          "instruments": [{"part": "竹本", "count": 0, "section": "other"}]}
    J.dump(ng, open(os.path.join(d, 'b.json'), 'w'))
    n, sc, o = check(d)
    assert len(o['B']) == 1 and o['B'][0][2] == 'イ', f'一覧に無い役を 見逃した: {dict(o)}'
    assert len(o['F']) == 1, f'count 0 の楽器を 見逃した: {dict(o)}'

    # ★同じ題名・同じ作曲家 → D
    J.dump(dict(ok, title="かぶり"), open(os.path.join(d, 'c.json'), 'w'))
    J.dump(dict(ok, title="かぶり"), open(os.path.join(d, 'd.json'), 'w'))
    n, sc, o = check(d)
    assert any(t == 'かぶり' for t, _ in o['D']), f'重複を 見逃した: {o["D"]}'
    print('SELFTEST PASS'); return 0


if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
