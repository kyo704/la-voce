# -*- coding: utf-8 -*-
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from noh import N

# ═══ 初番目物（脇能・神） ═══
N("noh-yoro.json", "養老", 1, "老翁", "勅使", shite_go="山神", tsure=["息子"],
  waki_tsure=["従者"], place="美濃・養老の滝", mai="神舞", author="世阿弥")
N("noh-chikubushima.json", "竹生島", 1, "漁翁", "朝臣", shite_go="龍神", tsure=["女（弁財天）"],
  waki_tsure=["従者"], place="近江・竹生島", mai="舞働", taiko=True)
N("noh-oimatsu.json", "老松", 1, "老人", "梅津某", shite_go="老松の神", tsure=["men" if False else "男"],
  place="筑前・安楽寺（太宰府）", mai="神舞", author="世阿弥")
N("noh-kamo.json", "賀茂", 1, "女", "神職", shite_go="別雷の神", tsure=["女"],
  place="山城・賀茂の御手洗川", mai="舞働", taiko=True)
N("noh-hakurakuten.json", "白楽天", 1, "白楽天", "住吉明神の漁翁", shite_go=None, mugen=False,
  tsure=["唐人"], place="肥前・松浦潟", mai="神楽・楽", author="世阿弥",
  note="★唐の詩人が日本の知恵を試そうと渡来する")
N("noh-kureha.json", "呉服", 1, "女", "勅使", shite_go="呉服の神", tsure=["女"],
  place="摂津・呉服の里", mai="神舞")
N("noh-arashiyama.json", "嵐山", 1, "老人", "勅使", shite_go="蔵王権現", tsure=["女"],
  waki_tsure=["従者"], place="山城・嵐山", mai="舞働", taiko=True)
N("noh-mekari.json", "和布刈", 1, "漁翁", "神職", shite_go="龍神", tsure=["漁女"],
  place="豊前・早鞆の瀬戸", mai="舞働", taiko=True)
N("noh-ukon.json", "右近", 1, "女", "都の男", shite_go="右近の馬場の神", tsure=["女"],
  place="山城・右近の馬場", mai="神舞")
N("noh-tamai.json", "玉井", 1, "海女", "彦火火出見尊", shite_go="豊玉姫", tsure=["海女"],
  place="海底の龍宮", mai="舞働", taiko=True)
N("noh-sakahoko.json", "逆矛", 1, "老人", "勅使", shite_go="高千穂の神", place="日向・高千穂",
  mai="神舞", taiko=True)
N("noh-awaji.json", "淡路", 1, "老翁", "廷臣", shite_go="伊弉諾尊", place="淡路の島",
  mai="神舞", taiko=True)
N("noh-seiobo.json", "西王母", 1, "女", "周の穆王の臣", shite_go="西王母", tsure=["侍女"],
  place="唐土・周の王宮", mai="天女ノ舞")
N("noh-tsurukame.json", "鶴亀", 1, "皇帝", "官人", mugen=False, tsure=["鶴", "亀"],
  place="唐土・玄宗皇帝の宮", mai="楽・鶴亀の舞", al=["月宮殿"],
  note="★祝いの席でよく演じられる短い曲")
N("noh-iwafune.json", "岩船", 1, "童子", "廷臣", shite_go="龍神", place="摂津・住吉の浦",
  mai="舞働", taiko=True)
N("noh-ema.json", "絵馬", 1, "老人", "勅使", shite_go="天照大神", tsure=["女"],
  place="伊勢・斎宮", mai="舞働", taiko=True)

# ═══ 二番目物（修羅） ═══
N("noh-sanemori.json", "実盛", 2, "老人", "遊行上人", shite_go="斎藤別当実盛の霊",
  place="加賀・篠原", mai="カケリ・語り", author="世阿弥",
  note="★白髪を染めて戦に出た老武者")
N("noh-yorimasa.json", "頼政", 2, "老人", "旅僧", shite_go="源頼政の霊",
  place="山城・宇治の平等院", mai="カケリ・語り", author="世阿弥",
  note="★扇の芝で自害した場を語る")
N("noh-tamura.json", "田村", 2, "童子", "旅僧", shite_go="坂上田村麻呂", waki_tsure=["従僧"],
  place="山城・清水寺", mai="舞働", taiko=True)
N("noh-ebira.json", "箙", 2, "里人", "旅僧", shite_go="梅ヶ枝の箙の武者（梶原景季）",
  place="摂津・生田の森", mai="カケリ")
