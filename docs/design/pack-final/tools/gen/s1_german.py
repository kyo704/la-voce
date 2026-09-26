# -*- coding: utf-8 -*-
"""★歌曲集 ── ドイツ・オーストリア"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from sc import SC

SC("beethoven-ferne-geliebte.json", "遥かな恋人に寄せて", "ベートーヴェン",
   ["1. 丘の上に座り（Auf dem Hügel sitz ich spähend）",
    "2. 山々の青いところ（Wo die Berge so blau）",
    "3. 空高く舞う軽やかな帆船（Leichte Segler in den Höhen）",
    "4. この雲が流れゆく（Diese Wolken in den Höhen）",
    "5. 五月は帰り（Es kehret der Maien）",
    "6. この歌を受け取ってほしい（Nimm sie hin denn, diese Lieder）"],
   orig="An die ferne Geliebte", y=1816, dur=15, poet="ヤイテレス",
   sort="Beethoven, Ludwig van", sid="beethoven-op98",
   note="★★★史上 最初の『連作歌曲集』と される 作品。★6曲が 切れ目なく 続きます")
SC("schumann-liederkreis-24.json", "リーダークライス 作品24", "シューマン",
   ["1. 朝ごと目覚めては（Morgens steh ich auf und frage）",
    "2. 落ち着かず行き来する（Es treibt mich hin）",
    "3. さすらい歩き（Ich wandelte unter den Bäumen）",
    "4. 恋人の唇にくちづけしよう（Lieb Liebchen）",
    "5. 美しい揺りかご（Schöne Wiege meiner Leiden）",
    "6. 待て、荒々しい船頭よ（Warte, warte, wilder Schiffmann）",
    "7. 山と城が見下ろす（Berg und Burgen schaun herunter）",
    "8. 初めは絶望しそうだった（Anfangs wollt ich fast verzagen）",
    "9. ミルテとバラで（Mit Myrten und Rosen）"],
   orig="Liederkreis op.24", y=1840, dur=25, poet="ハイネ",
   sort="Schumann, Robert", sid="schumann-op24")
SC("schumann-myrten.json", "ミルテの花 作品25", "シューマン",
   [], n_songs=26, orig="Myrthen op.25", y=1840, dur=60,
   poet="ゲーテ・リュッケルト・ハイネ・バーンズ ほか",
   sort="Schumann, Robert", sid="schumann-op25",
   note="★★結婚の 贈り物として 書かれた 曲集。★第1曲『献呈（Widmung）』・第3曲『くるみの木』・"
        "第7曲『蓮の花』が よく 単独で 歌われます")
SC("schumann-kerner.json", "ケルナー歌曲集 作品35", "シューマン",
   [], n_songs=12, orig="Zwölf Gedichte von Justinus Kerner op.35", y=1840, dur=35,
   poet="ケルナー", sort="Schumann, Robert", sid="schumann-op35")
SC("brahms-magelone.json", "マゲローネのロマンス 作品33", "ブラームス",
   [], n_songs=15, orig="Die schöne Magelone op.33", y=1869, dur=75,
   poet="ティーク", sort="Brahms, Johannes", sid="brahms-op33",
   note="★★ブラームス 唯一の 連作歌曲集。★語り（ナレーション）を 挟む 上演も あります")
SC("brahms-vier-ernste.json", "4つの厳粛な歌 作品121", "ブラームス",
   ["1. 人の子らに臨むことは（Denn es gehet dem Menschen）",
    "2. わたしはまた振り返って（Ich wandte mich und sahe）",
    "3. 死よ、なんと苦しいものか（O Tod, wie bitter bist du）",
    "4. たとえわたしが人々の言葉で語ろうと（Wenn ich mit Menschen）"],
   orig="Vier ernste Gesänge op.121", y=1896, dur=20, poet="聖書",
   sort="Brahms, Johannes", sid="brahms-op121",
   note="★★★低い声のための 曲。★ブラームス 最後の 歌曲")
SC("brahms-zigeunerlieder.json", "ジプシーの歌 作品103", "ブラームス",
   [], n_songs=11, orig="Zigeunerlieder op.103", y=1888, dur=20,
   sort="Brahms, Johannes", sid="brahms-op103",
   note="★四重唱（S・A・T・B とピアノ）が もとの 形。★独唱版も あります")
SC("wolf-morike.json", "メーリケ歌曲集", "ヴォルフ",
   [], n_songs=53, orig="Gedichte von Eduard Mörike", y=1888, dur=140,
   poet="メーリケ", sort="Wolf, Hugo", sid="wolf-morike",
   note="★★全曲 続けて 出すことは 稀。★『春だ（Er ist’s）』『庭師』『捨てられた娘』"
        "『隠遁』『郷愁』などを 選んで 組みます")
SC("wolf-goethe.json", "ゲーテ歌曲集", "ヴォルフ",
   [], n_songs=51, orig="Gedichte von Goethe", y=1889, dur=130,
   poet="ゲーテ", sort="Wolf, Hugo", sid="wolf-goethe",
   note="★『ミニョン』『竪琴弾き』『ガニュメート』などを 選んで 組みます")
SC("wolf-eichendorff.json", "アイヒェンドルフ歌曲集", "ヴォルフ",
   [], n_songs=20, orig="Gedichte von Eichendorff", y=1889, dur=50,
   poet="アイヒェンドルフ", sort="Wolf, Hugo", sid="wolf-eichendorff")
SC("wolf-spanisches.json", "スペイン歌曲集", "ヴォルフ",
   [], n_songs=44, orig="Spanisches Liederbuch", y=1890, dur=110,
   poet="ハイゼ／ガイベル（スペイン詩の独訳）", sort="Wolf, Hugo", sid="wolf-spanisches",
   note="★宗教の 歌 10曲と 世俗の 歌 34曲に 分かれます")
SC("wolf-italienisches.json", "イタリア歌曲集（ヴォルフ）", "ヴォルフ",
   [], n_songs=46, orig="Italienisches Liederbuch", y=1896, dur=110,
   poet="ハイゼ（イタリア詩の独訳）", sort="Wolf, Hugo", sid="wolf-italienisches",
   note="★★男声と 女声で 分け合って 出す 形が 多い")
SC("mahler-ruckert.json", "リュッケルトの5つの歌", "マーラー",
   ["1. わたしは仄かな香りを吸い込んだ（Ich atmet’ einen linden Duft）",
    "2. ごらん、あの優しい歌を（Blicke mir nicht in die Lieder）",
    "3. わたしは緑の野を歩いた（Liebst du um Schönheit）",
    "4. 真夜中に（Um Mitternacht）",
    "5. わたしはこの世に忘れられ（Ich bin der Welt abhanden gekommen）"],
   orig="Fünf Rückert-Lieder", y=1902, dur=22, poet="リュッケルト",
   sort="Mahler, Gustav", sid="mahler-ruckert",
   note="★★管弦楽つきの 版も あります。★曲の 順は 演奏者が 決めます")
SC("mahler-wunderhorn.json", "子供の不思議な角笛", "マーラー",
   [], n_songs=12, orig="Des Knaben Wunderhorn", y=1901, dur=45,
   poet="ドイツ民謡詩集", sort="Mahler, Gustav", sid="mahler-wunderhorn",
   note="★★管弦楽つきが もとの 形。★『魚に説教するパドヴァの聖アントニウス』"
        "『少年鼓手』『死んだ鼓手』などを 含みます",
   inst=[{"part": "管弦楽（またはピアノ）", "count": 0, "section": "other",
          "note": "★管弦楽版と ピアノ版が あります"}])
SC("strauss-brentano.json", "6つの歌 作品68（ブレンターノ歌曲集）", "R.シュトラウス",
   ["1. あなたの歌が響くとき（An die Nacht）",
    "2. わたしは漂う（Ich wollt ein Sträußlein binden）",
    "3. ささやけ、愛らしいミルテよ（Säusle, liebe Myrthe）",
    "4. 夜にひとり（Als mir dein Lied erklang）",
    "5. アモール（Amor）",
    "6. 女たちの歌（Lied der Frauen）"],
   orig="Sechs Lieder op.68", y=1918, dur=30, poet="ブレンターノ",
   sort="Strauss, Richard", sid="strauss-op68",
   note="★★高い声の 技（アジリタ）を 要します。★『アモール』は ことに 難しい")
SC("strauss-op10.json", "8つの歌 作品10", "R.シュトラウス",
   ["1. 献呈（Zueignung）", "2. 何もなく（Nichts）", "3. 夜（Die Nacht）",
    "4. 菩提樹の下で（Die Georgine）", "5. 忍耐（Geduld）",
    "6. なんという恵み（Die Verschwiegenen）", "7. 静かな歩み（Die Zeitlose）",
    "8. 万霊節（Allerseelen）"],
   orig="Acht Gedichte aus Letzte Blätter op.10", y=1885, dur=25,
   poet="ギルム", sort="Strauss, Richard", sid="strauss-op10",
   note="★★『献呈』と『万霊節』は 独立して よく 歌われます")
SC("berg-sieben-fruhe.json", "7つの初期の歌", "ベルク",
   ["1. 夜（Nacht）", "2. 葦の歌（Schilflied）", "3. ナイチンゲール（Die Nachtigall）",
    "4. 夢に見た栄光（Traumgekrönt）", "5. 部屋で（Im Zimmer）",
    "6. 愛の讃歌（Liebesode）", "7. 夏の日（Sommertage）"],
   orig="Sieben frühe Lieder", y=1908, dur=15,
   sort="Berg, Alban", sid="berg-sieben",
   note="★★管弦楽版も あります")
SC("schoenberg-hangenden-garten.json", "架空庭園の書 作品15", "シェーンベルク",
   [], n_songs=15, orig="Das Buch der hängenden Gärten op.15", y=1909, dur=30,
   poet="ゲオルゲ", sort="Schoenberg, Arnold", sid="schoenberg-op15",
   note="★★調性を 離れた 最初の 歌曲集の 1つ")
