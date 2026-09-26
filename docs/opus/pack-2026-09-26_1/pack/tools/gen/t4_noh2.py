# -*- coding: utf-8 -*-
"""★能 第2陣 ── 現行曲の残り"""
import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from noh import N

# ═══ 初番目物（脇能・神）の残り ═══
N("noh-naniwa.json", "難波", 1, "老人", "臣下", shite_go="王仁の霊（木の花の精）",
  tsure=["男"], place="摂津・難波の梅", mai="神舞", author="金春禅竹")
N("noh-himuro.json", "氷室", 1, "老人", "臣下", shite_go="氷室の神", tsure=["男"],
  place="丹波・氷室山", mai="舞働", taiko=True)
N("noh-yumi-yawata.json", "弓八幡", 1, "老人", "勅使", shite_go="高良の神",
  waki_tsure=["従者"], place="山城・男山八幡", mai="神舞", author="世阿弥")
N("noh-eguchi-nashi.json", "御裳濯", 1, "老女", "勅使", shite_go="天照大神の使い",
  place="伊勢・五十鈴川", mai="神舞")
N("noh-kuzu.json", "国栖", 1, "老人", "天武天皇", shite_go="蔵王権現", tsure=["老女"],
  waki_tsure=["従者"], place="大和・吉野の国栖", mai="舞働", taiko=True, al=["国栖"])
N("noh-mekari-nashi.json", "道明寺" if False else "志賀", 1, "老人", "臣下",
  shite_go="大伴黒主の霊", place="近江・志賀の里", mai="神舞")
N("noh-takasago-nashi.json", "生田" if False else "咸陽宮", 1, "始皇帝", "荊軻",
  mugen=False, tsure=["花陽夫人"], waki_tsure=["秦舞陽"], place="唐土・咸陽宮",
  mai="舞働", taiko=True, note="★琴の音で刺客を退ける")
N("noh-seiganji-nashi.json", "室君", 1, "遊女", "臣下", shite_go="室明神",
  tsure=["遊女"], place="播磨・室の泊", mai="神舞")
N("noh-mitsuyama.json", "三山", 1, "里女", "旅僧", shite_go="桂子の霊",
  place="大和・香具山", mai="序ノ舞", al=["三山"])
N("noh-kureha-nashi.json", "呉服" if False else "荒田" if False else "皇帝", 1,
  "鐘馗の霊", "唐の帝の臣", shite_go=None, mugen=False, tsure=["楊貴妃"],
  place="唐土・帝の宮", mai="舞働", taiko=True)
N("noh-hojogawa.json", "放生川", 1, "老人", "勅使", shite_go="武内の神",
  place="山城・石清水八幡", mai="神舞")
N("noh-kaido-hongan.json", "海人" if False else "枕慈童", 1, "慈童", "魏の文帝の臣",
  shite_go=None, mugen=False, place="唐土・酈県山", mai="楽", al=["菊慈童"],
  note="★★菊の露で不老となった童。★『菊慈童』の名でも上演される")
N("noh-shiga.json", "大社" if False else "八幡前" if False else "鵜羽", 1, "海人の女",
  "臣下", shite_go="豊玉姫", tsure=["海人の女"], place="日向・鵜戸", mai="神舞")
N("noh-kinsatsu.json", "金札", 1, "老人", "勅使", shite_go="天津太玉の神",
  place="山城・伏見", mai="舞働", taiko=True)
N("noh-shirahige-nashi.json", "白鬚" if False else "松尾", 1, "老人", "勅使",
  shite_go="松尾明神", place="山城・松尾", mai="神舞")
N("noh-hakozaki.json", "箱崎", 1, "老人", "旅人", shite_go="箱崎の神",
  place="筑前・箱崎", mai="神舞")
N("noh-genjo.json", "絃上", 1, "老人（村上天皇の霊）", "藤原師長", shite_go="村上天皇の霊",
  tsure=["老女（梨壺の女御）"], waki_tsure=["従者"], place="摂津・須磨", mai="早舞",
  al=["玄象"], note="★琵琶の名器『絃上』を授かる")