N("noh-tomoe.json", "巴", 2, "里女", "旅僧", shite_go="巴御前の霊", waki_tsure=["従僧"],
  place="近江・粟津", mai="カケリ", note="★★女が主人公の修羅物（ただ1曲）")
N("noh-tomonaga.json", "朝長", 2, "女（青墓の長者）", "観音寺の僧", shite_go="源朝長の霊",
  place="美濃・青墓", mai="カケリ・語り")
N("noh-michimori.json", "通盛", 2, "漁翁", "阿波の僧", shite_go="平通盛の霊", tsure=["漁女", "小宰相の霊"],
  place="摂津・一の谷", mai="カケリ")
N("noh-kanehira.json", "兼平", 2, "船頭", "旅僧", shite_go="今井兼平の霊",
  place="近江・粟津", mai="カケリ", author="世阿弥")
N("noh-tadanori.json", "忠度", 2, "老人（塩屋）", "旅僧", shite_go="平忠度の霊",
  place="摂津・須磨", mai="カケリ・語り", author="世阿弥",
  note="★歌人でもあった武者。★『行き暮れて木の下陰を宿とせば』")
N("noh-tsunemasa.json", "経政", 2, "平経政の霊", "僧都行慶", mugen=False,
  place="仁和寺", mai="琵琶の音・カケリ", author="世阿弥", al=["経正"],
  note="★★霊が姿を見せず 声と琵琶だけで現れる")
N("noh-nue.json", "鵺", 2, "舟人", "旅僧", shite_go="鵺の霊", place="摂津・芦屋の浦",
  mai="舞働", taiko=True, note="★頼政に射られた化け物の側から語る")
N("noh-fujito.json", "藤戸", 2, "老女", "佐々木盛綱", shite_go="漁夫の霊",
  place="備前・藤戸", mai="カケリ", note="★★恨みを述べる庶民の霊")
N("noh-shunzei-tadanori.json", "俊成忠度", 2, "老人", "俊成の従者", shite_go="平忠度の霊",
  place="摂津・須磨", mai="カケリ")
N("noh-kiyotsune-nashi.json", "生田敦盛", 2, "童子", "法然上人", shite_go="平敦盛の霊",
  place="摂津・生田", mai="カケリ", taiko=True)

# ═══ 三番目物（鬘・女） ═══
N("noh-nonomiya.json", "野宮", 3, "里女", "旅僧", shite_go="六条御息所の霊",
  place="山城・嵯峨の野宮", mai="序ノ舞", author="金春禅竹",
  note="★★『源氏物語』の六条御息所。★車争いの恨み")
N("noh-teika.json", "定家", 3, "里女", "旅僧", shite_go="式子内親王の霊",
  place="山城・千本の時雨の亭", mai="序ノ舞", author="金春禅竹",
  note="★定家との秘めた恋。★葛にからまれて成仏できない")
N("noh-eguchi.json", "江口", 3, "里女", "旅僧", shite_go="江口の君（普賢菩薩）",
  tsure=["遊女"], place="摂津・江口", mai="序ノ舞", author="観世元雅")
N("noh-yokihi.json", "楊貴妃", 3, "楊貴妃の霊", "方士", mugen=False,
  place="蓬莱宮・太真殿", mai="序ノ舞", author="金春禅竹")
N("noh-tohoku.json", "東北", 3, "里女", "旅僧", shite_go="和泉式部の霊",
  waki_tsure=["従僧"], place="京・東北院", mai="序ノ舞")
N("noh-yugyoyanagi.json", "遊行柳", 3, "老人", "遊行上人", shite_go="朽木の柳の精",
  place="下野・白河の関", mai="序ノ舞", author="観世信光")
N("noh-saigyozakura.json", "西行桜", 3, "西行", "花見の男", shite_go="老桜の精", mugen=False,
  place="京・西山の庵", mai="序ノ舞", author="世阿弥")
N("noh-seiganji.json", "誓願寺", 3, "里女", "一遍上人", shite_go="和泉式部の霊",
  place="京・誓願寺", mai="天女ノ舞", author="世阿弥")
N("noh-hajitomi.json", "半蔀", 3, "里女", "雲林院の僧", shite_go="夕顔の霊",
  place="京・五条", mai="序ノ舞", note="★『源氏物語』の夕顔")
N("noh-oshio.json", "小塩", 3, "老人", "花見の男", shite_go="在原業平の霊",
  place="山城・大原野", mai="序ノ舞・男舞")
