# -*- coding: utf-8 -*-
"""★室内楽 と 管弦楽 の 追加（★声楽の 人が 伴奏や 共演で 出会う 曲を 主に）"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from mk import W, orch
C = ("合唱", True)
std = orch(fl=3, ob=2, cl=2, fg=2, hr=4, tp=3, tb=3, tuba=1, timp=1, perc=3, harp=1)
big = orch(fl=4, ob=3, cl=3, fg=3, hr=4, tp=4, tb=3, tuba=1, timp=1, perc=4, harp=2)

def CM(f, t, comp, inst, mvts, *, y=None, dur=25, orig=None, al=None, note=None, sort=None):
    roles = [x["part"] for x in inst]
    n = (note or "")
    return W(f, t, comp, roles, [("楽章", m, roles) for m in mvts],
             orig=orig, year=y, dur=dur, aliases=al, kind="chamber", lang="—",
             inst=inst, note=n or None, sort=sort)

def OR(f, t, comp, mvts, *, y=None, dur=35, orig=None, al=None, note=None, sort=None,
       inst=None, roles=None):
    rr = roles or []
    return W(f, t, comp, rr, [("楽章", m, rr) for m in mvts],
             orig=orig, year=y, dur=dur, aliases=al, kind="orchestra", lang="—",
             inst=inst or std, note=note, sort=sort)

P = lambda n, s, c=1, **k: dict(part=n, count=c, section=s, **k)
PI = P("ピアノ", "keyboard")
VN = P("ヴァイオリン", "strings")
VC = P("チェロ", "strings")
VA = P("ヴィオラ", "strings")

# ════════ 室内楽（歌手が 共演する ことの 多い 曲） ════════
CM("cm-schubert-hirt.json", "岩上の羊飼い D.965", "シューベルト",
   [P("ソプラノ", "other"), P("クラリネット", "woodwind"), PI],
   ["★一曲（ゆるやか〜快活）"], y=1828, dur=12,
   orig="Der Hirt auf dem Felsen D.965", sort="Schubert, Franz",
   note="★★★ソプラノ・クラリネット・ピアノ。★声楽の 名曲だが 室内楽としても 扱われます")
CM("cm-spohr-sechs-lieder.json", "6つのドイツ歌曲 作品103", "シュポーア",
   [P("声（ソプラノまたはテノール）", "other"), P("クラリネット", "woodwind"), PI],
   ["★全6曲"], y=1837, dur=20, sort="Spohr, Louis",
   note="★★声・クラリネット・ピアノ")
CM("cm-brahms-clarinet-trio.json", "クラリネット三重奏曲 イ短調 作品114", "ブラームス",
   [P("クラリネット", "woodwind"), VC, PI],
   ["第1楽章 アレグロ", "第2楽章 アダージョ", "第3楽章 アンダンティーノ・グラツィオーソ",
    "第4楽章 アレグロ"], y=1891, dur=25, sort="Brahms, Johannes")
CM("cm-brahms-horn-trio.json", "ホルン三重奏曲 変ホ長調 作品40", "ブラームス",
   [P("ホルン", "brass"), VN, PI],
   ["第1楽章 アンダンテ", "第2楽章 スケルツォ", "★第3楽章 アダージョ・メスト",
    "第4楽章 アレグロ・コン・ブリオ"], y=1865, dur=30, sort="Brahms, Johannes",
   note="★★母の 死の あとに 書かれました。★ナチュラルホルンの 指定")
CM("cm-mozart-oboe-quartet.json", "オーボエ四重奏曲 ヘ長調 K.370", "モーツァルト",
   [P("オーボエ", "woodwind"), VN, VA, VC],
   ["第1楽章 アレグロ", "第2楽章 アダージョ", "第3楽章 ロンド"],
   y=1781, dur=15, sort="Mozart, Wolfgang Amadeus")
CM("cm-mozart-kegelstatt.json", "ケーゲルシュタット・トリオ K.498", "モーツァルト",
   [P("クラリネット", "woodwind"), VA, PI],
   ["第1楽章 アンダンテ", "第2楽章 メヌエット", "第3楽章 ロンドー"],
   y=1786, dur=22, sort="Mozart, Wolfgang Amadeus")
CM("cm-schubert-octet.json", "八重奏曲 ヘ長調 D.803", "シューベルト",
   [P("クラリネット", "woodwind"), P("ファゴット", "woodwind"), P("ホルン", "brass"),
    P("ヴァイオリン", "strings", 2), VA, VC, P("コントラバス", "strings")],
   ["第1楽章 アダージョ〜アレグロ", "第2楽章 アダージョ", "第3楽章 スケルツォ",
    "第4楽章 アンダンテ（変奏曲）", "第5楽章 メヌエット", "第6楽章 アンダンテ・モルト〜アレグロ"],
   y=1824, dur=60, sort="Schubert, Franz", al=["シューベルト 八重奏曲"])
CM("cm-messiaen-quatuor.json", "世の終わりのための四重奏曲", "メシアン",
   [P("ヴァイオリン", "strings"), P("クラリネット", "woodwind"), VC, PI],
   ["1. 水晶の典礼", "2. 世の終わりを告げる天使のためのヴォカリーズ",
    "★3. 鳥たちの深淵（クラリネット独奏）", "4. 間奏曲",
    "★5. イエスの永遠性への賛歌（チェロとピアノ）", "6. 7つのトランペットのための狂乱の踊り",
    "7. 世の終わりを告げる天使のための虹の混乱",
    "★★8. イエスの不滅性への賛歌（ヴァイオリンとピアノ）"],
   y=1941, dur=50, orig="Quatuor pour la fin du Temps", sort="Messiaen, Olivier",
   note="★★★捕虜収容所で 書かれ、そこで 初演されました")
CM("cm-ravel-introduction.json", "序奏とアレグロ", "ラヴェル",
   [P("ハープ", "strings"), P("フルート", "woodwind"), P("クラリネット", "woodwind"),
    P("ヴァイオリン", "strings", 2), VA, VC],
   ["★一曲（序奏〜アレグロ）"], y=1905, dur=11,
   orig="Introduction et Allegro", sort="Ravel, Maurice")
CM("cm-debussy-sonata-trio.json", "フルート、ヴィオラとハープのためのソナタ", "ドビュッシー",
   [P("フルート", "woodwind"), VA, P("ハープ", "strings")],
   ["第1楽章 パストラール", "第2楽章 間奏曲", "第3楽章 フィナーレ"],
   y=1915, dur=18, sort="Debussy, Claude")
CM("cm-poulenc-sextet.json", "六重奏曲（プーランク）", "プーランク",
   [P("フルート", "woodwind"), P("オーボエ", "woodwind"), P("クラリネット", "woodwind"),
    P("ファゴット", "woodwind"), P("ホルン", "brass"), PI],
   ["第1楽章 アレグロ・ヴィヴァーチェ", "第2楽章 ディヴェルティスマン",
    "第3楽章 フィナーレ"], y=1932, dur=18, sort="Poulenc, Francis")
CM("cm-poulenc-flute-sonata.json", "フルートソナタ（プーランク）", "プーランク",
   [P("フルート", "woodwind"), PI],
   ["第1楽章 アレグロ・マリンコリコ", "第2楽章 カンティレーナ", "第3楽章 プレスト・ジョコーソ"],
   y=1957, dur=13, sort="Poulenc, Francis")
CM("cm-franck-violin-sonata.json", "ヴァイオリンソナタ イ長調（フランク）", "フランク",
   [VN, PI], ["第1楽章 アレグレット・ベン・モデラート", "第2楽章 アレグロ",
              "第3楽章 レチタティーヴォ〜ファンタジア", "★第4楽章 アレグレット・ポコ・モッソ（カノン）"],
   y=1886, dur=28, sort="Franck, César")
CM("cm-faure-elegie.json", "エレジー 作品24", "フォーレ",
   [VC, PI], ["★一曲"], y=1880, dur=7, sort="Fauré, Gabriel",
   note="★管弦楽つきの 版も あります")
CM("cm-saint-saens-carnival.json", "動物の謝肉祭（室内楽版）", "サン＝サーンス",
   [P("ピアノ", "keyboard", 2), P("フルート", "woodwind"), P("クラリネット", "woodwind"),
    P("ヴァイオリン", "strings", 2), VA, VC, P("コントラバス", "strings"),
    P("グラスハーモニカ（またはチェレスタ）", "percussion")],
   ["1. 序奏と獅子王の行進", "2. 雄鶏と雌鶏", "3. 騾馬", "4. 亀", "5. 象",
    "6. カンガルー", "7. 水族館", "8. 耳の長い登場人物", "9. 森の奥のかっこう",
    "10. 大きな鳥籠", "11. ピアニスト", "12. 化石", "★★13. 白鳥", "14. 終曲"],
   y=1886, dur=25, orig="Le carnaval des animaux", sort="Saint-Saëns, Camille",
   note="★★『白鳥』だけ 単独で よく 演奏されます")
CM("cm-piazzolla-tango.json", "タンゴの歴史", "ピアソラ",
   [P("フルート", "woodwind"), P("ギター", "other")],
   ["1. ボルデル 1900", "2. カフェ 1930", "3. ナイトクラブ 1960",
    "4. 現代のコンサート"], y=1986, dur=20,
   orig="Histoire du Tango", sort="Piazzolla, Astor")
CM("cm-shostakovich-quintet.json", "ピアノ五重奏曲 ト短調 作品57", "ショスタコーヴィチ",
   [PI, P("ヴァイオリン", "strings", 2), VA, VC],
   ["第1楽章 プレリュード", "第2楽章 フーガ", "第3楽章 スケルツォ",
    "第4楽章 間奏曲", "第5楽章 フィナーレ"], y=1940, dur=32,
   sort="Shostakovich, Dmitri")
CM("cm-shostakovich-trio-2.json", "ピアノ三重奏曲第2番 ホ短調 作品67", "ショスタコーヴィチ",
   [PI, VN, VC], ["第1楽章 アンダンテ", "第2楽章 アレグロ・コン・ブリオ",
                  "第3楽章 ラルゴ", "第4楽章 アレグレット"],
   y=1944, dur=27, sort="Shostakovich, Dmitri")
CM("cm-elgar-piano-quintet.json", "ピアノ五重奏曲 イ短調（エルガー）", "エルガー",
   [PI, P("ヴァイオリン", "strings", 2), VA, VC],
   ["第1楽章 モデラート〜アレグロ", "第2楽章 アダージョ", "第3楽章 アンダンテ〜アレグロ"],
   y=1919, dur=35, sort="Elgar, Edward")
CM("cm-takemitsu-toward-sea.json", "海へ", "武満徹",
   [P("アルトフルート", "woodwind"), P("ギター", "other")],
   ["1. 夜", "2. 白鯨", "3. 鱈岬"], y=1981, dur=12,
   orig="Toward the Sea", sort="Takemitsu, Toru")
CM("cm-takemitsu-november.json", "ノヴェンバー・ステップス", "武満徹",
   [P("琵琶", "strings"), P("尺八", "woodwind"),
    P("管弦楽", "other", 0, note="人数は公演ごと")],
   ["★一曲（★11の 部分）"], y=1967, dur=20,
   orig="November Steps", sort="Takemitsu, Toru",
   note="★★★琵琶と 尺八と 管弦楽。★西洋と 日本の 楽器を 合わせた 代表作")
CM("cm-sawai-koto.json", "箏曲「六段の調」", "八橋検校",
   [P("箏", "strings"), P("三味線（入る場合）", "strings", 0, note="合奏の形もあります")],
   ["初段", "二段", "三段", "四段", "五段", "六段"],
   dur=12, sort="Yatsuhashi, Kengyo",
   note="★★★箏曲の 最も 基本の 曲。★『春の海』と 並んで よく 演奏されます")
CM("cm-miyagi-haru-no-umi.json", "春の海", "宮城道雄",
   [P("箏", "strings"), P("尺八（またはヴァイオリン）", "woodwind")],
   ["★一曲（★三部の 形）"], y=1929, dur=7, sort="Miyagi, Michio",
   note="★★尺八の 代わりに ヴァイオリンで 演奏する 形も あります")

# ════════ 管弦楽（声が 入る もの・声楽の 人が 出会う もの） ════════
OR("or-mahler-lied-erde.json", "大地の歌", "マーラー",
   ["1. 大地の哀愁に寄せる酒の歌（テノール）",
    "2. 秋にひとりさびしく（アルトまたはバリトン）",
    "3. 青春について（テノール）", "4. 美について（アルト）",
    "5. 春に酔える者（テノール）", "★★6. 告別（アルト）"],
   y=1909, dur=65, orig="Das Lied von der Erde", sort="Mahler, Gustav",
   inst=big, roles=["テノール独唱", "アルト独唱（またはバリトン独唱）"],
   note="★★★交響曲と 歌曲集の 両方の 性格。★★第6楽章『告別』だけで 30分 近く あります")
OR("or-berg-lulu-suite.json", "「ルル」組曲", "ベルク",
   ["1. ロンド", "2. オスティナート", "★3. ルルの歌（ソプラノ）",
    "4. 変奏曲", "★★5. アダージョ（ソプラノ）"],
   y=1934, dur=35, sort="Berg, Alban", inst=big, roles=["ソプラノ独唱"],
   note="★★歌劇『ルル』から 作曲者が まとめた 組曲")
OR("or-strauss-metamorphosen.json", "メタモルフォーゼン", "R.シュトラウス",
   ["★一曲（23の 独奏弦楽器）"], y=1945, dur=27,
   orig="Metamorphosen", sort="Strauss, Richard",
   inst=[{"part": "独奏弦楽器 23（ヴァイオリン10・ヴィオラ5・チェロ5・コントラバス3）",
          "count": 23, "section": "strings"}],
   note="★★★23人 全員が 別の 譜面を 弾きます")
OR("or-ravel-daphnis-suite2.json", "ダフニスとクロエ 第2組曲", "ラヴェル",
   ["1. 夜明け", "2. 無言劇", "★★3. 全員の踊り"],
   y=1913, dur=17, sort="Ravel, Maurice", inst=big,
   note="★★合唱つきの 版と ★合唱なしの 版が あります",
   roles=[C])
OR("or-holst-planets.json", "惑星 作品32", "ホルスト",
   ["1. 火星、戦争をもたらす者", "2. 金星、平和をもたらす者", "3. 水星、翼のある使者",
    "4. 木星、快楽をもたらす者", "5. 土星、老いをもたらす者",
    "6. 天王星、魔術師", "★★7. 海王星、神秘主義者（★女声合唱）"],
   y=1918, dur=50, orig="The Planets op.32", sort="Holst, Gustav", inst=big,
   roles=[("女声合唱", True)],
   note="★★★終楽章に 舞台裏の 女声合唱。★★声が 遠ざかりながら 曲が 終わります")
OR("or-debussy-mer.json", "海", "ドビュッシー",
   ["1. 海上の夜明けから真昼まで", "2. 波の戯れ", "3. 風と海との対話"],
   y=1905, dur=24, orig="La mer", sort="Debussy, Claude", inst=big)
OR("or-debussy-nocturnes.json", "夜想曲（3つの夜想曲）", "ドビュッシー",
   ["1. 雲", "2. 祭", "★★3. シレーヌ（★女声合唱・歌詞なし）"],
   y=1899, dur=25, orig="Nocturnes", sort="Debussy, Claude", inst=big,
   roles=[("女声合唱", True)],
   note="★★★第3曲は 女声合唱が 歌詞なしで 歌います（ヴォカリーズ）")
OR("or-vaughan-lark.json", "揚げひばり", "ヴォーン・ウィリアムズ",
   ["★一曲（★ヴァイオリン独奏と 管弦楽）"], y=1914, dur=15,
   orig="The Lark Ascending", sort="Vaughan Williams, Ralph",
   roles=["ヴァイオリン独奏"])
OR("or-vaughan-sym3.json", "田園交響曲（交響曲第3番）", "ヴォーン・ウィリアムズ",
   ["第1楽章 モルト・モデラート", "第2楽章 レント・モデラート",
    "第3楽章 モデラート・ペザンテ", "★★第4楽章 レント（★ソプラノの ヴォカリーズ）"],
   y=1922, dur=38, sort="Vaughan Williams, Ralph",
   roles=["ソプラノ独唱（またはテノール独唱）"],
   note="★★★終楽章に 歌詞の ない ソプラノ独唱（舞台裏）")
OR("or-nielsen-sym3.json", "交響曲第3番「ひろがりの交響曲」", "ニールセン",
   ["第1楽章 アレグロ・エスパンシーヴォ",
    "★★第2楽章 アンダンテ・パストラーレ（★ソプラノと バリトンの ヴォカリーズ）",
    "第3楽章 アレグレット", "第4楽章 フィナーレ"],
   y=1911, dur=37, orig="Sinfonia espansiva", sort="Nielsen, Carl",
   roles=["ソプラノ独唱", "バリトン独唱"],
   note="★★第2楽章に 歌詞の ない 独唱 2人")
OR("or-szymanowski-sym3.json", "交響曲第3番「夜の歌」", "シマノフスキ",
   ["★一曲（★切れ目なく 続きます）"], y=1916, dur=25,
   sort="Szymanowski, Karol", inst=big, roles=["テノール独唱（またはソプラノ独唱）", C],
   note="★★テノール独唱と 合唱。★ルーミーの 詩に よります")
OR("or-scriabin-sym1.json", "交響曲第1番 作品26", "スクリャービン",
   ["第1楽章", "第2楽章", "第3楽章", "第4楽章", "第5楽章",
    "★★第6楽章（★ソプラノ・テノール独唱と 合唱）"],
   y=1900, dur=50, sort="Scriabin, Alexander", inst=big,
   roles=["ソプラノ独唱", "テノール独唱", C])
OR("or-zemlinsky-lyric.json", "抒情交響曲 作品18", "ツェムリンスキー",
   ["★全7楽章（★ソプラノと バリトンが 交互に）"], y=1923, dur=45,
   orig="Lyrische Symphonie op.18", sort="Zemlinsky, Alexander",
   inst=big, roles=["ソプラノ独唱", "バリトン独唱"],
   note="★★タゴールの 詩。★マーラー『大地の歌』に 似た 作り")
OR("or-shostakovich-sym14.json", "交響曲第14番 作品135", "ショスタコーヴィチ",
   ["★全11楽章（★ソプラノと バスが 歌います）"], y=1969, dur=50,
   sort="Shostakovich, Dmitri",
   inst=[{"part": "弦楽合奏", "count": 0, "section": "strings", "note": "人数は公演ごと"},
         {"part": "打楽器", "count": 0, "section": "percussion", "note": "人数は公演ごと"}],
   roles=["ソプラノ独唱", "バス独唱"],
   note="★★★『死』を 主題に した 歌曲集のような 交響曲。★弦楽と 打楽器だけ")
OR("or-shostakovich-sym13.json", "交響曲第13番「バビ・ヤール」作品113", "ショスタコーヴィチ",
   ["1. バビ・ヤール", "2. ユーモア", "3. 商店で", "4. 恐怖", "5. 出世"],
   y=1962, dur=60, sort="Shostakovich, Dmitri", inst=big,
   roles=["バス独唱", ("男声合唱", True)],
   note="★★★バス独唱と 男声合唱。★エフトゥシェンコの 詩。★★発表に 圧力が かかりました")
OR("or-prokofiev-alexander-nevsky.json", "アレクサンドル・ネフスキー 作品78", "プロコフィエフ",
   ["1. モンゴルの軛の下のロシア", "2. アレクサンドル・ネフスキーの歌",
    "3. プスコフの十字軍", "4. 立ち上がれ、ロシアの民よ",
    "★★5. 氷上の戦い", "★6. 死の原野（アルト独唱）", "7. プスコフへのアレクサンドルの入城"],
   y=1939, dur=40, sort="Prokofiev, Sergei", inst=big,
   roles=["アルト独唱", C],
   note="★★映画の 音楽から 作られた カンタータ")
OR("or-stravinsky-firebird-suite.json", "火の鳥（1919年組曲）", "ストラヴィンスキー",
   ["1. 序奏", "2. 火の鳥とその踊り", "3. 王女たちのロンド",
    "4. カスチェイ王の魔の踊り", "5. 子守歌", "★★6. 終曲"],
   y=1919, dur=22, sort="Stravinsky, Igor",
   note="★★1911年版・1919年版・1945年版で 曲と 編成が 違います")
OR("or-respighi-pines.json", "ローマの松", "レスピーギ",
   ["1. ボルゲーゼ荘の松", "2. カタコンブ付近の松", "3. ジャニコロの松",
    "★★4. アッピア街道の松"], y=1924, dur=22,
   orig="Pini di Roma", sort="Respighi, Ottorino", inst=big,
   note="★★★第3曲で ★小鳥の 声の 録音を 流す 指定が あります")
OR("or-respighi-fountains.json", "ローマの噴水", "レスピーギ",
   ["1. 夜明けのジュリアの谷の噴水", "2. 朝のトリトンの噴水",
    "3. 真昼のトレヴィの噴水", "4. 黄昏のメディチ荘の噴水"],
   y=1917, dur=17, orig="Fontane di Roma", sort="Respighi, Ottorino", inst=big)
OR("or-bartok-concerto-orch.json", "管弦楽のための協奏曲", "バルトーク",
   ["第1楽章 序奏", "第2楽章 対の遊び", "★第3楽章 悲歌",
    "第4楽章 中断された間奏曲", "第5楽章 フィナーレ"],
   y=1943, dur=38, orig="Concerto for Orchestra", sort="Bartók, Béla", inst=big)
OR("or-copland-rodeo.json", "ロデオ（4つのダンス・エピソード）", "コープランド",
   ["1. 牧場の休日", "2. コラール・ノクターン", "3. サタデー・ナイト・ワルツ",
    "★★4. ホー・ダウン"], y=1942, dur=20, sort="Copland, Aaron")
OR("or-gershwin-american-paris.json", "パリのアメリカ人", "ガーシュウィン",
   ["★一曲"], y=1928, dur=18, orig="An American in Paris",
   sort="Gershwin, George", inst=big,
   note="★★タクシーの クラクションが 使われます")
OR("or-gershwin-rhapsody.json", "ラプソディ・イン・ブルー", "ガーシュウィン",
   ["★一曲（★ピアノ独奏つき）"], y=1924, dur=17,
   orig="Rhapsody in Blue", sort="Gershwin, George", roles=["ピアノ独奏"],
   note="★★冒頭の クラリネットの グリッサンドが 名高い")
OR("or-takemitsu-requiem-strings.json", "弦楽のためのレクイエム", "武満徹",
   ["★一曲"], y=1957, dur=10, sort="Takemitsu, Toru",
   inst=[{"part": "弦楽合奏", "count": 0, "section": "strings", "note": "人数は公演ごと"}],
   note="★★★ストラヴィンスキーが 高く 評価した 作品")
OR("or-toru-nostalghia.json", "ノスタルジア", "武満徹",
   ["★一曲"], y=1987, dur=13, sort="Takemitsu, Toru",
   roles=["ヴァイオリン独奏"],
   inst=[{"part": "弦楽合奏", "count": 0, "section": "strings", "note": "人数は公演ごと"}],
   note="★タルコフスキーに 捧げられました")
OR("or-yamada-sym1.json", "交響曲第1番（山田耕筰）「かちどきと平和」", "山田耕筰",
   ["第1楽章", "第2楽章", "第3楽章", "第4楽章"], y=1912, dur=40,
   sort="Yamada, Kosaku",
   note="★★日本人が 書いた 最初の 交響曲と されます")
OR("or-ifukube-sinfonia.json", "シンフォニア・タプカーラ", "伊福部昭",
   ["第1楽章 レント・モルト〜アレグロ", "第2楽章 アダージョ", "第3楽章 ヴィヴァーチェ"],
   y=1954, dur=30, sort="Ifukube, Akira",
   note="★★アイヌの 踊りの 言葉『タプカーラ』から")
OR("or-yashiro-symphony.json", "交響曲（矢代秋雄）", "矢代秋雄",
   ["第1楽章", "第2楽章", "第3楽章", "第4楽章"], y=1958, dur=32,
   sort="Yashiro, Akio")