N("noh-tsuru.json", "鶴" if False else "金剛山", 1, "里女", "旅僧",
  shite_go="金剛山の神", place="大和・金剛山", mai="舞働", taiko=True)

# ═══ 二番目物（修羅）の残り ═══
N("noh-atsumori-nashi.json", "鵜飼" if False else "俊寛" if False else "知章", 2,
  "老人", "旅僧", shite_go="平知章の霊", tsure=["老女"], place="摂津・一の谷",
  mai="カケリ")
N("noh-michimori-nashi.json", "篠原" if False else "小袖曽我", 2, "曽我十郎", "母",
  mugen=False, tsure=["曽我五郎"], place="相模・曽我の里", mai="カケリ",
  note="★母との別れ。★曽我物の1つ")
N("noh-genpuku-soga.json", "元服曽我", 2, "曽我五郎", "北条時政", mugen=False,
  tsure=["曽我十郎"], place="相模", mai="カケリ")
N("noh-yashima-nashi.json", "屋島" if False else "摂待", 2, "継信の子", "武蔵坊弁慶",
  mugen=False, tsure=["継信の母"], waki_tsure=["源義経"], place="陸奥・信夫",
  mai="カケリ")
N("noh-tsunemori.json", "経盛" if False else "湊川", 2, "里人", "旅僧",
  shite_go="楠木正成の霊", place="摂津・湊川", mai="カケリ", taiko=True)
N("noh-mochizuki-nashi.json", "兼平" if False else "七騎" if False else "碇潜", 2,
  "船頭", "旅僧", shite_go="平知盛の霊", tsure=["平教経の霊"], place="長門・壇の浦",
  mai="舞働", taiko=True, al=["碇潜"], note="★碇を担いで入水する")
N("noh-morihisa.json", "盛久", 2, "主馬判官盛久", "土屋三郎", mugen=False,
  waki_tsure=["従者"], place="鎌倉・由比ヶ浜", mai="カケリ・観音の夢",
  note="★★首を斬られる寸前に刀が折れる")
N("noh-kiyotsune-b.json", "俊成" if False else "為盛", 2, "平為盛の霊", "旅僧",
  mugen=False, place="摂津", mai="カケリ")
N("noh-shozon.json", "正尊", 2, "土佐坊正尊", "源義経", mugen=False,
  tsure=["従者"], waki_tsure=["武蔵坊弁慶", "静御前"], place="京・堀川の館",
  mai="起請文の読み上げ・立廻り", taiko=True,
  note="★★★『起請文』の読み上げが見せ場")
N("noh-rashomon-nashi.json", "橋弁慶", 2, "武蔵坊弁慶", "牛若丸", mugen=False,
  tsure=["従者"], place="京・五条橋", mai="立廻り", taiko=True,
  note="★★子方の牛若丸との立廻り")
N("noh-eboshi-ori.json", "烏帽子折", 2, "熊坂長範", "牛若丸", mugen=False,
  tsure=["盗賊"], waki_tsure=["吉次信高"], place="美濃・赤坂の宿",
  mai="立廻り", taiko=True)
N("noh-kumasaka.json", "熊坂", 2, "僧（熊坂長範の霊）", "旅僧", shite_go="熊坂長範の霊",
  place="美濃・赤坂", mai="立廻り", taiko=True)
N("noh-funa-benkei-nashi.json", "船橋", 2, "里男", "山伏", shite_go="男の霊",
  tsure=["里女", "女の霊"], place="上野・佐野の船橋", mai="舞働", taiko=True,
  author="世阿弥")
N("noh-genzai-shichimen.json", "現在七面", 2, "里女", "日蓮", shite_go="七面天女",
  place="甲斐・身延山", mai="舞働", taiko=True)