N("noh-higaki.json", "檜垣", 3, "老女", "岩戸の僧", shite_go="白拍子の老女の霊",
  place="肥後・岩戸", mai="序ノ舞", author="世阿弥",
  note="★★三老女の1曲（檜垣・関寺小町・姨捨）── 最も重い曲とされる")
N("noh-obasute.json", "姨捨", 3, "里女", "旅人", shite_go="捨てられた老女の霊",
  place="信濃・更級の里", mai="序ノ舞",
  note="★★三老女の1曲。★月の下で舞う")
N("noh-sekideratomachi.json", "関寺小町", 3, "老女（小野小町）", "関寺の住僧", mugen=False,
  waki_tsure=["童子"], place="近江・関寺", mai="序ノ舞",
  note="★★★三老女の中でも最も重く、★一生に一度しか演じないとされる")
N("noh-sotobakomachi.json", "卒都婆小町", 3, "老女（小野小町）", "高野山の僧", mugen=False,
  waki_tsure=["従僧"], place="摂津・阿倍野", mai="物狂い", author="観阿弥",
  note="★★深草少将の霊に憑かれる")
N("noh-kayoikomachi.json", "通小町", 3, "女（小野小町の霊）", "八瀬の僧", shite_go="深草少将の霊",
  place="山城・八瀬", mai="カケリ", author="観阿弥")
N("noh-omu-komachi.json", "鸚鵡小町", 3, "老女（小野小町）", "新大納言行家", mugen=False,
  place="近江・関寺のあたり", mai="舞の型",
  note="★★一字を返す『鸚鵡返し』の歌が主題")
N("noh-uneme.json", "采女", 3, "里女", "旅僧", shite_go="采女の霊",
  place="大和・猿沢の池", mai="序ノ舞")
N("noh-kakitsubata.json", "杜若", 3, "里女", "旅僧", shite_go="杜若の精",
  place="三河・八橋", mai="序ノ舞", author="金春禅竹",
  note="★★業平の『からころも』の歌を女の姿の花の精が舞う")
N("noh-kocho.json", "胡蝶", 3, "里女", "旅僧", shite_go="胡蝶の精",
  place="京・一条大宮", mai="序ノ舞")
N("noh-basho.json", "芭蕉", 3, "里女", "唐土の僧", shite_go="芭蕉の精",
  place="唐土・湘水のほとり", mai="序ノ舞", author="金春禅竹")
N("noh-yuya.json", "熊野", 3, "熊野（ゆや）", "平宗盛", mugen=False, tsure=["朝顔"],
  place="京・清水寺", mai="中ノ舞", al=["湯谷"],
  note="★★『熊野松風に米の飯』── 飽きのこない名曲の代表")
N("noh-senju.json", "千手", 3, "千手の前", "狩野介宗茂", mugen=False, tsure=["平重衡"],
  place="鎌倉・狩野介の館", mai="中ノ舞")
N("noh-ohara-goko.json", "大原御幸", 3, "建礼門院", "後白河法皇", mugen=False,
  tsure=["阿波の内侍", "大納言佐局"], waki_tsure=["供の者"], place="京・大原の寂光院",
  mai="語り", note="★★舞のない静かな曲")
N("noh-genji-kuyo.json", "源氏供養", 3, "里女", "安居院の法印", shite_go="紫式部の霊",
  place="近江・石山寺", mai="序ノ舞")
N("noh-yoshino-shizuka.json", "吉野静", 3, "静御前", "佐藤忠信", mugen=False,
  place="大和・吉野山", mai="中ノ舞")
N("noh-futari-shizuka.json", "二人静", 3, "里女", "菜摘女", shite_go="静御前の霊",
  place="大和・吉野の勝手明神", mai="中ノ舞",
  note="★★2人が同じ装束で同じ舞を舞う（相舞）")
N("noh-matsumushi.json", "松虫", 3, "男", "酒売り", shite_go="男の霊", tsure=["男たち"],
  place="摂津・阿倍野", mai="男舞", note="★男どうしの友情")
N("noh-fuji.json", "藤", 3, "里女", "旅僧", shite_go="藤の精",
  place="越中・多枯の浦", mai="序ノ舞")
N("noh-yugao.json", "夕顔", 3, "里女", "豊後の僧", shite_go="夕顔の霊",
  place="京・五条", mai="序ノ舞")
N("noh-izutsu-nashi.json", "小督", 3, "小督の局", "源仲国", mugen=False,
  place="嵯峨野", mai="中ノ舞", note="★琴の音を尋ねて見つける")

