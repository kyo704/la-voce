# -*- coding: utf-8 -*-
"""★吹奏楽 と 合唱・宗教曲 の 追加"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from mk import W
C = ("合唱", True)

BAND = [{"part": "木管（フルート・オーボエ・クラリネット・サクソフォン・ファゴット）",
         "count": 0, "section": "woodwind", "note": "人数は団体ごと"},
        {"part": "金管（ホルン・トランペット・トロンボーン・ユーフォニアム・チューバ）",
         "count": 0, "section": "brass", "note": "人数は団体ごと"},
        {"part": "打楽器", "count": 0, "section": "percussion", "note": "人数は団体ごと"},
        {"part": "コントラバス", "count": 0, "section": "strings", "note": "入る団体のみ"}]

def BD(f, t, comp, scenes, *, y=None, dur=12, orig=None, al=None, note=None, sort=None):
    n = (note or "")
    n = n + (" ／ " if n else "") + "★★吹奏楽。★人数は 団体ごとに 変わります"
    return W(f, t, comp, [("吹奏楽（合奏）", True)],
             [("楽章・部分", lab, ["吹奏楽（合奏）"]) for lab in scenes],
             orig=orig, year=y, dur=dur, aliases=al, kind="band", lang="—",
             inst=BAND, note=n, sort=sort)

CH_ORCH = [{"part": "管弦楽", "count": 0, "section": "other", "note": "人数は公演ごと"}]
ORGAN = [{"part": "オルガン", "count": 1, "section": "keyboard"}]
ACAP = [{"part": "なし（無伴奏）", "count": 0, "section": "other",
         "note": "★アカペラ（伴奏なし）"}]

def CH(f, t, comp, roles, scenes, *, y=None, dur=40, orig=None, al=None, note=None,
       sort=None, lang="la", inst=None, ed=None):
    n = (note or "")
    n = n + (" ／ " if n else "") + "★★歌詞・対訳は 入れて いません"
    return W(f, t, comp, roles, scenes, orig=orig, year=y, dur=dur, aliases=al,
             kind="chorus", lang=lang, edition=ed, inst=inst or CH_ORCH, note=n, sort=sort)

# ════════ 吹奏楽 ════════
BD("bd-alvamar.json", "アルヴァマー序曲", "ジェイムズ・バーンズ",
   ["★一曲（序奏・主題・展開・再現）"], y=1981, dur=9, sort="Barnes, James",
   note="★★日本の 吹奏楽で 最も よく 演奏される 曲の 1つ")
BD("bd-barnes-sym3.json", "交響曲第3番", "ジェイムズ・バーンズ",
   ["第1楽章 レント〜アレグロ", "第2楽章 スケルツォ",
    "★★第3楽章 メスト（★亡くした娘に）", "第4楽章 フィナーレ"],
   y=1995, dur=42, sort="Barnes, James",
   note="★★★吹奏楽の 交響曲で 最も 重い 作品の 1つ")
BD("bd-dionysiaques.json", "ディオニソスの祭", "フローラン・シュミット",
   ["★一曲（ゆるやかな序奏と激しい祭）"], y=1913, dur=11,
   sort="Schmitt, Florent", note="★★フランス 吹奏楽の 古典。★難度が 高い")
BD("bd-hindemith-sym.json", "吹奏楽のための交響曲 変ロ調", "ヒンデミット",
   ["第1楽章 モデラート・パストラーレ", "第2楽章 テンポ・ディ・マルチア",
    "第3楽章 フーガ"], y=1951, dur=18, sort="Hindemith, Paul")
BD("bd-persichetti-6.json", "交響曲第6番（吹奏楽のための）", "パーシケッティ",
   ["第1楽章 アダージョ〜アレグロ", "第2楽章 アダージョ・ソステヌート",
    "第3楽章 アレグレット", "第4楽章 ヴィヴァーチェ"],
   y=1956, dur=17, sort="Persichetti, Vincent")
BD("bd-schwantner.json", "そしてどこにも山の姿はない", "ジョセフ・シュワントナー",
   ["★一曲（★奏者が声を出す部分があります）"], y=1977, dur=16,
   orig="…and the mountains rising nowhere", sort="Schwantner, Joseph",
   note="★★★奏者が 歌い・叫ぶ 指定が あります。★ピアノと 増幅が 入ります")
BD("bd-maslanka-4.json", "交響曲第4番（マスランカ）", "デイヴィッド・マスランカ",
   ["★一曲（切れ目なく続きます）"], y=1993, dur=28, sort="Maslanka, David")
BD("bd-ticheli-fantasy.json", "アメリカの民謡による幻想曲",
   "フランク・ティケリ", ["★一曲"], y=1995, dur=9, sort="Ticheli, Frank",
   al=["Fantasy on an American Folk Song"])
BD("bd-grainger-colonial.json", "植民地の歌", "パーシー・グレインジャー",
   ["★一曲"], y=1918, dur=9, orig="Colonial Song", sort="Grainger, Percy")
BD("bd-holst-festival-overture.json", "民衆のための祝典音楽", "グスタフ・ホルスト",
   ["★一曲"], y=1930, dur=11, orig="A Festival Overture",
   sort="Holst, Gustav")
BD("bd-vaughan-toccata.json", "トッカータ・マルツィアーレ", "ヴォーン・ウィリアムズ",
   ["★一曲"], y=1924, dur=5, orig="Toccata Marziale", sort="Vaughan Williams, Ralph")
BD("bd-jacob-william-byrd.json", "ウィリアム・バードの組曲", "ゴードン・ジェイコブ",
   ["1. アースル・イヤル", "2. パヴァーヌ", "3. ジグ", "4. ガリアルド",
    "5. 鐘", "6. ウォルシンガム"], y=1923, dur=18, sort="Jacob, Gordon")
BD("bd-reed-festival-prelude.json", "音楽祭のプレリュード", "アルフレッド・リード",
   ["★一曲"], y=1957, dur=9, orig="A Festival Prelude", sort="Reed, Alfred")
BD("bd-reed-russian.json", "ロシアのクリスマス音楽", "アルフレッド・リード",
   ["★一曲（★4つの部分が続きます）"], y=1944, dur=15,
   orig="Russian Christmas Music", sort="Reed, Alfred")
BD("bd-reed-el-camino.json", "エル・カミーノ・レアル", "アルフレッド・リード",
   ["★一曲（★ラテンの 舞曲の 形）"], y=1985, dur=8,
   orig="El Camino Real", sort="Reed, Alfred")
BD("bd-jager-nobilissima.json", "シンフォニア・ノビリッシマ", "ロバート・ジェイガー",
   ["★一曲"], y=1964, dur=8, sort="Jager, Robert")
BD("bd-whitacre-ghost.json", "ゴースト・トレイン", "エリック・ウィテカー",
   ["第1楽章 ゴースト・トレイン", "第2楽章 至る所の車輪",
    "第3楽章 モーテル・カリフォルニア"], y=1994, dur=13,
   orig="Ghost Train Triptych", sort="Whitacre, Eric")
BD("bd-ito-gloriosa.json", "交響曲第1番「グロリオーサ」", "伊藤康英",
   ["第1楽章 祈り", "第2楽章 唄", "★★第3楽章 祭り"],
   y=1990, dur=20, sort="Ito, Yasuhide",
   note="★★隠れキリシタンの 歌を もとに します")
BD("bd-nagao-warabeuta.json", "吹奏楽のためのラプソディ「わらべうた」",
   "長生淳", ["★一曲"], y=2003, dur=10, sort="Nagao, Jun")
BD("bd-tenkai.json", "たなばた（The Seventh Night of July）", "酒井格",
   ["★一曲"], y=1988, dur=9, sort="Sakai, Itaru",
   note="★★★作曲者が 高校生の ときに 書いた 曲")
BD("bd-tanaka-la-folia.json", "交響組曲「ラ・フォリア」",
   "田中賢",
   ["★一曲"], y=1990, dur=9, sort="Tanaka, Ken")
BD("bd-hoshina-divertimento.json", "ディヴェルティメント（吹奏楽のための）", "保科洋",
   ["第1楽章", "第2楽章", "第3楽章"], y=1989, dur=13, sort="Hoshina, Hiroshi")
BD("bd-hoshina-fuko.json", "風紋", "保科洋",
   ["★一曲（★原典版と 改訂版が あります）"], y=1987, dur=9, sort="Hoshina, Hiroshi",
   note="★★★原典版と 全国大会版（短縮）で 長さが 違います")
BD("bd-taruya-murdoch.json", "マードックからの最後の手紙", "樽屋雅徳",
   ["★一曲"], y=2007, dur=8, sort="Taruya, Masanori",
   note="★タイタニックの 話を 元に します")
BD("bd-omens-of-love.json", "オーメンズ・オブ・ラブ", "T-SQUARE（真島俊夫 編）",
   ["★一曲"], y=1985, dur=5, sort="Masashima, Toshio",
   note="★★吹奏楽で 広く 演奏される ポピュラー曲の 編曲")
BD("bd-sparke-year-dragon.json", "ドラゴンの年", "フィリップ・スパーク",
   ["第1楽章 トッカータ", "第2楽章 インターリュード", "第3楽章 フィナーレ"],
   y=1984, dur=13, orig="The Year of the Dragon", sort="Sparke, Philip",
   note="★★もとは 金管バンドのための 曲。★吹奏楽版も 広く 演奏されます")
BD("bd-sparke-dance-movements.json", "ダンス・ムーヴメント", "フィリップ・スパーク",
   ["1. リトミコ", "2. モルト・ヴィヴォ", "3. レント", "4. モルト・リトミコ"],
   y=1996, dur=18, orig="Dance Movements", sort="Sparke, Philip")
BD("bd-vanderroost-spartacus.json", "スパルタクス（吹奏楽）", "ヤン・ヴァンデルロースト",
   ["★一曲"], y=1988, dur=12, sort="Van der Roost, Jan")
BD("bd-vanderroost-flashing.json", "アルセナール", "ヤン・ヴァンデルロースト",
   ["★一曲（行進曲）"], y=1996, dur=5, orig="Arsenal", sort="Van der Roost, Jan")
BD("bd-canterbury-chorale.json", "カンタベリー・コラール", "ヤン・ヴァンデルロースト",
   ["★一曲"], y=1991, dur=7, orig="Canterbury Chorale", sort="Van der Roost, Jan")
BD("bd-smith-variations.json", "ルイ・ブルジョワの讃美歌による変奏曲",
   "クロード・トーマス・スミス", ["★一曲"], y=1975, dur=9, sort="Smith, Claude T.")
BD("bd-chance-incantation.json", "呪文と踊り", "ジョン・バーンズ・チャンス",
   ["★一曲（呪文〜踊り）"], y=1960, dur=9, orig="Incantation and Dance",
   sort="Chance, John Barnes")
BD("bd-chance-variations-korean.json", "朝鮮民謡の主題による変奏曲", "ジョン・バーンズ・チャンス",
   ["★一曲（主題と5つの変奏）"], y=1965, dur=9,
   orig="Variations on a Korean Folk Song", sort="Chance, John Barnes")
BD("bd-husa-music-prague.json", "プラハのための音楽1968", "カレル・フサ",
   ["1. 序奏とファンファーレ", "2. アリア", "3. インテルメッツォ", "4. トッカータとコラール"],
   y=1968, dur=22, orig="Music for Prague 1968", sort="Husa, Karel",
   note="★★★ソ連の 侵攻に 抗した 曲。★★チェコでは 長く 演奏できませんでした")
BD("bd-copland-emblems.json", "エンブレムズ", "コープランド",
   ["★一曲"], y=1964, dur=11, orig="Emblems", sort="Copland, Aaron")
BD("bd-bernstein-divertimento.json", "ディヴェルティメント（吹奏楽版）", "バーンスタイン",
   ["1. セネッツとタケッツ", "2. ワルツ", "3. マズルカ", "4. サンバ", "5. ターキー・トロット",
    "6. スフィンクス", "7. ブルース", "8. In memoriam〜行進曲"],
   y=1980, dur=16, sort="Bernstein, Leonard")
BD("bd-nixon-fiesta.json", "フィエスタ・デル・パシフィコ", "ロジャー・ニクソン",
   ["★一曲"], y=1966, dur=8, sort="Nixon, Roger")
BD("bd-hisaishi-band.json", "吹奏楽のための「もののけ姫」ほか 編曲集", "久石譲（編曲者は版ごと）",
   ["★選んで 組みます（★曲は 公演ごと）"], dur=0, sort="Hisaishi, Joe",
   note="★★★編曲版です。★★上演には 権利の 確認が 要ります")

# ════════ 合唱・宗教曲 ════════
SATB = ["ソプラノ独唱", "アルト独唱", "テノール独唱", "バス独唱", C]
CH("ch-monteverdi-vespro.json", "聖母マリアの夕べの祈り", "モンテヴェルディ",
   SATB, [("―", "★ドミネ・アド・アジュヴァンドゥム", ["合唱"]),
          ("―", "ディキシト・ドミヌス", ["合唱"]),
          ("―", "★ニグラ・スム（テノール独唱）", ["テノール独唱"]),
          ("―", "ラウダーテ・プエリ", ["合唱"]),
          ("―", "★プルクラ・エス（ソプラノ二重唱）", ["ソプラノ独唱", "アルト独唱"]),
          ("―", "ラエタートゥス・スム", ["合唱"]),
          ("―", "★ドゥオ・セラフィム（テノール三重唱）", ["テノール独唱"]),
          ("―", "ニシ・ドミヌス", ["合唱"]),
          ("―", "★アウディ・チェルム", ["テノール独唱", "合唱"]),
          ("―", "ラウダ・イェルザレム", ["合唱"]),
          ("―", "★★ソナタ・ソプラ・サンクタ・マリア", ["合唱"]),
          ("―", "アヴェ・マリス・ステラ", ["合唱"]),
          ("―", "★★マニフィカト", ["ソプラノ独唱", "アルト独唱", "テノール独唱", "バス独唱", "合唱"])],
   y=1610, dur=110, orig="Vespro della Beata Vergine", sort="Monteverdi, Claudio",
   note="★★★編成と 曲の 組み方に いくつもの 考え方が あります",
   ed="★版と 校訂で 中身が 変わります")
CH("ch-schutz-passion.json", "マタイ受難曲（シュッツ）", "シュッツ",
   ["福音史家（テノール）", "イエス（バス）", "ペテロ", "ピラト", C],
   [("第1部", "★福音史家の語り", ["福音史家（テノール）"]),
    ("第1部", "最後の晩餐", ["イエス（バス）", "福音史家（テノール）", "合唱"]),
    ("第2部", "★ペテロの否認", ["ペテロ", "福音史家（テノール）", "合唱"]),
    ("第2部", "★ピラトの前", ["ピラト", "イエス（バス）", "合唱"]),
    ("第2部", "★★十字架と結びの合唱", ["イエス（バス）", "福音史家（テノール）", "合唱"])],
   y=1666, dur=70, sort="Schütz, Heinrich", inst=ACAP,
   note="★★★伴奏なし（無伴奏）の 受難曲")
CH("ch-bach-bwv227.json", "モテット『イエスよ、わが喜び』BWV227", "J.S.バッハ",
   [C], [("―", "1. イエスよ、わが喜び", ["合唱"]),
         ("―", "2. それゆえ今や罪に定めはない", ["合唱"]),
         ("―", "3. 汝のもとに", ["合唱"]),
         ("―", "4. 肉によらず霊によって", ["合唱"]),
         ("―", "★★5. 汝の霊がある以上", ["合唱"]),
         ("―", "6. されど汝らは肉によらず", ["合唱"]),
         ("―", "7. さらばよ、罪の生", ["合唱"]),
         ("―", "8. されど死すべき体に", ["合唱"]),
         ("―", "9. さらばよ、うつろな栄華", ["合唱"]),
         ("―", "10. 善き夜よ、おお存在よ", ["合唱"]),
         ("―", "11. 汝の霊がある以上（再）", ["合唱"])],
   y=1723, dur=22, orig="Jesu, meine Freude BWV227", lang="de",
   sort="Bach, Johann Sebastian", inst=ACAP,
   note="★★★バッハの モテットで 最も 長い もの。★左右対称に 組まれています")
CH("ch-bach-singet.json", "モテット『主に向かって新しい歌を歌え』BWV225", "J.S.バッハ",
   [C], [("―", "1. 主に向かって新しい歌を歌え", ["合唱"]),
         ("―", "2. コラールとアリア", ["合唱"]),
         ("―", "★★3. 主をほめたたえよ（二重フーガ）", ["合唱"])],
   y=1727, dur=17, orig="Singet dem Herrn ein neues Lied BWV225", lang="de",
   sort="Bach, Johann Sebastian", inst=ACAP,
   note="★★★二重合唱（8声）。★モーツァルトが 聴いて 驚いたと 伝えます")
CH("ch-haydn-seven-words.json", "十字架上の七つの言葉（合唱版）", "ハイドン",
   SATB, [("導入", "★導入", ["合唱"]),
          ("第1", "父よ、彼らを赦してください", ["合唱"]),
          ("第2", "今日、あなたは私と共に", ["ソプラノ独唱", "合唱"]),
          ("第3", "女よ、これがあなたの子です", ["アルト独唱", "合唱"]),
          ("第4", "★わが神、なぜ私を捨てたのですか", ["合唱"]),
          ("第5", "私は渇く", ["テノール独唱", "合唱"]),
          ("第6", "成し遂げられた", ["バス独唱", "合唱"]),
          ("第7", "父よ、わが霊を委ねます", ["合唱"]),
          ("終", "★★地震", ["合唱"])],
   y=1796, dur=65, sort="Haydn, Joseph",
   ed="★★管弦楽版・弦楽四重奏版・合唱版が あります")
CH("ch-mendelssohn-lobgesang.json", "讃歌 作品52（交響曲第2番）", "メンデルスゾーン",
   ["ソプラノ独唱", "ソプラノ独唱（二）", "テノール独唱", C],
   [("第1部", "★管弦楽の序（3つの部分）", ["合唱"]),
    ("第2部", "★すべて息あるものは主をほめよ", ["ソプラノ独唱", "合唱"]),
    ("第2部", "★見張りの人よ、夜は明けたか", ["テノール独唱", "ソプラノ独唱（二）"]),
    ("第2部", "★★コラール『今こそみな神に感謝せよ』", ["合唱"]),
    ("第2部", "★★終曲", ["ソプラノ独唱", "テノール独唱", "合唱"])],
   y=1840, dur=65, lang="de", orig="Lobgesang op.52", sort="Mendelssohn, Felix",
   al=["交響曲第2番（メンデルスゾーン）"])
CH("ch-liszt-christus.json", "キリスト", "リスト",
   SATB, [("第1部", "降誕の 牧歌", ["合唱"]),
          ("第1部", "★羊飼いの歌", ["ソプラノ独唱", "合唱"]),
          ("第2部", "★主の祈り・受難", ["バス独唱", "合唱"]),
          ("第3部", "★★復活", ["合唱"])],
   y=1866, dur=180, orig="Christus", sort="Liszt, Franz",
   note="★★★3時間近い 大作。★全曲上演は 稀")
CH("ch-bruckner-te-deum.json", "テ・デウム（ブルックナー）", "ブルックナー",
   SATB, [("―", "★テ・デウム・ラウダームス", ["合唱"]),
          ("―", "テ・エルゴ・クェーズムス", ["ソプラノ独唱", "アルト独唱", "テノール独唱", "バス独唱"]),
          ("―", "★アエテルナ・ファク", ["合唱"]),
          ("―", "サルヴム・ファク", ["テノール独唱", "合唱"]),
          ("―", "★★イン・テ・ドミネ・スペラーヴィ（フーガ）", ["合唱"])],
   y=1884, dur=24, sort="Bruckner, Anton")
CH("ch-bruckner-mass-3.json", "ミサ曲第3番 ヘ短調（ブルックナー）", "ブルックナー",
   SATB, [("―", "キリエ", ["合唱"]), ("―", "グローリア", ["合唱"]),
          ("―", "★クレド", ["ソプラノ独唱", "合唱"]),
          ("―", "サンクトゥス", ["合唱"]),
          ("―", "★ベネディクトゥス", ["ソプラノ独唱", "アルト独唱", "合唱"]),
          ("―", "★★アニュス・デイ", ["合唱"])],
   y=1868, dur=58, sort="Bruckner, Anton", al=["大ミサ曲"])
CH("ch-bruckner-motets.json", "ブルックナー モテット集", "ブルックナー",
   [C], [("―", "★アヴェ・マリア（1861）", ["合唱"]),
         ("―", "★ロクス・イステ", ["合唱"]),
         ("―", "オス・ユスティ", ["合唱"]),
         ("―", "★★クリストゥス・ファクトゥス・エスト", ["合唱"]),
         ("―", "ヴィルガ・イェッセ", ["合唱"]),
         ("―", "エッチェ・サチェルドス", ["合唱"])],
   dur=30, sort="Bruckner, Anton", inst=ACAP,
   note="★★大半が 無伴奏。★『エッチェ・サチェルドス』は 金管と オルガンつき")
CH("ch-poulenc-stabat.json", "スターバト・マーテル（プーランク）", "プーランク",
   ["ソプラノ独唱", C], [("―", "★全12曲（★曲名は 入れて いません）", ["ソプラノ独唱", "合唱"])],
   y=1950, dur=32, sort="Poulenc, Francis",
   note="★★曲名を 全部 確かめられなかったので ★曲数（12曲）だけ 持ちます")
CH("ch-poulenc-figure-humaine.json", "人間の顔", "プーランク",
   [C], [("―", "★全8曲（★曲名は 入れて いません）", ["合唱"])],
   y=1943, dur=20, orig="Figure humaine", lang="fr", sort="Poulenc, Francis",
   inst=ACAP,
   note="★★★二重合唱・無伴奏。★★占領下に ひそかに 書かれ、終曲は『自由』。"
        "★曲数（8曲）だけ 持ちます")
CH("ch-durufle-motets.json", "グレゴリオ聖歌の主題による4つのモテット", "デュリュフレ",
   [C], [("―", "1. ウビ・カリタス", ["合唱"]),
         ("―", "2. トタ・プルクラ・エス", ["合唱"]),
         ("―", "3. トゥ・エス・ペトルス", ["合唱"]),
         ("―", "4. タントゥム・エルゴ", ["合唱"])],
   y=1960, dur=10, sort="Duruflé, Maurice", inst=ACAP)
CH("ch-britten-war-requiem.json", "戦争レクイエム 作品66", "ブリテン",
   ["ソプラノ独唱", "テノール独唱", "バリトン独唱", C, ("児童合唱", True)],
   [("―", "1. レクイエム・エテルナム", ["合唱", "児童合唱", "テノール独唱"]),
    ("―", "★2. ディエス・イレ", ["ソプラノ独唱", "バリトン独唱", "テノール独唱", "合唱"]),
    ("―", "3. オフェルトリウム", ["テノール独唱", "バリトン独唱", "合唱", "児童合唱"]),
    ("―", "4. サンクトゥス", ["ソプラノ独唱", "合唱"]),
    ("―", "5. アニュス・デイ", ["テノール独唱", "合唱"]),
    ("―", "★★6. リベラ・メ（★『奇妙な出会い』と 結び）",
     ["テノール独唱", "バリトン独唱", "ソプラノ独唱", "合唱", "児童合唱"])],
   y=1962, dur=85, orig="War Requiem op.66", sort="Britten, Benjamin",
   note="★★★ラテン語の 典礼文と ★ウィルフレッド・オーウェンの 英語の 詩を 交互に 置きます。"
        "★★大管弦楽・室内合奏・オルガン・児童合唱を 別の 場所に 置きます",
   inst=[{"part": "大管弦楽", "count": 0, "section": "other", "note": "人数は公演ごと"},
         {"part": "室内合奏（12人）", "count": 12, "section": "other"},
         {"part": "オルガン", "count": 1, "section": "keyboard"}])
CH("ch-britten-ceremony-carols.json", "キャロルの祭典 作品28", "ブリテン",
   [("児童合唱（または女声合唱）", True)],
   [("―", "1. プロセッション", ["児童合唱（または女声合唱）"]),
    ("―", "2. ウォルカム・ユール", ["児童合唱（または女声合唱）"]),
    ("―", "3. 過ぎし日に", ["児童合唱（または女声合唱）"]),
    ("―", "★4. 小さな薔薇が生まれた", ["児童合唱（または女声合唱）"]),
    ("―", "5. バラード", ["児童合唱（または女声合唱）"]),
    ("―", "★★6. この小さな赤子", ["児童合唱（または女声合唱）"]),
    ("―", "7. 間奏曲（ハープ独奏）", ["児童合唱（または女声合唱）"]),
    ("―", "8. 凍てつく冬に", ["児童合唱（または女声合唱）"]),
    ("―", "9. 春のキャロル", ["児童合唱（または女声合唱）"]),
    ("―", "10. デオ・グラティアス", ["児童合唱（または女声合唱）"]),
    ("―", "11. レセッション", ["児童合唱（または女声合唱）"])],
   y=1942, dur=23, orig="A Ceremony of Carols op.28", lang="en",
   sort="Britten, Benjamin",
   note="★★ハープ 1台の 伴奏。★行列で 入り、行列で 去ります",
   inst=[{"part": "ハープ", "count": 1, "section": "strings"}])
CH("ch-tippett-child-time.json", "われらの時代の子", "ティペット",
   SATB, [("第1部", "★世界の嘆き", ["合唱"]),
          ("第2部", "★少年の物語と迫害", ["テノール独唱", "ソプラノ独唱", "合唱"]),
          ("第3部", "★★和解（★黒人霊歌が コラールの 位置に 置かれます）",
           ["ソプラノ独唱", "アルト独唱", "テノール独唱", "バス独唱", "合唱"])],
   y=1944, dur=65, orig="A Child of Our Time", lang="en", sort="Tippett, Michael",
   note="★★★バッハの 受難曲の コラールの 位置に ★黒人霊歌（Steal away ほか）を 置きます")
CH("ch-rachmaninov-vespers.json", "晩祷 作品37", "ラフマニノフ",
   ["アルト独唱", "テノール独唱", C],
   [("―", "★全15曲（★曲名は 入れて いません）", ["アルト独唱", "テノール独唱", "合唱"])],
   y=1915, dur=65, orig="Всенощное бдение op.37", lang="ru",
   sort="Rachmaninov, Sergei", inst=ACAP,
   note="★★★無伴奏。★★バスに 極めて 低い 音（下のB♭）が 求められます。"
        "★曲数（15曲）だけ 持ちます", al=["徹夜祷"])
CH("ch-rachmaninov-liturgy.json", "聖ヨハネス・クリソストモスの典礼 作品31", "ラフマニノフ",
   [C], [("―", "★全20曲（★曲名は 入れて いません）", ["合唱"])],
   y=1910, dur=70, lang="ru", sort="Rachmaninov, Sergei", inst=ACAP,
   note="★★無伴奏。★曲数（20曲）だけ 持ちます")
CH("ch-tchaikovsky-liturgy.json", "聖ヨハネス・クリソストモスの典礼 作品41", "チャイコフスキー",
   [C], [("―", "★全15曲（★曲名は 入れて いません）", ["合唱"])],
   y=1878, dur=55, lang="ru", sort="Tchaikovsky, Pyotr", inst=ACAP)
CH("ch-orff-catulli.json", "カトゥーリ・カルミナ", "オルフ",
   ["ソプラノ独唱", "テノール独唱", C],
   [("前戯", "★★若者と娘の戯れ（★老人たちの警告）", ["合唱"]),
    ("第1幕", "カトゥルスとレスビア", ["ソプラノ独唱", "テノール独唱", "合唱"]),
    ("第2幕", "★裏切り", ["ソプラノ独唱", "テノール独唱", "合唱"]),
    ("第3幕", "★★終曲", ["合唱"])],
   y=1943, dur=40, orig="Catulli Carmina", sort="Orff, Carl",
   note="★★★4台の ピアノと 打楽器だけ。★弦も 管も ありません。"
        "★『カルミナ・ブラーナ』と 三部作を なします",
   inst=[{"part": "ピアノ", "count": 4, "section": "keyboard"},
         {"part": "打楽器", "count": 0, "section": "percussion", "note": "人数は公演ごと"}])
CH("ch-stravinsky-mass.json", "ミサ曲（ストラヴィンスキー）", "ストラヴィンスキー",
   [C], [("―", "キリエ", ["合唱"]), ("―", "グローリア", ["合唱"]),
         ("―", "クレド", ["合唱"]), ("―", "サンクトゥス", ["合唱"]),
         ("―", "アニュス・デイ", ["合唱"])],
   y=1948, dur=17, sort="Stravinsky, Igor",
   note="★★管楽器 10本だけの 伴奏。★児童合唱を 用いる 指定が あります",
   inst=[{"part": "オーボエ", "count": 2, "section": "woodwind"},
         {"part": "イングリッシュホルン", "count": 1, "section": "woodwind"},
         {"part": "ファゴット", "count": 2, "section": "woodwind"},
         {"part": "トランペット", "count": 2, "section": "brass"},
         {"part": "トロンボーン", "count": 3, "section": "brass"}])
CH("ch-bernstein-chichester.json", "チチェスター詩篇", "バーンスタイン",
   [("少年独唱（またはカウンターテナー）", True), C],
   [("第1楽章", "詩篇108・100", ["合唱"]),
    ("第2楽章", "★★詩篇23（少年独唱）・詩篇2", ["少年独唱（またはカウンターテナー）", "合唱"]),
    ("第3楽章", "★詩篇131・133", ["合唱"])],
   y=1965, dur=20, orig="Chichester Psalms", lang="he", sort="Bernstein, Leonard",
   note="★★★ヘブライ語で 歌います。★第2楽章の 独唱は ★少年（変声前）または カウンターテナー")
CH("ch-lauridsen-lux.json", "永遠の光", "モーテン・ラウリゼン",
   [C], [("―", "1. イントロイトゥス", ["合唱"]),
         ("―", "2. イン・テ・ドミネ・スペラーヴィ", ["合唱"]),
         ("―", "★3. オー・ノータ・ルクス", ["合唱"]),
         ("―", "★★4. ヴェニ・サンクテ・スピリトゥス", ["合唱"]),
         ("―", "5. アニュス・デイ〜ルクス・エテルナ", ["合唱"])],
   y=1997, dur=38, orig="Lux Aeterna", sort="Lauridsen, Morten")
CH("ch-whitacre-choral.json", "ウィテカー 合唱曲集", "エリック・ウィテカー",
   [C], [("―", "★選んで 組みます（★曲は 公演ごと）", ["合唱"])],
   dur=0, lang="en", sort="Whitacre, Eric", inst=ACAP,
   note="★★★1つの 曲集では ありません。★『Lux Aurumque』『Sleep』『Water Night』"
        "などを 選んで 組みます。★★上演には 権利の 確認が 要ります")
CH("ch-hikaru-sabaku.json", "光る砂漠", "萩原英彦",
   [C], [("―", "★全8曲（★曲名は 入れて いません）", ["合唱"])],
   y=1961, dur=25, lang="ja", sort="Hagiwara, Hidehiko", inst=ACAP,
   note="★★無伴奏 混声合唱。★曲数（8曲）だけ 持ちます")
CH("ch-tanaka-yuki.json", "季節へのまなざし", "鈴木輝昭",
   [C], [("―", "★選んで 組みます（★曲は 公演ごと）", ["合唱"])],
   dur=0, lang="ja", sort="Suzuki, Teruaki",
   note="★★★いま 書かれている 作曲家。★★上演には 権利の 確認が 要ります")
CH("ch-takata-hotaru.json", "吹雪の街を", "高嶋みどり",
   [C], [("―", "★全5曲（★曲名は 入れて いません）", ["合唱"])],
   dur=20, lang="ja", sort="Takashima, Midori",
   note="★★曲数（5曲）だけ 持ちます")
CH("ch-shin-ichiro.json", "唱歌・童謡による合唱曲集", "編曲者は版ごと",
   [C], [("―", "★選んで 組みます（★曲は 公演ごと）", ["合唱"])],
   dur=0, lang="ja", sort="Shoka gassho",
   note="★★★編曲版です。★『ふるさと』『赤とんぼ』『夏の思い出』などを 選んで 組みます")