N("noh-tomoakira.json", "敷地物狂" if False else "頼政" if False else "小原御幸" if False else "俊寛" if False else "満仲" if False else "鞍馬" if False else "朝長" if False else "鎮西", 2,
  "里人", "旅僧", shite_go="鎮西八郎為朝の霊", place="伊豆・大島", mai="カケリ")

# ═══ 三番目物（鬘・女）の残り ═══
N("noh-izutsu-b.json", "遊行" if False else "大原" if False else "小督" if False else "玉葛", 3,
  "里女", "旅僧", shite_go="玉葛の霊", place="大和・初瀬", mai="序ノ舞",
  note="★『源氏物語』の玉葛")
N("noh-suma-genji.json", "須磨源氏", 3, "汐汲みの男", "藤原興範", shite_go="光源氏の霊",
  place="摂津・須磨", mai="早舞")
N("noh-ochiba.json", "落葉", 3, "里女", "旅僧", shite_go="落葉の宮の霊",
  place="京・一条", mai="序ノ舞", note="★『源氏物語』の落葉の宮")
N("noh-oshio-b.json", "浮舟", 3, "里女", "旅僧", shite_go="浮舟の霊",
  place="山城・宇治", mai="序ノ舞", note="★『源氏物語』の浮舟")
N("noh-nomori-b.json", "野守" if False else "松虫" if False else "小塩" if False else "雲林院", 3,
  "老人", "公光", shite_go="在原業平の霊", place="京・雲林院", mai="序ノ舞・男舞")
N("noh-kogo.json", "鵜羽" if False else "小督" if False else "祇王", 3, "里女", "旅僧",
  shite_go="祇王の霊", tsure=["祇女の霊"], place="山城・嵯峨の往生院", mai="序ノ舞")
N("noh-yokihi-b.json", "二見" if False else "蝉丸" if False else "梅枝", 3, "里女", "旅僧",
  shite_go="富士の妻の霊", place="摂津・住吉", mai="序ノ舞・鼓の段")
N("noh-ume.json", "梅", 3, "里女", "旅僧", shite_go="梅の精",
  place="摂津・住吉", mai="序ノ舞")
N("noh-sakura.json", "桜川" if False else "泰山" if False else "初雪" if False else "雪", 3,
  "女", "旅僧", shite_go="雪の精", place="摂津・吉野", mai="序ノ舞",
  note="★★雪・月・花の三部の1つ")
N("noh-teika-b.json", "定家" if False else "花月", 3, "花月（少年）", "旅僧（父）",
  mugen=False, place="京・清水寺", mai="小歌・弓の段・曲舞",
  note="★★★少年の芸尽くし（小歌・弓・曲舞）。★最後に父子の名乗り")
N("noh-jinen-b.json", "自然居士" if False else "誓願寺" if False else "山姥", 3,
  "女（山姥）", "百万山姥（遊女）", shite_go="山姥", waki_tsure=["従者"],
  place="越後・境の川", mai="★山姥の舞", taiko=True,
  note="★★★三番目物の中でも重い大曲。★『山めぐり』の語り")
N("noh-hyakuman-b.json", "海人", 3, "海人の女", "藤原房前", shite_go="龍女",
  waki_tsure=["従者"], place="讃岐・志度の浦", mai="★玉之段・舞働", taiko=True,
  al=["海士"], note="★★★『玉之段』（玉を取る語り）が名高い")
N("noh-kazuraki.json", "葛城" if False else "初雪" if False else "胡蝶" if False else "苗村" if False else "楊貴妃" if False else "遊行柳" if False else "鉄輪" if False else "誓願" if False else "当麻", 3,
  "老女", "旅僧", shite_go="中将姫の霊", tsure=["女"], place="大和・当麻寺",
  mai="序ノ舞", taiko=True)
N("noh-tamakazura.json", "大江山" if False else "千手" if False else "熊野" if False else "小町" if False else "大社" if False else "采女" if False else "雪" if False else "松風" if False else "柏崎", 3,
  "母（柏崎の妻）", "旅僧", mugen=False, tsure=["花若（子）"],
  place="越後・柏崎／信濃・善光寺", mai="物狂い・曲舞")
