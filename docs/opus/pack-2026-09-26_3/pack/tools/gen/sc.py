# -*- coding: utf-8 -*-
"""★歌曲集の 生成器。
★★曲名は 事実です（★曲名 単体に 著作権は ありません ── 裁定174）。
★★★歌詞・対訳は 入れません。
★★曲名を 全部 確かめられない ものは ★曲数だけ 持ち、註に そう 書きます。"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from mk import W

PF = [{"part": "ピアノ", "count": 1, "section": "keyboard"}]

def SC(f, title, composer, songs, *, orig=None, y=None, dur=25, lang="de",
       sort=None, sid=None, note=None, al=None, inst=None, voice="独唱",
       acc="ピアノ", groups=None, n_songs=None, poet=None):
    """songs: ['1. 曲名（原語）', ...] ／ groups: 曲名と同じ長さの まとめ名
    ★n_songs を 渡すと『全n曲・曲名は 入れていません』の 形に なります"""
    roles = [voice] + ([acc] if acc else [])
    if n_songs == 0:
        # ★曲集では なく ★選集（★公演ごとに 曲を 選ぶ もの）
        sc = [(None, "★選んで 組みます（★曲は 公演ごと）", roles)]
        note = (note + " ／ " if note else "") + \
               "★★1つの 曲集では ないので ★曲の 数と 並びは 公演ごとに 決めます"
    elif n_songs:
        sc = [(None, f"★全{n_songs}曲（★曲名は 入れて いません）", roles)]
        note = (note + " ／ " if note else "") + \
               f"★★曲名を 全部 確かめられなかったので ★曲数（{n_songs}曲）だけ 持ちます"
    else:
        gs = groups or [None]*len(songs)
        sc = [(gs[i], s, roles) for i, s in enumerate(songs)]
    n = ("★作詩 " + poet + " ／ " if poet else "") + (note or "")
    n = (n or "") + (" ／ " if n else "") + "★★歌詞・対訳は 入れて いません"
    ii = inst or PF
    for x in ii:                      # ★count 0 に note が 無いと「誰も いない」と 読まれます
        if x.get("count") == 0 and not x.get("note"):
            x["note"] = "人数は公演ごと"
    return W(f, title, composer, roles, sc, orig=orig, year=y, dur=dur, aliases=al,
             kind="song_cycle", lang=lang, inst=ii, note=n, sort=sort, sid=sid)
