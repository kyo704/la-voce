# -*- coding: utf-8 -*-
"""作品データを作る道具。★既存の形（norma.json）に そろえる"""
import json, os, re, glob

DEST = os.environ.get('WORKS', '/tmp/claude-0/-home-claude/be5e229a-ca1c-5847-a798-590d6c97fd75/scratchpad/woolsong_full/works')

# ★弦は count 0 ＋ note（既存の形）
def strings():
    return [{"part": p, "count": 0, "section": "strings", "note": "人数は公演ごと"}
            for p in ("第1ヴァイオリン", "第2ヴァイオリン", "ヴィオラ", "チェロ", "コントラバス")]

def orch(fl=2, ob=2, cl=2, fg=2, hr=4, tp=2, tb=3, tuba=0, timp=1, perc=1,
         harp=0, keys=None, extra=None, dbl=None):
    """ふつうの2管〜4管。★数だけ。人は公演ごと"""
    out = []
    def add(part, n, sec, **kw):
        if n: out.append(dict(part=part, count=n, section=sec, **kw))
    add("フルート", fl, "woodwind", **({"doubling": dbl["fl"]} if dbl and "fl" in dbl else {}))
    add("オーボエ", ob, "woodwind", **({"doubling": dbl["ob"]} if dbl and "ob" in dbl else {}))
    add("クラリネット", cl, "woodwind", **({"doubling": dbl["cl"]} if dbl and "cl" in dbl else {}))
    add("ファゴット", fg, "woodwind", **({"doubling": dbl["fg"]} if dbl and "fg" in dbl else {}))
    add("ホルン", hr, "brass"); add("トランペット", tp, "brass")
    add("トロンボーン", tb, "brass"); add("チューバ", tuba, "brass")
    add("ティンパニ", timp, "percussion"); add("打楽器", perc, "percussion")
    add("ハープ", harp, "harp")
    for k in (keys or []): out.append(dict(part=k, count=1, section="keyboard"))
    for e in (extra or []): out.append(e)
    return out + strings()

def cont():
    """バロックの通奏低音"""
    return [{"part": "チェンバロ", "count": 1, "section": "keyboard"},
            {"part": "通奏低音（チェロ・コントラバス）", "count": 2, "section": "strings"}]

def W(fname, title, composer, roles, scenes, *, orig=None, aliases=None,
      year=None, dur=None, lang="it", kind="opera", inst=None, sort=None,
      sid=None, note=None, edition=None):
    """1作を書く。
    roles: ['ノルマ', ('合唱', True), ...]  ★True＝団体
    scenes: [('第1幕', '場面名', ['役', ...]), ...]
    """
    rr = []
    for r in roles:
        if isinstance(r, tuple): rr.append({"label": r[0], "is_group": True})
        else: rr.append({"label": r})
    known = {x["label"] for x in rr}
    ss = []
    for g, lab, who in scenes:
        names = [(w[0] if isinstance(w, tuple) else w) for w in who]
        for w in names:
            assert w in known, f"{fname}: 役が 一覧に ない → {w}"
        assert len(set(names)) == len(names), f"{fname}: 同じ役が2回 → {lab}"
        ss.append({"label": lab, "group_label": g, "roles": names})
    d = {"title": title}
    if orig: d["title_original"] = orig
    if aliases: d["aliases"] = aliases
    d["composer"] = composer
    if sort: d["composer_sort"] = sort
    d["kind"] = kind
    if year: d["year_written"] = year
    if dur: d["duration_min"] = dur
    if edition: d["edition"] = edition
    d["language"] = lang
    d["source"] = "hand"
    d["source_id"] = sid or re.sub(r'\.json$', '', fname)
    if note: d["note"] = note
    d["roles"] = rr
    d["scenes"] = ss
    d["instruments"] = inst if inst is not None else orch()
    p = os.path.join(DEST, fname)
    if os.path.exists(p):
        if os.environ.get('SKIP_EXISTING'):
            return fname + "（すでに ある ─ 飛ばしました）"
        raise AssertionError(f"★すでに ある: {fname}")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return fname

def existing_titles():
    t = set()
    for f in glob.glob(os.path.join(DEST, '*.json')):
        try: d = json.load(open(f, encoding='utf-8'))
        except Exception: continue
        for w in (d if isinstance(d, list) else [d]):
            if isinstance(w, dict) and 'title' in w: t.add(w['title'])
    return t