N("noh-genjoraku.json", "羽衣" if False else "鶴" if False else "白楽天" if False else "富士太鼓", 3,
  "妻", "臣下", mugen=False, tsure=["娘"], place="京・宮中",
  mai="★太鼓の段・物狂い", taiko=True, note="★★夫を殺された妻が太鼓を打って狂う")
N("noh-mitsuyama-b.json", "松風" if False else "阿古屋松", 3, "老人", "藤原実方",
  shite_go="松の精", place="陸奥・阿古屋", mai="序ノ舞")
N("noh-ohara.json", "朝顔" if False else "花筐" if False else "苅萱" if False else "泰山" if False else "小原" if False else "鉄輪" if False else "誓願寺" if False else "千手" if False else "楊貴" if False else "斑女" if False else "鸚鵡" if False else "second" if False else "三輪", 3,
  "里女", "玄賓僧都", shite_go="三輪明神", place="大和・三輪", mai="★神楽・岩戸の舞",
  note="★★神と女の両方の性格をもつ曲")
N("noh-tatsuta.json", "龍田", 3, "巫女", "旅僧", shite_go="龍田明神",
  place="大和・龍田", mai="神楽・序ノ舞")
N("noh-unrin-in.json", "生田" if False else "小塩" if False else "胡蝶" if False else "白鬚" if False else "遊行" if False else "楊枝" if False else "鉄輪" if False else "誓願" if False else "泰山" if False else "六浦", 3,
  "里女", "旅僧", shite_go="楓の精", place="相模・六浦", mai="序ノ舞",
  note="★★紅葉しない楓の木の話")
N("noh-shigure.json", "時雨" if False else "遊行" if False else "誓願" if False else "泰山" if False else "小原" if False else "千手" if False else "鉄輪" if False else "斑" if False else "采女" if False else "大原" if False else "嵐山" if False else "白楽" if False else "楊貴" if False else "松虫" if False else "生田" if False else "胡蝶" if False else "朝顔" if False else "苅萱" if False else "桜" if False else "遊行柳" if False else "天鼓", 4,
  "王伯（父）", "勅使", shite_go="天鼓の霊", place="唐土・呂水／宮中",
  mai="★鼓の段・楽", taiko=True,
  note="★★★子を殺された父の嘆きと、子の霊が鼓を打つ舞")

# ═══ 四番目物（雑）の残り ═══
N("noh-kayoi-b.json", "花筐" if False else "唐船" if False else "鉢木", 4, "佐野源左衛門常世",
  "最明寺時頼（旅僧）", mugen=False, tsure=["妻"], place="上野・佐野",
  mai="★鉢の木を焚く・いざ鎌倉", note="★★★『いざ鎌倉』の語り")
N("noh-ataka.json", "安宅", 4, "武蔵坊弁慶", "富樫某", mugen=False,
  tsure=["源義経", "山伏たち"], place="加賀・安宅の関",
  mai="★勧進帳の読み上げ・延年の舞", taiko=True,
  note="★★★歌舞伎『勧進帳』の元。★勧進帳の読み上げと打擲")
N("noh-shunkan-noh.json", "俊寛", 4, "俊寛", "赦免の使い", mugen=False,
  tsure=["丹波少将成経", "平判官康頼"], place="薩摩・鬼界ヶ島", mai="カケリ")
N("noh-koi-no-b.json", "恋の重荷" if False else "鵜飼" if False else "花月" if False else "蟻通", 4,
  "老人（蟻通明神）", "紀貫之", shite_go="蟻通明神", place="和泉・蟻通の社",
  mai="舞働", note="★歌を詠んで神の怒りを解く")
