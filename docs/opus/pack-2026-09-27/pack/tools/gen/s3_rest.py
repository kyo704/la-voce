# -*- coding: utf-8 -*-
"""★歌曲集 ── ロシア・イギリス・スペイン・アメリカ・イタリア・日本"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from sc import SC

# ═══ ロシア ═══
R = dict(lang="ru")
SC("mussorgsky-songs-dances-death.json", "死の歌と踊り", "ムソルグスキー",
   ["1. 子守歌（Колыбельная）", "2. セレナード（Серенада）",
    "3. トレパーク（Трепак）", "4. 司令官（Полководец）"],
   orig="Песни и пляски смерти", y=1877, dur=20, poet="ゴレニシチェフ＝クトゥーゾフ",
   sort="Mussorgsky, Modest", sid="mussorgsky-death", **R,
   note="★★★低い声のための 大作。★管弦楽版（ショスタコーヴィチ編ほか）も あります")
SC("mussorgsky-nursery.json", "子供部屋", "ムソルグスキー",
   [], n_songs=7, orig="Детская", y=1872, dur=17,
   sort="Mussorgsky, Modest", sid="mussorgsky-nursery", **R,
   note="★★子どもの 言葉を そのまま 歌にした 曲集")
SC("mussorgsky-sunless.json", "日の光もなく", "ムソルグスキー",
   [], n_songs=6, orig="Без солнца", y=1874, dur=20,
   poet="ゴレニシチェフ＝クトゥーゾフ", sort="Mussorgsky, Modest",
   sid="mussorgsky-sunless", **R)
SC("rachmaninov-op34.json", "14の歌 作品34", "ラフマニノフ",
   [], n_songs=14, orig="14 романсов op.34", y=1912, dur=45,
   sort="Rachmaninov, Sergei", sid="rachmaninov-op34", **R,
   note="★★★第14曲が『ヴォカリーズ』── ★歌詞の ない 歌。★単独で よく 歌われます")
SC("rachmaninov-op38.json", "6つの歌 作品38", "ラフマニノフ",
   [], n_songs=6, orig="6 стихотворений op.38", y=1916, dur=20,
   sort="Rachmaninov, Sergei", sid="rachmaninov-op38", **R,
   note="★ラフマニノフ 最後の 歌曲集")
SC("tchaikovsky-op6.json", "6つのロマンス 作品6", "チャイコフスキー",
   [], n_songs=6, orig="6 романсов op.6", y=1869, dur=18,
   sort="Tchaikovsky, Pyotr", sid="tchaikovsky-op6", **R,
   note="★★★第6曲『ただ憧れを知る者だけが』が 名高い")
SC("shostakovich-jewish.json", "ユダヤの民族詩より 作品79", "ショスタコーヴィチ",
   [], n_songs=11, orig="Из еврейской народной поэзии op.79", y=1948, dur=25,
   sort="Shostakovich, Dmitri", sid="shostakovich-op79", **R,
   note="★★★ソプラノ・アルト・テノールの 3人と ピアノ。★書かれてから 7年 発表できませんでした",
   voice="ソプラノ・アルト・テノール")
SC("shostakovich-michelangelo.json", "ミケランジェロの詩による組曲 作品145", "ショスタコーヴィチ",
   [], n_songs=11, orig="Сюита на слова Микеланджело op.145", y=1974, dur=42,
   sort="Shostakovich, Dmitri", sid="shostakovich-op145", **R,
   note="★★バス（低い声）のための 大作。★管弦楽版も あります")

# ═══ イギリス ═══
E = dict(lang="en")
SC("vaughan-williams-songs-travel.json", "旅の歌", "ヴォーン・ウィリアムズ",
   ["1. 放浪者（The Vagabond）", "2. ぼくをおいて行くのか（Let Beauty Awake）",
    "3. 街道（The Roadside Fire）", "4. 若く美しい人よ（Youth and Love）",
    "5. 夢のなかで（In Dreams）", "6. 無限の星空（The Infinite Shining Heavens）",
    "7. 明るい炎はもう燃えず（Whither Must I Wander?）",
    "8. 輝く星よ（Bright is the Ring of Words）",
    "9. ぼくは旅を続ける（I Have Trod the Upward and the Downward Slope）"],
   orig="Songs of Travel", y=1904, dur=25, poet="スティーヴンソン",
   sort="Vaughan Williams, Ralph", sid="vw-songs-travel", **E,
   note="★★バリトンのための 曲。★管弦楽版も あります")
SC("vaughan-williams-wenlock.json", "ウェンロックの断崖で", "ヴォーン・ウィリアムズ",
   [], n_songs=6, orig="On Wenlock Edge", y=1909, dur=22, poet="ハウスマン",
   sort="Vaughan Williams, Ralph", sid="vw-wenlock", **E,
   note="★★テノールと 弦楽四重奏と ピアノ",
   inst=[{"part": "弦楽四重奏", "count": 4, "section": "strings"},
         {"part": "ピアノ", "count": 1, "section": "keyboard"}])
SC("butterworth-shropshire.json", "シュロップシャーの若者", "バタワース",
   [], n_songs=6, orig="Six Songs from A Shropshire Lad", y=1911, dur=15,
   poet="ハウスマン", sort="Butterworth, George", sid="butterworth-shropshire", **E)
SC("finzi-let-us-garlands.json", "花輪をささげよう 作品18", "フィンジ",
   ["1. 来たれ、死よ（Come Away, Come Away, Death）",
    "2. 恋人がいるなら（Who Is Silvia?）",
    "3. 恐れるな（Fear No More the Heat o’ the Sun）",
    "4. おお、恋人よ（O Mistress Mine）",
    "5. 吹けよ、冬の風（Blow, Blow, Thou Winter Wind）"],
   orig="Let Us Garlands Bring op.18", y=1942, dur=15, poet="シェイクスピア",
   sort="Finzi, Gerald", sid="finzi-op18", **E)
SC("britten-illuminations.json", "イリュミナシオン 作品18", "ブリテン",
   [], n_songs=9, orig="Les Illuminations op.18", y=1939, dur=22,
   poet="ランボー", sort="Britten, Benjamin", sid="britten-op18", lang="fr",
   note="★★★高い声（ソプラノまたはテノール）と 弦楽合奏。★歌詞は フランス語",
   inst=[{"part": "弦楽合奏", "count": 0, "section": "strings",
          "note": "人数は公演ごと"}])
SC("britten-serenade.json", "セレナード 作品31", "ブリテン",
   ["1. プロローグ（Prologue・ホルン独奏）", "2. パストラル（Pastoral）",
    "3. ノクターン（Nocturne）", "4. エレジー（Elegy）", "5. 挽歌（Dirge）",
    "6. 讃歌（Hymn）", "7. ソネット（Sonnet）",
    "8. エピローグ（Epilogue・舞台裏のホルン）"],
   orig="Serenade for Tenor, Horn and Strings op.31", y=1943, dur=25,
   sort="Britten, Benjamin", sid="britten-op31", **E,
   note="★★★テノール・ホルン・弦楽。★プロローグと エピローグは ホルンの 自然倍音だけで 吹きます",
   inst=[{"part": "ホルン", "count": 1, "section": "brass"},
         {"part": "弦楽合奏", "count": 0, "section": "strings", "note": "人数は公演ごと"}])
SC("britten-michelangelo.json", "ミケランジェロの7つのソネット 作品22", "ブリテン",
   [], n_songs=7, orig="Seven Sonnets of Michelangelo op.22", y=1940, dur=20,
   sort="Britten, Benjamin", sid="britten-op22", lang="it",
   note="★★テノールのための 曲。★歌詞は イタリア語")
SC("britten-nocturne.json", "ノクターン 作品60", "ブリテン",
   [], n_songs=8, orig="Nocturne op.60", y=1958, dur=26,
   sort="Britten, Benjamin", sid="britten-op60", **E,
   note="★★テノールと 7つの 独奏楽器と 弦楽。★曲ごとに 受け持つ 楽器が 変わります",
   inst=[{"part": "独奏楽器7（フルート・イングリッシュホルン・クラリネット・ファゴット・ホルン・ティンパニ・ハープ）",
          "count": 7, "section": "other"},
         {"part": "弦楽合奏", "count": 0, "section": "strings"}])

# ═══ スペイン ═══
S = dict(lang="es")
SC("falla-siete-canciones.json", "7つのスペイン民謡", "ファリャ",
   ["1. ムーア人の織物（El paño moruno）", "2. ムルシア地方のセギディーリャ（Seguidilla murciana）",
    "3. アストゥリアーナ（Asturiana）", "4. ホタ（Jota）", "5. ナナ（子守歌・Nana）",
    "6. 歌（Canción）", "7. ポロ（Polo）"],
   orig="Siete canciones populares españolas", y=1914, dur=13,
   sort="Falla, Manuel de", sid="falla-siete", **S,
   note="★★★スペイン歌曲で 最も よく 歌われる 曲集")
SC("granados-tonadillas.json", "トナディーリャス", "グラナドス",
   [], n_songs=12, orig="Tonadillas en estilo antiguo", y=1913, dur=25,
   sort="Granados, Enrique", sid="granados-tonadillas", **S,
   note="★★『粋な男の死を嘆くマハ』が 名高い")
SC("rodrigo-cuatro-madrigales.json", "4つの愛のマドリガル", "ロドリーゴ",
   ["1. あの娘は金髪（¿Con qué la lavaré?）",
    "2. 白い雪から生まれた人（Vos me matásteis）",
    "3. お母さん、わたしは（De los álamos vengo, madre）",
    "4. あなたはわたしを殺した（De dónde venís, amore?）"],
   orig="Cuatro madrigales amatorios", y=1948, dur=8,
   sort="Rodrigo, Joaquín", sid="rodrigo-madrigales", **S,
   note="★★16世紀の 歌を もとに した 曲")
SC("montsalvatge-cinco-canciones.json", "黒人の歌5つ", "モンサルバーチェ",
   ["1. キューバの子守歌（Cuba dentro de un piano）",
    "2. ハバナの女（Punto de habanera）", "3. 黒人の歌（Chévere）",
    "4. 黒人の子への子守歌（Canción de cuna para dormir a un negrito）",
    "5. 黒人の歌の歌（Canto negro）"],
   orig="Cinco canciones negras", y=1945, dur=13,
   sort="Montsalvatge, Xavier", sid="montsalvatge-negras", **S)

# ═══ アメリカ ═══
SC("barber-hermit-songs.json", "隠者の歌 作品29", "バーバー",
   [], n_songs=10, orig="Hermit Songs op.29", y=1953, dur=18,
   poet="8〜13世紀のアイルランドの僧の書きこみ",
   sort="Barber, Samuel", sid="barber-op29", **E,
   note="★★初演は レオンタイン・プライスと 作曲者の ピアノ")
SC("barber-knoxville.json", "ノックスヴィル 1915年夏 作品24", "バーバー",
   [], n_songs=1, orig="Knoxville: Summer of 1915 op.24", y=1947, dur=16,
   poet="ジェイムズ・エイジー", sort="Barber, Samuel", sid="barber-op24", **E,
   note="★★1曲だけの 作品。★ソプラノと 管弦楽（★室内管弦楽版も あります）",
   inst=[{"part": "管弦楽（または室内管弦楽）", "count": 0, "section": "other"}])
SC("copland-dickinson.json", "12のエミリー・ディキンソンの詩", "コープランド",
   [], n_songs=12, orig="Twelve Poems of Emily Dickinson", y=1950, dur=30,
   poet="エミリー・ディキンソン", sort="Copland, Aaron", sid="copland-dickinson", **E)
SC("copland-old-american-1.json", "古いアメリカの歌 第1集", "コープランド",
   ["1. 大統領のボート（The Boatmen’s Dance）", "2. 猫と鼠（The Dodger）",
    "3. 長い川（Long Time Ago）", "4. 小さなロバ（Simple Gifts）",
    "5. わたしは買った（I Bought Me a Cat）"],
   orig="Old American Songs, Set 1", y=1950, dur=13,
   sort="Copland, Aaron", sid="copland-old-1", **E,
   note="★★管弦楽版も あります。★『Simple Gifts』は シェーカー教徒の 歌",
   inst=[{"part": "ピアノ（または管弦楽）", "count": 1, "section": "keyboard"}])
SC("copland-old-american-2.json", "古いアメリカの歌 第2集", "コープランド",
   [], n_songs=5, orig="Old American Songs, Set 2", y=1952, dur=13,
   sort="Copland, Aaron", sid="copland-old-2", **E)
SC("ives-114-songs.json", "114の歌", "アイヴズ",
   [], n_songs=114, orig="114 Songs", y=1922, dur=0,
   sort="Ives, Charles", sid="ives-114", **E,
   note="★★★曲集ではなく ★生涯の 歌を 自分で 集めた もの。★続けて 歌うことは ありません。"
        "★『The Circus Band』『Charlie Rutlage』などを 選んで 組みます")

# ═══ イタリア ═══
I = dict(lang="it")
SC("arie-antiche.json", "古典イタリア歌曲集", "17〜18世紀の作曲家（カッチーニ・カルダーラ・スカルラッティ ほか）",
   [], n_songs=0, orig="Arie antiche", dur=0,
   sort="Arie antiche", sid="arie-antiche", **I,
   note="★★★声楽を 学ぶ 人が 最初に 歌う 曲集（★パリゾッティ編・ペーターズ版ほか）。"
        "★『カロ・ミオ・ベン』『ラスシャ・キオ・ピアンガ』『オンブラ・マイ・フ』などを 含みます。"
        "★★編者によって 中身が 違います")
SC("donaudy-36-arie.json", "36のアリエ・ディ・スティーレ・アンティコ", "ドナウディ",
   [], n_songs=36, orig="36 Arie di stile antico", y=1918, dur=0,
   sort="Donaudy, Stefano", sid="donaudy-36", **I,
   note="★★『おお わたしの愛する人の（O del mio amato ben）』『いつまた会えるのか』が 名高い")
SC("bellini-sei-ariette.json", "6つのアリエッタ", "ベッリーニ",
   ["1. マリンコニーア（Malinconia, Ninfa gentile）",
    "2. わたしの偶像であるあの人（Vanne, o rosa fortunata）",
    "3. 喜ばせてあげて（Bella Nice, che d’amore）",
    "4. 優雅な月よ（Ma rendi pur contento）",
    "5. 激しい希求（Dolente immagine di Fille mia）",
    "6. お行き、幸せなバラよ（Per pietà, bell’idol mio）"],
   orig="Sei ariette", y=1829, dur=15,
   sort="Bellini, Vincenzo", sid="bellini-sei-ariette", **I,
   note="★★★声楽の 学びで 広く 使われます")
SC("tosti-songs.json", "トスティ 歌曲集", "トスティ",
   [], n_songs=0, orig="Canzoni di Tosti", dur=0,
   sort="Tosti, Francesco Paolo", sid="tosti-songs", **I,
   note="★★★曲集ではなく ★歌曲を まとめた もの。★『最後の歌』『マレキアーレ』"
        "『かわいい口もと』『理想の女』『わたしは死にたい』などを 選んで 組みます")
SC("respighi-deita-silvane.json", "林の神々", "レスピーギ",
   ["1. 牧神（Dèi silvani）", "2. 泉に住む水の精（Acqua）",
    "3. こおろぎ（Crepuscolo）", "4. 雨（Egle）", "5. 音楽（Musica in horto）"],
   orig="Deità silvane", y=1917, dur=15,
   sort="Respighi, Ottorino", sid="respighi-deita", **I,
   note="★★室内合奏つきの 版も あります")

# ═══ 日本 ═══
J = dict(lang="ja")
SC("taki-rentaro-songs.json", "滝廉太郎 歌曲集", "滝廉太郎",
   ["1. 荒城の月", "2. 花（『四季』より）", "3. 箱根八里", "4. 秋の月", "5. 憾（うらみ・ピアノ曲）"],
   y=1901, dur=15, sort="Taki, Rentaro", sid="taki-songs", **J,
   note="★★日本の 歌曲の はじまり。★『憾』は ピアノ曲（★滝の 最後の 作品）")
SC("yamada-aiyan.json", "AIYANの歌", "山田耕筰",
   [], n_songs=5, y=1922, dur=15, poet="北原白秋",
   sort="Yamada, Kosaku", sid="yamada-aiyan", **J)
SC("hirai-songs.json", "平井康三郎 歌曲集", "平井康三郎",
   ["1. 平城山（ならやま）", "2. ゆりかご", "3. 九十九里浜", "4. くちなし", "5. 日本の笛（曲集）"],
   dur=15, sort="Hirai, Kozaburo", sid="hirai-songs", **J,
   note="★★『平城山』は 声楽の 学びで よく 使われます")
SC("kinoshita-makiko-songs.json", "木下牧子 歌曲集", "木下牧子",
   [], n_songs=0, dur=0, sort="Kinoshita, Makiko", sid="kinoshita-songs", **J,
   note="★★★曲集ではなく ★歌曲を まとめた もの。★『鴎』『さびしいカシの木』"
        "『霜の朝』などを 選んで 組みます。★合唱曲でも 広く 知られます")
SC("nobunaga-songs.json", "信長貴富 歌曲集", "信長貴富",
   [], n_songs=0, dur=0, sort="Nobunaga, Takatomi", sid="nobunaga-songs", **J,
   note="★★★いま 書かれている 作曲家。★★上演には 権利の 確認が 要ります")
SC("koshiya-songs.json", "越谷達之助・團伊玖磨 ほか 日本歌曲選（第2集）", "越谷達之助・團伊玖磨・大中恩 ほか",
   ["1. 初恋（越谷達之助）", "2. 花の街（團伊玖磨）", "3. わたしと小鳥とすずと（大中恩）",
    "4. 中国地方の子守歌（山田耕筰 編）", "5. 早春賦（中田章）"],
   dur=15, sort="Nihon kakyoku 2", sid="nihon-kakyoku-2", **J,
   note="★★★作曲家を まとめた 選集です（★1つの 曲集では ありません）")