# ═══ 四番目物（雑） ═══
N("noh-miidera.json", "三井寺", 4, "母（狂女）", "三井寺の住僧", mugen=False,
  tsure=["千満（子）"], waki_tsure=["従僧"], place="近江・三井寺", mai="鐘の段・物狂い",
  note="★★鐘をつく狂女の場")
N("noh-hyakuman.json", "百万", 4, "百万（狂女）", "男", mugen=False, tsure=["子"],
  place="京・嵯峨の清凉寺", mai="物狂い・車の段", author="世阿弥")
N("noh-sakuragawa.json", "桜川", 4, "母（狂女）", "磯部寺の僧", mugen=False,
  tsure=["桜子（子）"], place="常陸・桜川", mai="物狂い", author="世阿弥")
N("noh-hanagatami.json", "花筐", 4, "照日の前（狂女）", "継体天皇の臣", mugen=False,
  tsure=["侍女"], place="越前・味真野", mai="物狂い・李夫人の曲舞", author="世阿弥")
N("noh-semimaru.json", "蝉丸", 4, "逆髪", "蝉丸", mugen=False, waki_tsure=["清貫"],
  place="近江・逢坂山", mai="語り・相見", note="★★盲目の弟と狂う姉の出会い")
N("noh-yoroboshi.json", "弱法師", 4, "俊徳丸（盲目の少年）", "高安通俊", mugen=False,
  place="摂津・天王寺", mai="日想観・弱法師の舞", author="観世元雅")
N("noh-koyamonogurui.json", "高野物狂", 4, "高師四郎（狂男）", "高野山の僧", mugen=False,
  tsure=["春満"], place="紀伊・高野山", mai="物狂い")
N("noh-ashikari.json", "芦刈", 4, "芦売りの男（日下左衛門）", "妻の従者", mugen=False,
  tsure=["妻"], place="摂津・難波", mai="笠の段・男舞",
  note="★★別れた夫婦の再会")
N("noh-kanawa.json", "鉄輪", 4, "女", "晴明の使い", shite_go="鬼となった女",
  place="京・貴船明神", mai="祈り・舞働", taiko=True,
  note="★★★丑の刻参りの曲。呪いの藁人形")
N("noh-kurozuka.json", "黒塚", 4, "里女", "祐慶阿闍梨", shite_go="鬼女",
  waki_tsure=["従僧"], place="陸奥・安達原", mai="糸繰の段・祈り・舞働", taiko=True,
  al=["安達原"], note="★★★閨（ねや）を見るなという禁を破る")
N("noh-ukai.json", "鵜飼", 4, "鵜使いの老人", "旅僧", shite_go="閻魔王",
  waki_tsure=["従僧"], place="甲斐・石和川", mai="鵜の段・舞働", taiko=True)
N("noh-jinen-koji.json", "自然居士", 4, "自然居士", "人商人", mugen=False,
  tsure=["少女"], place="京・雲居寺", mai="簓の段・羯鼓・舞",
  note="★★★芸をして人を救う説経師。★簓・羯鼓・舞の見せ場が続く")
N("noh-togan-koji.json", "東岸居士", 4, "東岸居士", "旅人", mugen=False,
  place="京・白河", mai="簓・羯鼓・舞", author="観阿弥")
N("noh-hokazo.json", "放下僧", 4, "放下僧（兄）", "利根信俊", mugen=False,
  tsure=["弟（小次郎）"], place="下野", mai="簓の段・小歌・羯鼓",
  note="★★放下（芸人）に化けて父の仇を討つ")
N("noh-mochizuki.json", "望月", 4, "小澤刑部友房", "望月秋長", mugen=False,
  tsure=["花若（子）", "母"], place="近江・守山の宿", mai="獅子舞",
  note="★★★宿の主が仇を討たせる。★獅子舞が見せ場")
N("noh-nishikigi.json", "錦木", 4, "里男", "旅僧", shite_go="男の霊", tsure=["里女", "女の霊"],
  place="陸奥・狭布の里", mai="序ノ舞", author="世阿弥")
N("noh-kinuta.json", "砧", 4, "妻", "夕霧（侍女）", shite_go="妻の霊",
  waki_tsure=["夫"], place="九州・芦屋", mai="砧の段・序ノ舞", author="世阿弥",
  note="★★砧を打つ音が主題。★世阿弥自身が『後の世に知る人あるまじ』と記した")