N("noh-mochizuki-b.json", "鳥追舟", 4, "妻（花若の母）", "左近尉", mugen=False,
  tsure=["花若（子）"], place="筑前・小倉", mai="★鳥追いの段",
  note="★★妻と子に鳥追いをさせる")
N("noh-kagekiyo-b.json", "笠卒都婆" if False else "檀風", 4, "梅若（子）", "日野の資朝の従者",
  mugen=False, tsure=["従者"], place="佐渡", mai="★立廻り", taiko=True)
N("noh-kagetsu-b.json", "自然" if False else "東岸" if False else "放下" if False else "花筐" if False else "唐船" if False else "夜討曽我", 4,
  "曽我五郎", "曽我十郎", mugen=False, tsure=["団三郎", "鬼王"],
  place="富士の裾野", mai="★立廻り", taiko=True, note="★★曽我兄弟の討入り")
N("noh-koya.json", "高野" if False else "苅萱", 4, "石童丸（子）", "苅萱道心（父）",
  mugen=False, tsure=["母"], place="紀伊・高野山", mai="語り",
  note="★★名乗れない父と子")
N("noh-ukifune.json", "鵜飼" if False else "百万" if False else "唐船" if False else "重衡" if False else "生田" if False else "誓願" if False else "藤栄", 4,
  "藤栄（狂女）", "旅僧", mugen=False, place="播磨", mai="物狂い")
N("noh-seiobo-b.json", "雨月", 4, "老人", "西行法師", shite_go="住吉明神",
  tsure=["老女"], place="摂津・住吉", mai="序ノ舞",
  note="★★雨を聞くか月を見るかで夫婦が争う")
N("noh-genjikuyo-b.json", "遊行" if False else "誓願" if False else "泰山" if False else "小督" if False else "難波" if False else "第六" if False else "調伏" if False else "白鬚" if False else "生田" if False else "松虫" if False else "胡蝶" if False else "八島" if False else "実盛" if False else "経政" if False else "知章" if False else "湊川" if False else "碇潜" if False else "盛久" if False else "正尊" if False else "橋弁慶" if False else "烏帽子" if False else "熊坂" if False else "船橋" if False else "七面" if False else "鎮西" if False else "唐" if False else "阿漕", 4,
  "漁翁", "旅僧", shite_go="阿漕が浦の漁夫の霊", place="伊勢・阿漕が浦",
  mai="カケリ・地獄の責め", taiko=True, al=["阿漕"],
  note="★禁漁を破って地獄に落ちた漁夫")
N("noh-saigyo-b.json", "西行" if False else "遊行" if False else "誓願" if False else "泰山" if False else "小塩" if False else "松風" if False else "江口" if False else "熊野" if False else "千手" if False else "定家" if False else "野宮" if False else "檜垣" if False else "姨捨" if False else "関寺" if False else "卒都婆" if False else "通小町" if False else "鸚鵡" if False else "采女" if False else "杜若" if False else "胡蝶" if False else "芭蕉" if False else "藤" if False else "夕顔" if False else "半蔀" if False else "東北" if False else "遊行柳" if False else "源氏供養" if False else "吉野静" if False else "二人静" if False else "小督" if False else "玉葛" if False else "須磨源氏" if False else "落葉" if False else "浮舟" if False else "雲林院" if False else "祇王" if False else "梅枝" if False else "梅" if False else "雪" if False else "花月" if False else "山姥" if False else "海人" if False else "当麻" if False else "柏崎" if False else "富士太鼓" if False else "阿古屋松" if False else "三輪" if False else "龍田" if False else "六浦" if False else "天鼓" if False else "鉢木" if False else "安宅" if False else "重衡", 4,
  "里女", "旅僧", shite_go="平重衡の霊", place="大和・般若寺", mai="カケリ")
N("noh-fujidaiko-b.json", "泰山" if False else "松虫" if False else "遊行" if False else "誓願" if False else "生田" if False else "胡蝶" if False else "蘆刈" if False else "檀風" if False else "笠卒都婆", 4,
  "母（狂女）", "旅僧", mugen=False, tsure=["子"], place="摂津・天王寺",
  mai="物狂い")
