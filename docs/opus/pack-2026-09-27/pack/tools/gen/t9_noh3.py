# -*- coding: utf-8 -*-
"""★能 第3陣 ── ★現行演目一覧と 突き合わせて 残っていた 37番
★曲名は 能楽協会・Wikipedia の 現行演目一覧で 実在を 確かめました。
★★場面・役・分類は ★私が 作品の 中身から 組みました（★一覧の 写しでは ありません）"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from noh import N
from mk import W

# ═══ 例式 ═══
W("noh-okina.json", "翁", "能（例式）",
  ["翁", "千歳", "三番叟", ("囃子方", True), ("地謡", True), ("後見", True)],
  [("式", "★露払い（千歳の舞）", ["千歳", "囃子方", "地謡"]),
   ("式", "★★翁の舞（★面をつけて天下泰平を祈る）", ["翁", "千歳", "囃子方", "地謡"]),
   ("式", "★★三番叟（揉ノ段・鈴ノ段）", ["三番叟", "囃子方", "地謡"])],
  kind="noh", lang="ja", dur=25, sort="Noh",
  inst=[{"part": "笛（能管）", "count": 1, "section": "woodwind"},
        {"part": "小鼓", "count": 3, "section": "percussion", "note": "★★翁だけは 小鼓が 3人"},
        {"part": "大鼓", "count": 1, "section": "percussion"}],
  note="★★★能にして能にあらず ── ★儀式の 曲。★開催の いちばん 初めに 出します。"
       "★小鼓が 3人に なるのは この曲だけ。★楽屋での 作法も 特別です")

# ═══ 初番目物（脇能・神） ═══
N("noh-enoshima.json", "江野島", 1, "老人", "臣下", shite_go="江の島の神",
  place="相模・江の島", mai="舞働", taiko=True)
N("noh-kuseto.json", "九世戸", 1, "老人", "勅使", shite_go="文殊菩薩",
  place="丹後・天橋立", mai="神舞")
N("noh-shirinushi.json", "代主", 1, "老人", "臣下", shite_go="事代主の神",
  place="摂津・西宮", mai="神舞", al=["事代主"])
N("noh-tobosaku.json", "東方朔", 1, "東方朔", "漢の武帝の臣", mugen=False,
  tsure=["西王母"], place="唐土・漢の宮", mai="楽", taiko=True,
  note="★桃を 献じる 祝いの 曲")
N("noh-domyoji.json", "道明寺", 1, "老女", "旅僧", shite_go="観音の化身",
  place="河内・道明寺", mai="序ノ舞")
N("noh-fujisan.json", "富士山", 1, "里女", "勅使", shite_go="浅間の神（かぐや姫）",
  place="駿河・富士山", mai="天女ノ舞", taiko=True,
  note="★かぐや姫が 富士の 神と なる 話")
N("noh-goho.json", "合浦", 1, "老人", "唐の臣", shite_go="龍神",
  place="唐土・合浦", mai="舞働", taiko=True, note="★珠を 得る 話")

# ═══ 三番目物（鬘・女） ═══
N("noh-soshiarai-komachi.json", "草子洗小町", 3, "小野小町", "大伴黒主",
  mugen=False, tsure=["紀貫之"], waki_tsure=["帝"], place="京・宮中の歌合",
  mai="序ノ舞", dur=100,
  note="★★★歌を 盗んだと 疑われた 小町が ★草子を 洗って 証す。★小町物の中で 唯一 明るい 曲")

# ═══ 四番目物（雑） ═══
N("noh-aizomegawa.json", "藍染川", 4, "梅千代の母", "太宰府の神職",
  mugen=False, tsure=["梅千代（子）"], place="筑前・藍染川", mai="物狂い",
  note="★★母が 川に 身を 投げ、★天神の 力で 生き返る")
N("noh-utaura.json", "歌占", 4, "渡会の某（神職）", "旅人", mugen=False,
  tsure=["幸菊丸（子）"], place="加賀・白山", mai="★地獄の曲舞",
  note="★★★歌を 引いて 占う。★『地獄の曲舞』が 見せ場。★父と子の 名乗り")
N("noh-uchito-mode.json", "内外詣", 4, "里女", "旅僧", shite_go="女の霊",
  place="伊勢・内宮と外宮", mai="序ノ舞")
N("noh-kanyoden.json", "咸陽殿", 4, "始皇帝", "荊軻", mugen=False,
  tsure=["花陽夫人"], waki_tsure=["秦舞陽"], place="唐土・咸陽宮",
  mai="舞働", taiko=True, al=["咸陽宮"],
  note="★★琴の音で 刺客を 退ける。★『咸陽宮』の 名でも 出ます")
N("noh-kiso.json", "木曽", 4, "木曽義仲", "手塚太郎", mugen=False,
  tsure=["今井兼平"], place="信濃・木曽", mai="願書の読み上げ", taiko=True,
  note="★★願書（がんじょ）の 読み上げが 見せ場")
N("noh-kamo-monogurui.json", "加茂物狂", 4, "女（狂女）", "旅人", mugen=False,
  tsure=["子"], place="山城・賀茂", mai="物狂い")
N("noh-genzai-tadanori.json", "現在忠度", 4, "平忠度", "岡部六弥太", mugen=False,
  tsure=["従者"], place="摂津・一の谷", mai="カケリ", taiko=True,
  note="★『忠度』が 夢幻能、★これは 現在能 ── ★同じ 人の 話を 二通りに 見られます")
N("noh-sagi.json", "鷺", 4, "鷺", "帝", mugen=False, waki_tsure=["蔵人"],
  place="京・神泉苑", mai="★鷺乱（さぎみだれ）", taiko=True,
  note="★★★少年か 老人だけが 演じる 習い。★白一色の 装束")
N("noh-sansho.json", "三笑", 4, "慧遠禅師", "陶淵明", mugen=False,
  tsure=["陸修静"], place="唐土・廬山", mai="楽",
  note="★★三人が 笑い合う ── 明るい 曲")
N("noh-zenji-soga.json", "禅師曽我", 4, "禅師房", "曽我五郎", mugen=False,
  tsure=["曽我十郎"], place="相模・曽我", mai="カケリ")
N("noh-tsuchiguruma.json", "土車", 4, "父（狂人）", "旅僧", mugen=False,
  tsure=["子"], place="美濃", mai="物狂い・車を引く",
  note="★土車を 引いて 子を 探す")
N("noh-tokusa.json", "木賊", 4, "老人（父）", "旅僧", mugen=False,
  tsure=["松若（子）"], place="信濃・園原", mai="★木賊刈りの舞",
  note="★★父と 子の 再会")
N("noh-nishikido.json", "錦戸", 4, "錦戸太郎", "泉三郎忠衡", mugen=False,
  tsure=["伊達次郎"], place="陸奥・平泉", mai="カケリ", taiko=True)
N("noh-tadanobu.json", "忠信", 4, "佐藤忠信", "横川覚範", mugen=False,
  tsure=["静御前"], place="大和・吉野", mai="立廻り", taiko=True)
N("noh-nagara.json", "長柄", 4, "里女", "旅僧", shite_go="女の霊",
  place="摂津・長柄の橋", mai="序ノ舞", note="★人柱の 話")
N("noh-minase.json", "水無瀬", 4, "老人", "旅僧", shite_go="後鳥羽院の霊",
  place="摂津・水無瀬", mai="序ノ舞")
N("noh-minazuki-barae.json", "水無月祓", 4, "女（狂女）", "旅僧", mugen=False,
  place="京・下鴨／美濃", mai="物狂い・禊の舞",
  note="★六月の 祓（はらえ）を 背に した 曲")
N("noh-minobu.json", "身延", 4, "里女", "日蓮の弟子", shite_go="七面天女",
  place="甲斐・身延山", mai="舞働", taiko=True)
N("noh-rou-daiko.json", "籠太鼓", 4, "妻", "領主の臣", mugen=False,
  place="肥後", mai="★太鼓を打つ・物狂い",
  note="★★夫の 代わりに 牢に 入った 妻が ★太鼓を 打って 狂う")
N("noh-rinzo.json", "輪蔵", 4, "老人", "旅僧", shite_go="傅大士（ふだいし）",
  tsure=["童子"], place="唐土", mai="舞働", taiko=True,
  note="★経を 納める『輪蔵』の 由来")

# ═══ 五番目物（切・鬼） ═══
N("noh-koh-u.json", "項羽", 5, "船頭", "旅人", shite_go="項羽の霊",
  tsure=["虞氏の霊"], place="唐土・烏江", mai="舞働", taiko=True,
  note="★★虞美人草の 由来。★項羽と 虞氏の 別れ")
N("noh-kusanagi.json", "草薙", 5, "老人", "旅僧", shite_go="日本武尊の霊",
  place="駿河・焼津", mai="舞働", taiko=True, note="★草薙の剣の 由来")
N("noh-daibyo-shojo.json", "大瓶猩々", 5, "猩々", "高風", mugen=False,
  tsure=["猩々（二）", "猩々（三）"], place="唐土・潯陽江",
  mai="★★猩々乱（みだれ）", taiko=True,
  note="★★『猩々』の 大がかりな 形 ── ★大きな 瓶が 出て ★猩々が 何人も 出ます")
N("noh-daibutsu-kuyo.json", "大仏供養", 5, "悪七兵衛景清", "源頼朝", mugen=False,
  tsure=["母"], place="大和・東大寺", mai="立廻り", taiko=True)
N("noh-hiun.json", "飛雲", 5, "山伏", "旅僧", shite_go="天狗（飛雲坊）",
  place="山中", mai="舞働", taiko=True)
N("noh-takeyuki.json", "竹雪", 4, "月若（子）", "父", mugen=False,
  tsure=["継母"], place="越前", mai="★雪の中で竹を払う",
  note="★★継母に 雪の 夜 竹を 払わされる 子の 話")
N("noh-tsumado.json", "妻戸", 5, "老人", "旅僧", shite_go="住吉明神",
  place="摂津・住吉", mai="神舞")
N("noh-raiden.json", "雷電", 5, "菅原道真の霊", "法性坊僧正", mugen=False,
  place="比叡山／京・宮中", mai="★★雷神となって荒れる", taiko=True,
  note="★★★道真が 雷神と なる。★『来殿』とも 書きます", al=["来殿"])
