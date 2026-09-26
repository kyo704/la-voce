# -*- coding: utf-8 -*-
"""★能を作る道具。
★★能は 役の作りが 決まっています ── シテ／ツレ／ワキ／ワキツレ／アイ／地謡／囃子方。
★★段の作りも 決まっています ── ★複式夢幻能（前段・中入・後段）と ★現在能（単式）の2つ。
★★だから 道具で 形を そろえ、★曲ごとに 違うところ（シテの正体・場所・舞・分類）だけ 書きます。
★★歌詞（謡）は 入れません（裁定174）。"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from mk import W

HAYASHI_3 = [{"part": "笛（能管）", "count": 1, "section": "woodwind"},
             {"part": "小鼓", "count": 1, "section": "percussion"},
             {"part": "大鼓", "count": 1, "section": "percussion"}]
HAYASHI_4 = HAYASHI_3 + [{"part": "太鼓", "count": 1, "section": "percussion"}]

BAN = {1: "初番目物（脇能・神）", 2: "二番目物（修羅）", 3: "三番目物（鬘・女）",
       4: "四番目物（雑）", 5: "五番目物（切・鬼）"}


def N(f, title, ban, shite, waki, *, shite_go=None, tsure=None, waki_tsure=None,
      ai=True, taiko=None, author=None, place=None, mugen=True, mai=None,
      dur=90, note=None, orig=None, al=None, kogaki=None):
    """1曲を書く。
    shite     前シテ（現在能なら シテ）
    shite_go  後シテ（★正体。夢幻能のみ）
    mai       舞の名（序ノ舞・中ノ舞・神舞・急ノ舞・獅子 など）
    taiko     太鼓が入るか。None なら 番で決める（五番目物は入る）
    kogaki    小書（こがき／★演出の替え。例：赤頭・白頭・乱拍子）
    """
    if taiko is None:
        taiko = (ban == 5)
    roles = []
    roles.append(f"シテ（{shite}）" if not shite_go else f"前シテ（{shite}）")
    if shite_go:
        roles.append(f"後シテ（{shite_go}）")
    for t in (tsure or []):
        roles.append(f"シテツレ（{t}）")
    roles.append(f"ワキ（{waki}）")
    for t in (waki_tsure or []):
        roles.append(f"ワキツレ（{t}）")
    if ai:
        roles.append("アイ（間狂言）")
    roles.append(("地謡", True))
    roles.append(("囃子方", True))
    roles.append(("後見", True))

    S = lambda s: f"シテ（{shite}）" if not shite_go else f"前シテ（{shite}）"
    SG = (lambda: f"後シテ（{shite_go}）") if shite_go else None
    Wk = f"ワキ（{waki}）"
    ji, ha, ko = "地謡", "囃子方", "後見"
    T = [f"シテツレ（{t}）" for t in (tsure or [])]
    WT = [f"ワキツレ（{t}）" for t in (waki_tsure or [])]

    sc = []
    if mugen:
        sc.append(("前段", f"次第・ワキの道行（{place or '道行'}）", [Wk] + WT + [ha, ji]))
        sc.append(("前段", f"一声・前シテの登場（{shite}）", [S(0)] + T + [ha, ji]))
        sc.append(("前段", "ワキとの問答・クセ（いわれを語る）", [S(0)] + T + [Wk] + WT + [ji]))
        sc.append(("中入", "中入・アイの語り（間狂言）" if ai else "中入", (["アイ（間狂言）", Wk] if ai else [Wk, ko])))
        sc.append(("後段", f"出端・後シテの出（{shite_go}）", [SG(), ha, ji]))
        sc.append(("後段", f"{mai or '舞'}", [SG(), ha, ji]))
        sc.append(("後段", "キリ（終曲）", [SG(), Wk, ji, ha]))
    else:
        sc.append(("前段", f"ワキの登場（{place or '名乗り'}）", [Wk] + WT + [ha, ji]))
        sc.append(("前段", f"シテの登場（{shite}）", [S(0)] + T + [ha, ji]))
        sc.append(("前段", "問答・いわれ", [S(0)] + T + [Wk] + WT + [ji]))
        if ai:
            sc.append(("中", "アイ（間狂言）", ["アイ（間狂言）", Wk]))
        sc.append(("後段", f"{mai or '見せ場'}", [S(0)] + T + [ha, ji]))
        sc.append(("後段", "キリ（終曲）", [S(0)] + T + [Wk] + WT + [ji, ha]))

    n = f"★{BAN[ban]}"
    if author: n += f" ／ 作者 {author}"
    if kogaki: n += f" ／ 小書 {kogaki}"
    if note: n += f" ／ {note}"
    n += " ／ ★謡（うたい）の文は 入れていません"
    return W(f, title, f"能（{BAN[ban]}）", roles, sc,
             orig=orig, aliases=al, kind="noh", lang="ja", dur=dur,
             inst=(HAYASHI_4 if taiko else HAYASHI_3), note=n, sort="Noh")
