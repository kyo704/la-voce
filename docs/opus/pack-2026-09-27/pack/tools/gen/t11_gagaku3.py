# -*- coding: utf-8 -*-
"""★雅楽 第3陣 ── ★現行曲一覧と 突き合わせて 残っていた 44曲
★曲名と 調子（ちょうし）は 現行曲一覧で 確かめました。
★★曲の 組み立て（序・破・急 など）が 確かでない ものは ★『当曲』1つで 持ち、註に 書きました。
★『颯踏』『入破』『鳥破』『鳥急』は ★春鶯囀の 部分なので 別の 曲に していません。"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from t3_kabuki import GG, MK, GK, UM, TK

KATA = "★★曲の 組み立て（序・破・急 など）は 入れて いません ── ★曲名と 調子だけ 確かめました"

def M(f, t, cho, *, bugaku=False, dur=12, sahou="左方（唐楽）", note=None, al=None):
    who = [MK, GK, UM] + ([TK] if bugaku else [])
    n = KATA + (" ／ " + note if note else "")
    return GG(f, t, cho, bugaku, [("★当曲", who)], dur=dur, sahou=sahou, note=n, al=al)

# ═══ 壱越調 ═══
for f, t in [("hokuteiraku","北庭楽"), ("shinra-ryoo","新羅陵王"), ("kaibairaku","回盃楽"),
             ("jittenraku","十天楽"), ("bosatsu","菩薩"), ("shukoshi","酒胡子"),
             ("butokuraku","武徳楽"), ("shuseishi","酒清司"), ("ittankyo","壱団嬌"),
             ("bunchoraku","文長楽")]:
    M(f"gagaku-{f}.json", t, "壱越調")
# ═══ 平調 ═══
for f, t in [("haya-kanshu","早甘州"), ("shunyoryu","春楊柳"), ("rokunshi","老君子"),
             ("keiunraku","慶雲楽"), ("katoraku","裹頭楽"), ("yusho","勇勝"),
             ("funan","扶南"), ("yahanraku","夜半楽"), ("shorosu","小郎子"),
             ("baihoraku","梅芳楽"), ("keioraku","鶏応楽")]:
    M(f"gagaku-{f}.json", t, "平調")
M("gagaku-oshokun.json", "王昭君", "平調",
  note="★能・歌舞伎の『昭君』と 同じ 人の 話を 扱います")
# ═══ 双調 ═══
M("gagaku-shunteiraku.json", "春庭楽", "双調", bugaku=True, dur=15,
  note="★『春庭花』（太食調）とは 別の 曲です")
M("gagaku-buncho.json", "文鳥", "双調")
# ═══ 黄鐘調 ═══
for f, t in [("torika","桃李花"), ("okyuraku","央宮楽"), ("kaiseiraku","海青楽"),
             ("heibanraku","平蛮楽"), ("saioraku","西王楽"), ("shusuiraku","拾翠楽")]:
    M(f"gagaku-{f}.json", t, "黄鐘調")
# ═══ 盤渉調 ═══
for f, t in [("someiraku","宗明楽"), ("hakuchu","白柱"), ("chikurinraku","竹林楽"),
             ("chokoraku","鳥向楽"), ("soshun","蘇春")]:
    M(f"gagaku-{f}.json", t, "盤渉調")
M("gagaku-saisoro.json", "採桑老", "盤渉調", bugaku=True, dur=15,
  note="★★★一人舞。★杖を つく 老人の 姿。★一生に 一度しか 舞わない 習いと 言われます")
M("gagaku-kenki-kotatsu.json", "剣気褌脱", "盤渉調")
# ═══ 太食調 ═══
for f, t in [("keihairaku","傾盃楽"), ("senyuka","仙遊霞"), ("sohohi","蘇芳菲"),
             ("rinko-kotatsu","輪鼓褌脱"), ("shojin-sandai","庶人三台"), ("kasen","霞洗")]:
    M(f"gagaku-{f}.json", t, "太食調")
M("gagaku-chogeishi.json", "長慶子", "太食調", dur=8,
  note="★★★舞楽の 会の いちばん 終わりに 奏します（★客を 送る 曲）。★源博雅の 作と 伝えます")