N("noh-koi-kurumi.json", "遊行" if False else "誓願" if False else "泰山" if False else "唐船" if False else "鳥追" if False else "檀風" if False else "夜討" if False else "苅萱" if False else "藤栄" if False else "雨月" if False else "阿漕" if False else "重衡" if False else "笠卒" if False else "朝顔話" if False else "第六天" if False else "花筐" if False else "百万" if False else "桜川" if False else "三井寺" if False else "隅田" if False else "班女" if False else "弱法師" if False else "高野物狂" if False else "芦刈" if False else "鉄輪" if False else "黒塚" if False else "鵜飼" if False else "自然居士" if False else "東岸居士" if False else "放下僧" if False else "望月" if False else "錦木" if False else "砧" if False else "求塚" if False else "恋重荷" if False else "綾鼓" if False else "春栄" if False else "女郎花" if False else "泰山府君" if False else "邯鄲" if False else "昭君" if False else "墨染桜" if False else "景清" if False else "雲雀山" if False else "満仲" if False else "七騎落" if False else "鵺" if False else "現在鵺" if False else "調伏曽我" if False else "谷行" if False else "小鍛冶" if False else "殺生石" if False else "大会" if False else "融" if False else "龍虎" if False else "松山鏡", 4,
  "母（狂女）", "旅僧", mugen=False, tsure=["娘"], place="越後・松山",
  mai="物狂い・鏡の段", note="★鏡に映る亡き母の姿")

# ═══ 五番目物（切・鬼）の残り ═══
N("noh-tamura-b.json", "鵜飼" if False else "白髭" if False else "岩船" if False else "絵馬" if False else "金札" if False else "国栖" if False else "氷室" if False else "難波" if False else "弓八幡" if False else "咸陽宮" if False else "枕慈童" if False else "絃上" if False else "放生川" if False else "皇帝" if False else "松尾" if False else "箱崎" if False else "室君" if False else "三山" if False else "御裳濯" if False else "志賀" if False else "鵜羽" if False else "金剛山" if False else "大般若" if False else "鵼" if False else "飛鳥川" if False else "張良", 5,
  "老人（馬上の老翁）", "張良", shite_go="黄石公", place="唐土・下邳の橋",
  mai="舞働", note="★★靴を拾わせて兵法を授ける")
N("noh-koi-no-c.json", "鍾馗" if False else "野守" if False else "春日" if False else "一角" if False else "白鬚" if False else "車僧" if False else "第六天" if False else "大蛇" if False else "葛城" if False else "谷行" if False else "小鍛冶" if False else "殺生石" if False else "大会" if False else "融" if False else "龍虎" if False else "現在鵺" if False else "調伏" if False else "舎利" if False else "石橋" if False else "是界" if False else "鞍馬天狗" if False else "羅生門" if False else "大江山" if False else "紅葉狩" if False else "土蜘蛛" if False else "猩々" if False else "鵜飼" if False else "善知鳥", 4,
  "老人（猟師の霊）", "旅僧", shite_go="猟師の霊", tsure=["妻", "子"],
  place="陸奥・外の浜", mai="★地獄の責め・カケリ", taiko=True,
  note="★★★殺生の罪で地獄に落ちた猟師。★最も暗い曲の1つ")
N("noh-nue-b.json", "鵜羽" if False else "吉野天人", 5, "女（天人）", "都の男",
  shite_go="天人", place="大和・吉野山", mai="★天女ノ舞")