N("noh-motomezuka.json", "求塚", 4, "菜摘女", "旅僧", shite_go="菟名日処女の霊",
  tsure=["菜摘女"], place="摂津・生田", mai="地獄の責め・カケリ", taiko=True,
  author="観阿弥", note="★★★2人の男に求められて死んだ娘。地獄の責めの場")
N("noh-koi-no-omoni.json", "恋重荷", 4, "山科荘司", "臣下", shite_go="荘司の怨霊",
  tsure=["女御"], place="京・白河の院", mai="舞働", taiko=True, author="世阿弥")
N("noh-aya-no-tsuzumi.json", "綾鼓", 4, "老いた庭掃き", "臣下", shite_go="老人の怨霊",
  tsure=["女御"], place="筑前・木の丸殿", mai="鼓の段・舞働", taiko=True,
  note="★★★鳴らない鼓。★三島由紀夫『近代能楽集』の『綾の鼓』の原作")
N("noh-shunei.json", "春栄", 4, "春栄", "狩野介", mugen=False, tsure=["兄・種直"],
  place="鎌倉", mai="兄弟の名乗り")
N("noh-tosen.json", "唐船", 4, "祖慶官人", "箱崎の某", mugen=False,
  tsure=["唐の子2人", "日本の子2人"], place="筑前・箱崎", mai="唐楽・舞",
  note="★★2つの国の子のあいだで引き裂かれる父")
N("noh-ominaeshi.json", "女郎花", 4, "老人", "旅僧", shite_go="小野頼風の霊",
  tsure=["女の霊"], place="山城・男山", mai="カケリ")
N("noh-taisanpukun.json", "泰山府君", 4, "桜町中納言", "泰山府君", shite_go=None, mugen=False,
  tsure=["天女"], place="桜の庭", mai="天女ノ舞", taiko=True)
N("noh-kantan.json", "邯鄲", 4, "盧生", "宿の女主人", mugen=False,
  waki_tsure=["勅使", "舞童"], place="唐土・邯鄲の里", mai="楽・一畳台の飛び返り",
  note="★★★邯鄲の枕。★一畳台の上での飛び返りが見せ場")
N("noh-shokun.json", "昭君", 4, "白桃（父）", "胡王", shite_go=None, mugen=False,
  tsure=["王母（母）", "王昭君の霊"], place="唐土・王昭君の故郷", mai="鏡の段")
N("noh-sumizome.json", "墨染桜", 4, "里女", "旅僧", shite_go="桜の精",
  place="山城・伏見", mai="序ノ舞")
N("noh-kagekiyo.json", "景清", 4, "悪七兵衛景清（盲目）", "里人", mugen=False,
  tsure=["人丸（娘）"], place="日向・宮崎", mai="語り・屋島の合戦",
  note="★★盲目の武者と、尋ねてくる娘")
N("noh-hibariyama.json", "雲雀山", 4, "侍従（乳母）", "横佩の大臣", mugen=False,
  tsure=["中将姫"], place="大和・雲雀山", mai="花売りの段")
N("noh-manju.json", "満仲", 4, "仲光", "満仲", mugen=False,
  tsure=["美女丸", "幸寿丸"], place="摂津・多田", mai="語り・カケリ", al=["仲光"],
  note="★★★子の代わりに自分の子を斬る")
N("noh-shichikiochi.json", "七騎落", 4, "土肥実平", "源頼朝", mugen=False,
  tsure=["和田義盛"], waki_tsure=["従者"], place="相模・土肥の浦", mai="語り")

# ═══ 五番目物（切・鬼） ═══
N("noh-momijigari.json", "紅葉狩", 5, "上臈（女）", "平維茂", shite_go="鬼女",
  tsure=["侍女"], waki_tsure=["従者"], place="信濃・戸隠山", mai="中ノ舞・舞働",
  author="観世信光", note="★★★紅葉の宴から鬼女の正体へ。★歌舞伎にも移された")
N("noh-oeyama.json", "大江山", 5, "山伏（酒呑童子）", "源頼光", shite_go="鬼神・酒呑童子",
  tsure=["山伏"], waki_tsure=["渡辺綱", "従者"], place="丹波・大江山", mai="舞働",
  note="★酒呑童子退治")
N("noh-rashomon.json", "羅生門", 5, "渡辺綱", "源頼光", shite_go=None, mugen=False,
  tsure=["鬼"], waki_tsure=["従者"], place="京・羅生門", mai="舞働",
  author="観世信光")
