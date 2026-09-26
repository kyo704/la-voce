# -*- coding: utf-8 -*-
"""★運営の 見本の『作品をさがす』の ★データ源だけ 差し替えます。
★★描く ところは 1行も 変えません（★2026-09-26 の 教訓 M21g）"""
import sys, os, re
MARK = '<!-- ★WOOLSONG 作品データ 2050作 ここから -->'

def inject(path):
    s = open(path, encoding='utf-8').read()
    if MARK in s: return 'すでに 入って います'
    b64   = open('/tmp/works_b64.txt').read().strip()
    kinds = open('/tmp/kinds.json', encoding='utf-8').read().strip()
    js    = open(os.path.join(os.path.dirname(__file__), 'works_data.js'),
                 encoding='utf-8').read().replace('__KINDS__', kinds)

    # ── ★① N（種類ごとの 数）を 実数から 取る
    old_n = " var N={opera:181,chorus:71,orchestra:99,chamber:74,band:28,drama:84,dance:22,gala:0,other:0};"
    new_n = (" /* ★★2026-09-26: 見せかけの 数を やめ、★実データの 数に しました */\n"
             " var N=WKN&&Object.keys(WKN).length?WKN\n"
             "   :{opera:181,chorus:71,orchestra:99,chamber:74,band:28,drama:84,dance:22,gala:0,other:0};")
    if old_n not in s: return '★★N が 見つかりません'
    s = s.replace(old_n, new_n, 1)

    # ── ★② all（作品の 一覧）── ★元の 25件は 読めない ときの 控えに 残す
    m = re.search(r"\n var all=\[\n", s)
    if not m: return '★★all が 見つかりません'
    end = s.index("tpl:'zauber'}", m.end())            # ★配列の 終わりを 探す
    end = s.index("];", s.index("{g:'dance',n:'ミンクス", m.end())) + 2
    body = s[m.start():end]
    s = (s[:m.start()]
         + "\n /* ★★2026-09-26: 実データ 2,050作に 差し替えました。\n"
           "    ★下の 25件は ★データが 読めない ときの 控えです（★画面が 空に ならない ように） */\n"
           " var all=WKALL||" + body[len("\n var all="):end-m.start()].lstrip()
         + s[end:])

    # ── ★③ COMP（作曲家）を 実データの 多い順に
    old_c = " var cs=COMP[G]||[];"
    new_c = (" /* ★★2026-09-26: 作曲家も 実データの 多い順に しました */\n"
             " var cs=(WKCOMP&&WKCOMP[G])||COMP[G]||[];")
    if old_c not in s: return '★★COMP を 使う ところが 見つかりません'
    s = s.replace(old_c, new_c, 1)

    # ── ★④ 本体は 最後に（★tplFind が できた あとで 広げます）
    add = ('\n' + MARK + '\n'
           '<script id="WKDATA" type="application/gzip-base64">' + b64 + '</script>\n'
           '<script>\n' + js + '\n</script>\n'
           '<!-- ★WOOLSONG 作品データ 2050作 ここまで -->\n')
    i = s.rfind('</body>')
    if i < 0: i = s.rfind('</html>')
    if i < 0: return '★★</body> が 見つかりません'
    open(path, 'w', encoding='utf-8').write(s[:i] + add + s[i:])
    return 'OK'

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print('%-44s %s' % (os.path.basename(p), inject(p)))