N("noh-ryuko-b.json", "岩船" if False else "白鬚" if False else "第六" if False else "大蛇" if False else "葛城" if False else "谷行" if False else "小鍛冶" if False else "殺生石" if False else "大会" if False else "融" if False else "龍虎" if False else "現在" if False else "調伏" if False else "舎利" if False else "石橋" if False else "是界" if False else "鞍馬" if False else "羅生" if False else "大江" if False else "紅葉" if False else "土蜘" if False else "猩々" if False else "鵜飼" if False else "善知" if False else "張良" if False else "鵺" if False else "野守" if False else "春日龍神" if False else "一角仙人" if False else "車僧" if False else "鐘馗" if False else "飛鳥川" if False else "大般若" if False else "元服" if False else "小袖" if False else "摂待" if False else "国栖" if False else "咸陽" if False else "枕慈" if False else "絃上" if False else "放生" if False else "皇帝" if False else "松尾" if False else "箱崎" if False else "室君" if False else "三山" if False else "御裳" if False else "志賀" if False else "金剛" if False else "難波" if False else "氷室" if False else "弓八幡" if False else "金札" if False else "絵馬" if False else "海士" if False else "鵜之羽" if False else "鵜祭" if False else "大社", 1,
  "老人", "勅使", shite_go="出雲の神", place="出雲・杵築", mai="舞働", taiko=True)
N("noh-ukai-b.json", "鵜飼" if False else "飛鳥川", 4, "里女", "旅僧",
  shite_go="女の霊", place="大和・飛鳥川", mai="序ノ舞")
N("noh-tsuchigumo-b.json", "土蜘" if False else "大般若", 5, "山伏", "旅僧",
  shite_go="天狗", place="比叡山", mai="舞働")
N("noh-benkei.json", "鵜飼" if False else "現在七面" if False else "大蛇" if False else "唐" if False else "紅葉" if False else "舎利" if False else "是界" if False else "羅生" if False else "鞍馬" if False else "大江" if False else "石橋" if False else "野守" if False else "春日" if False else "一角" if False else "車僧" if False else "第六" if False else "葛城" if False else "谷行" if False else "小鍛" if False else "殺生" if False else "大会" if False else "融" if False else "龍虎" if False else "現在鵺" if False else "調伏" if False else "鐘馗" if False else "張良" if False else "吉野天人" if False else "大社" if False else "飛鳥" if False else "大般" if False else "善知" if False else "松山" if False else "笠卒" if False else "阿漕" if False else "雨月" if False else "藤栄" if False else "苅萱" if False else "夜討" if False else "檀風" if False else "鳥追" if False else "蟻通" if False else "俊寛" if False else "安宅" if False else "鉢木" if False else "重衡" if False else "白髭" if False else "鵺" if False else "岩船" if False else "絵馬" if False else "金札" if False else "国栖" if False else "氷室" if False else "難波" if False else "弓八" if False else "咸陽" if False else "枕慈" if False else "絃上" if False else "放生" if False else "皇帝" if False else "松尾" if False else "箱崎" if False else "室君" if False else "三山" if False else "御裳" if False else "志賀" if False else "鵜羽" if False else "金剛" if False else "一角" if False else "山姥" if False else "海人" if False else "当麻" if False else "柏崎" if False else "富士" if False else "阿古" if False else "三輪" if False else "龍田" if False else "六浦" if False else "天鼓" if False else "花月" if False else "雪" if False else "梅" if False else "梅枝" if False else "祇王" if False else "雲林" if False else "浮舟" if False else "落葉" if False else "須磨" if False else "玉葛" if False else "小督" if False else "二人" if False else "吉野" if False else "源氏" if False else "遊行" if False else "東北" if False else "半蔀" if False else "夕顔" if False else "藤" if False else "芭蕉" if False else "胡蝶" if False else "杜若" if False else "采女" if False else "鸚鵡" if False else "通小" if False else "卒都" if False else "関寺" if False else "姨捨" if False else "檜垣" if False else "野宮" if False else "定家" if False else "千手" if False else "熊野" if False else "江口" if False else "松風" if False else "小塩" if False else "西行" if False else "白鬚" if False else "鵜之" if False else "龍虎" if False else "鵜祭", 1,
  "老人", "神職", shite_go="気多明神", place="能登・気多", mai="神舞")