N("noh-kurama-tengu.json", "鞍馬天狗", 5, "山伏（大天狗）", "東谷の僧", shite_go="大天狗",
  tsure=["牛若丸", "小天狗"], place="山城・鞍馬山", mai="舞働",
  note="★牛若丸に兵法を授ける")
N("noh-zegai.json", "是界", 5, "唐の僧（是界坊）", "比叡山の僧正", shite_go="大天狗・是界坊",
  tsure=["太郎坊"], place="京・愛宕山", mai="舞働", al=["善界"])
N("noh-shari.json", "舎利", 5, "山伏（足疾鬼）", "旅僧", shite_go="足疾鬼",
  tsure=["韋駄天"], place="京・泉涌寺", mai="舞働", author="観世信光")
N("noh-shakkyo.json", "石橋", 5, "童子", "寂昭法師", shite_go="獅子",
  place="唐土・清凉山", mai="★獅子（乱序・獅子舞）",
  note="★★★獅子の舞が見せ場。★『連獅子』など歌舞伎の獅子物の元")
N("noh-shoki.json", "鐘馗", 5, "唐人", "旅僧", shite_go="鐘馗の霊",
  place="唐土・終南山", mai="舞働")
N("noh-nomori.json", "野守", 5, "野守の老人", "山伏", shite_go="野守の鬼",
  place="大和・春日野", mai="鏡の段・舞働", author="世阿弥")
N("noh-kasuga-ryujin.json", "春日龍神", 5, "宮守", "明恵上人", shite_go="龍神（時風秀行）",
  waki_tsure=["従僧"], place="大和・春日社", mai="舞働", author="金春禅竹")
N("noh-ikkaku-sennin.json", "一角仙人", 5, "一角仙人", "旋陀夫人", shite_go=None, mugen=False,
  tsure=["扇陀夫人の侍女"], place="天竺", mai="舞働")
N("noh-shirahige.json", "白髭", 5, "老人", "勅使", shite_go="白髭明神",
  tsure=["龍女"], place="近江・白髭の社", mai="舞働")
N("noh-kuruma-zo.json", "車僧", 5, "車僧", "愛宕山の太郎坊", shite_go=None, mugen=False,
  tsure=["小天狗"], place="京・嵯峨野", mai="舞働")
N("noh-dairokuten.json", "第六天", 5, "天狗", "天照大神の使い", shite_go="第六天の魔王",
  place="天上", mai="舞働")
N("noh-orochi.json", "大蛇", 5, "里人", "須佐之男命", shite_go="八岐大蛇",
  place="出雲・簸の川上", mai="舞働", al=["八岐大蛇"])
N("noh-katsuragi.json", "葛城", 5, "里女", "山伏", shite_go="葛城の女神",
  place="大和・葛城山", mai="序ノ舞・岩戸の舞")
N("noh-taniko.json", "谷行", 5, "松若", "阿闍梨", shite_go=None, mugen=False,
  tsure=["母"], waki_tsure=["山伏たち"], place="大峰山の行", mai="祈り・舞働",
  note="★★★掟によって少年を谷へ落とす。★ブレヒトの学習劇『イエスマン』の元")
N("noh-kokaji.json", "小鍛冶", 5, "童子", "三条小鍛冶宗近", shite_go="稲荷明神",
  waki_tsure=["勅使"], place="京・三条", mai="舞働",
  note="★★剣を打つ相槌の場")
N("noh-sesshoseki.json", "殺生石", 5, "里女", "玄翁道人", shite_go="野干（九尾の狐）",
  place="下野・那須野", mai="舞働", note="★★玉藻前の伝説")
N("noh-daie.json", "大会", 5, "山伏", "比叡山の僧", shite_go="大天狗",
  place="京・比叡山", mai="舞働")
N("noh-toru.json", "融", 5, "汐汲みの老人", "旅僧", shite_go="源融の霊",
  place="京・六条河原院", mai="早舞", author="世阿弥")
N("noh-ryoko.json", "龍虎", 5, "龍", "旅僧", shite_go=None, mugen=False,
  tsure=["虎"], place="唐土の山中", mai="舞働")
N("noh-genzai-nue.json", "現在鵺", 5, "鵺", "源頼政", shite_go=None, mugen=False,
  place="京・紫宸殿", mai="舞働")
N("noh-chobuku-soga.json", "調伏曽我", 5, "山伏", "工藤祐経", shite_go="不動明王",
  place="伊豆", mai="舞働")
