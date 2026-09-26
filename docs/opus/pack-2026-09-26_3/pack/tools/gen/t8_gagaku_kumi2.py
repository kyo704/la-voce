# -*- coding: utf-8 -*-
"""★雅楽 第2陣（管絃・舞楽の残り）と ★組踊 第2陣"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from t3_kabuki import GG, KM, MK, GK, UM, TK

# ═══ 舞楽（左方＝唐楽） ═══
GG("gagaku-shunnoden.json", "春鶯囀", "壱越調", True,
   [("遊声", [MK, GK, UM]), ("序", [MK, GK, UM, TK]), ("颯踏", [MK, GK, UM, TK]),
    ("入破", [MK, GK, UM, TK]), ("鳥声", [MK, GK, UM, TK]), ("急声", [MK, GK, UM, TK])],
   dur=60, sahou="左方（唐楽）", note="★★★雅楽 最大の 曲の1つ。★六つの 部分から なります")
GG("gagaku-katen.json", "賀殿", "壱越調", True,
   [("序", [MK, GK, UM]), ("破", [MK, GK, UM, TK]), ("急", [MK, GK, UM, TK])],
   dur=25, sahou="左方（唐楽）", note="★四人舞")
GG("gagaku-kishunraku.json", "喜春楽", "壱越調", True,
   [("★当曲（四人舞）", [MK, GK, UM, TK])], dur=15, sahou="左方（唐楽）")
GG("gagaku-showaraku.json", "承和楽", "太食調", True,
   [("★当曲（四人舞）", [MK, GK, UM, TK])], dur=15, sahou="左方（唐楽）")
GG("gagaku-oujo.json", "皇麞", "壱越調", True,
   [("序", [MK, GK, UM]), ("破", [MK, GK, UM, TK]), ("急", [MK, GK, UM, TK])],
   dur=30, sahou="左方（唐楽）")
GG("gagaku-takyuraku.json", "打球楽", "太食調", True,
   [("★当曲（毬杖を持って舞う）", [MK, GK, UM, TK])], dur=20, sahou="左方（唐楽）",
   note="★毬（まり）の 遊びを 写した 舞")
GG("gagaku-sanju.json", "散手", "盤渉調", True,
   [("★当曲（一人舞・甲を着け矛を持つ）", [MK, UM, TK])], dur=20, sahou="左方（唐楽）",
   note="★★一人で 舞う 武舞。★右方の『貴徳』と 対に なります")
GG("gagaku-shinmaka.json", "新靺鞨", "壱越調", True,
   [("★当曲（一人舞）", [MK, UM, TK])], dur=15, sahou="左方（唐楽）")
GG("gagaku-hassen.json", "八仙", "盤渉調", True,
   [("序", [MK, GK, UM]), ("★当曲（鶴の姿を写す四人舞）", [MK, GK, UM, TK])],
   dur=25, sahou="左方（唐楽）", note="★鶴の 姿を 写す 舞")
GG("gagaku-bandai.json", "輪台", "盤渉調", True,
   [("★輪台（青海波の序に当たる）", [MK, GK, UM, TK])], dur=12, sahou="左方（唐楽）",
   note="★『青海波』の 前に 続けて 奏します")
GG("gagaku-banshuraku.json", "万秋楽", "平調", True,
   [("一帖", [MK, GK, UM, TK]), ("二帖", [MK, GK, UM, TK]), ("三帖", [MK, GK, UM, TK]),
    ("四帖", [MK, GK, UM, TK]), ("五帖", [MK, GK, UM, TK]), ("六帖", [MK, GK, UM, TK])],
   dur=70, sahou="左方（唐楽）", note="★★★六帖から なる 大曲。★全曲の 上演は 稀")
GG("gagaku-sogoko.json", "蘇合香", "盤渉調", True,
   [("序（一帖・二帖・三帖）", [MK, GK, UM]), ("破", [MK, GK, UM, TK]), ("急", [MK, GK, UM, TK])],
   dur=60, sahou="左方（唐楽）", note="★★大曲")
GG("gagaku-ryukaen.json", "柳花苑", "平調", False,
   [("★管絃", [MK, GK, UM])], dur=12, sahou="左方（唐楽）")
GG("gagaku-sofuren.json", "想夫恋", "平調", False,
   [("★管絃", [MK, GK, UM])], dur=12, sahou="左方（唐楽）",
   note="★★『平家物語』に 出る 曲")
GG("gagaku-senshuraku.json", "千秋楽", "盤渉調", False,
   [("★管絃", [MK, GK, UM])], dur=10, sahou="左方（唐楽）",
   note="★★興行の 終わりを『千秋楽』と 呼ぶ もとと 言われます")
GG("gagaku-kanshu.json", "甘州", "盤渉調", False,
   [("★管絃", [MK, GK, UM])], dur=12, sahou="左方（唐楽）")
GG("gagaku-ringa.json", "林歌", "平調", False,
   [("★管絃", [MK, GK, UM])], dur=10, sahou="右方（高麗楽）系の曲名だが唐楽で奏す")
GG("gagaku-sandaien.json", "三台塩", "平調", False,
   [("急", [MK, GK, UM])], dur=10, sahou="左方（唐楽）")
GG("gagaku-shuntoka.json", "春庭花", "太食調", True,
   [("★当曲（四人舞）", [MK, GK, UM, TK])], dur=15, sahou="左方（唐楽）")
GG("gagaku-shinoraku.json", "秦王破陣楽", "太食調", True,
   [("★当曲（武舞）", [MK, UM, TK])], dur=20, sahou="左方（唐楽）")

# ═══ 舞楽（右方＝高麗楽） ═══
GG("gagaku-kitoku.json", "貴徳", "高麗壱越調", True,
   [("★当曲（一人舞・面を着け矛を持つ）", [MK, UM, TK])], dur=20, sahou="右方（高麗楽）",
   note="★★左方の『散手』と 対に なります")
GG("gagaku-engiraku.json", "延喜楽", "高麗壱越調", True,
   [("★当曲（四人舞）", [MK, UM, TK])], dur=15, sahou="右方（高麗楽）",
   note="★左方の『万歳楽』と 対に なります")
GG("gagaku-chikyu.json", "地久", "高麗壱越調", True,
   [("★当曲（四人舞）", [MK, UM, TK])], dur=20, sahou="右方（高麗楽）")
GG("gagaku-ninaraku.json", "仁和楽", "高麗壱越調", True,
   [("★当曲（四人舞）", [MK, UM, TK])], dur=15, sahou="右方（高麗楽）")
GG("gagaku-choboraku.json", "長保楽", "高麗壱越調", True,
   [("破", [MK, UM, TK]), ("急", [MK, UM, TK])], dur=20, sahou="右方（高麗楽）")
GG("gagaku-ama.json", "安摩", "壱越調", True,
   [("★当曲（紙の面を着けた二人舞）", [MK, UM, TK])], dur=12, sahou="左方（唐楽）",
   note="★★このあと『二の舞』が 続きます")
GG("gagaku-ninomai.json", "二の舞", "壱越調", True,
   [("★当曲（『安摩』を真似ておどける二人舞）", [MK, UM, TK])], dur=12,
   sahou="左方（唐楽）", note="★★『安摩』の 舞を 真似て おどけます ── 雅楽の 中の 笑い")

# ═══ 振鉾・音取（式の曲） ═══
GG("gagaku-embu.json", "振鉾", "壱越調", True,
   [("★一節（左方の舞人）", [MK, UM, TK]), ("★二節（右方の舞人）", [MK, UM, TK]),
    ("★三節（二人で）", [MK, UM, TK])], dur=10, sahou="式の曲",
   note="★★★舞楽の いちばん 初めに 舞う 曲。★場を 清めます")
GG("gagaku-netori-ichikotsu.json", "音取（壱越調）", "壱越調", False,
   [("★音取", [MK, GK, UM])], dur=3, sahou="式の曲", note="★曲の 前に 調子を 整えます")
GG("gagaku-netori-banshiki.json", "音取（盤渉調）", "盤渉調", False,
   [("★音取", [MK, GK, UM])], dur=3, sahou="式の曲")
GG("gagaku-netori-hyojo.json", "音取（平調）", "平調", False,
   [("★音取", [MK, GK, UM])], dur=3, sahou="式の曲")
GG("gagaku-netori-taishiki.json", "音取（太食調）", "太食調", False,
   [("★音取", [MK, GK, UM])], dur=3, sahou="式の曲")
GG("gagaku-choshi-ichikotsu.json", "調子（壱越調）", "壱越調", False,
   [("★調子", [MK, GK, UM])], dur=5, sahou="式の曲")

# ═══ 国風歌舞（くにぶりのうたまい） ═══
GG("gagaku-kumemai.json", "久米舞", "―", True,
   [("★当曲（太刀を持つ四人舞）", [MK, UM, TK])], dur=15, sahou="国風歌舞",
   note="★★日本に もとから ある 舞。★即位の 礼などで 舞われます")
GG("gagaku-gosechi-no-mai.json", "五節舞", "―", True,
   [("★当曲（女舞）", [MK, UM, TK])], dur=15, sahou="国風歌舞",
   note="★★女性が 舞います")
GG("gagaku-yamato-mai.json", "倭舞", "―", True,
   [("★当曲", [MK, UM, TK])], dur=15, sahou="国風歌舞")

# ═══════ 組踊 ═══════
KM("kumi-okawa-katakiuchi.json", "大川敵討",
   ["谷茶の子", "富盛の子", "あまおへ（敵）", "乙樽", "供の者"],
   [("★父を討たれた兄弟が名乗る", ["谷茶の子", "富盛の子"]),
    ("★仇を探して旅に出る", ["谷茶の子", "富盛の子", "供の者"]),
    ("★★乙樽の力を借りる", ["谷茶の子", "乙樽", "富盛の子"]),
    ("★★大川での討入り", ["谷茶の子", "富盛の子", "あまおへ（敵）"])],
   y=1700, author="田里朝直", note="★★組踊の 中で 最も よく 上演される 敵討物の1つ")
KM("kumi-gishin-monogatari.json", "義臣物語",
   ["護佐丸の遺児", "阿麻和利", "忠臣", "母"],
   [("★家を滅ぼされる", ["護佐丸の遺児", "母"]),
    ("★忠臣に守られて逃れる", ["護佐丸の遺児", "忠臣"]),
    ("★★阿麻和利を討つ", ["護佐丸の遺児", "忠臣", "阿麻和利"])],
   y=1750, author="田里朝直")
KM("kumi-chushin-migawari.json", "忠臣身替の巻",
   ["若按司", "忠臣", "敵の武士", "乳母"],
   [("★若按司が狙われる", ["若按司", "乳母"]),
    ("★★忠臣が身替りに立つ", ["忠臣", "敵の武士"]),
    ("★若按司が助かる", ["若按司", "忠臣", "乳母"])],
   y=1760, author="田里朝直")
KM("kumi-chozu-no-en.json", "手水の縁",
   ["山戸", "玉津", "父", "供の者"],
   [("★★泉で手水を乞う（★出会い）", ["山戸", "玉津"]),
    ("★恋を語り合う", ["山戸", "玉津"]),
    ("★★父に知られて咎められる", ["玉津", "父"]),
    ("★★二人が許される", ["山戸", "玉津", "父", "供の者"])],
   y=1800, author="平敷屋朝敏", note="★★★組踊の 中の 恋物語。★最も 人気の ある曲の1つ")
KM("kumi-kushi-no-wakaaji.json", "久志の若按司",
   ["久志の若按司", "乳母", "敵", "供の者"],
   [("★若按司が難を逃れる", ["久志の若按司", "乳母"]),
    ("★★敵に追われる", ["久志の若按司", "敵", "供の者"]),
    ("★仇を討つ", ["久志の若按司", "敵"])],
   y=1780)
KM("kumi-tsukahena.json", "束辺名夜討",
   ["束辺名の子", "敵", "妹", "供の者"],
   [("★夜討の支度", ["束辺名の子", "供の者"]),
    ("★★夜討の場", ["束辺名の子", "敵", "供の者"]),
    ("★妹との再会", ["束辺名の子", "妹"])],
   y=1790)
KM("kumi-kenbo-sanken.json", "賢母三遷の巻",
   ["母", "子", "師", "隣の者"],
   [("★子の育ちを思って住まいを移す", ["母", "子"]),
    ("★★三度 住まいを移す", ["母", "子", "隣の者"]),
    ("★★子が学に志す", ["母", "子", "師"])],
   y=1770, author="田里朝直", note="★孟母三遷の 話を 組踊に したもの")
KM("kumi-takadera-manzai.json", "高平良万歳",
   ["兄（万歳に化ける）", "弟", "敵", "供の者"],
   [("★父の仇を探す兄弟", ["兄（万歳に化ける）", "弟"]),
    ("★★万歳（門付けの芸人）に化ける", ["兄（万歳に化ける）", "弟"]),
    ("★★敵の前で芸を見せる", ["兄（万歳に化ける）", "弟", "敵", "供の者"]),
    ("★★正体を現して討つ", ["兄（万歳に化ける）", "弟", "敵"])],
   y=1756, author="田里朝直", note="★★★芸を 見せながら 仇を 討つ ── 見せ場の 多い 曲")
KM("kumi-fushiyama-katakiuchi.json", "伏山敵討",
   ["兄", "弟", "敵", "母"],
   [("★仇を知る", ["兄", "弟", "母"]),
    ("★伏山に待ち伏せる", ["兄", "弟"]),
    ("★★討入り", ["兄", "弟", "敵"])],
   y=1770)
KM("kumi-hokuzan-kuzure.json", "北山崩",
   ["今帰仁の按司", "尚巴志", "按司の妻", "供の者"],
   [("★北山の城が攻められる", ["今帰仁の按司", "供の者"]),
    ("★★城の落ちる場", ["今帰仁の按司", "尚巴志", "供の者"]),
    ("★妻の嘆き", ["按司の妻"])],
   y=1780, note="★琉球の 歴史（★三山の 統一）を 元に します")
KM("kumi-motobu-odushu.json", "本部大主",
   ["本部大主", "謝名の子", "妻", "供の者"],
   [("★本部大主の悪政", ["本部大主", "供の者"]),
    ("★★謝名の子が立つ", ["謝名の子", "妻"]),
    ("★★討入り", ["謝名の子", "本部大主", "供の者"])],
   y=1790)
KM("kumi-oshiro-kuzure.json", "大城崩",
   ["大城の按司", "敵の按司", "娘", "供の者"],
   [("★大城の城", ["大城の按司", "娘"]),
    ("★★城が攻められて落ちる", ["大城の按司", "敵の按司", "供の者"]),
    ("★娘の嘆き", ["娘"])],
   y=1800)
KM("kumi-manzai-katakiuchi.json", "万歳敵討",
   ["兄", "弟", "敵", "供の者"],
   [("★仇を探す兄弟", ["兄", "弟"]),
    ("★★万歳に化けて近づく", ["兄", "弟", "供の者"]),
    ("★★討入り", ["兄", "弟", "敵"])],
   y=1760, note="★『高平良万歳』と 筋立てが 近い 曲")
