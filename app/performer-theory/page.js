import { C } from "@/lib/tokens";

const LANGS = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ko", label: "한국어" }
];

const T = {
  diagramTitle: { ja: "イヤモニあり・なしの違い", en: "With vs. Without In-Ear Monitors" },
  diagramWithoutTitle: { ja: "イヤモニ無し", en: "Without IEM" },
  diagramWithoutDesc: { ja: "周囲の音量に応じて\nモニター音量も無制限に上昇", en: "Monitor volume rises\nunbounded with ambient noise" },
  diagramWithTitle: { ja: "イヤモニあり", en: "With IEM" },
  diagramWithDesc: { ja: "耳を密閉し、周囲の音量に\n左右されない一定音量を確保", en: "Seals the ear canal, delivering\na controlled volume regardless of ambient noise" },
  eyebrow: { ja: "FOR POP / MUSICAL PERFORMERS", en: "FOR POP / MUSICAL PERFORMERS" },
  title: { ja: "ポップス/ミュージカル歌手のための声と体の理論", en: "Voice & Body Theory for Pop and Musical Theater Singers" },
  intro: { ja: "ツアーや連続公演という働き方は、声楽の本番とはまた違った種類の負荷を体にかけます。移動と睡眠不足の蓄積、大音量の環境で自分の声を聴き取り続けるという特殊な負担、そして休みなく続く公演日程。ここでは、ツアー疲労の正体、大音量環境でのモニタリングが体に与える影響とその対策、連続公演を乗り切るための考え方をまとめています。", en: "Touring and consecutive performances place a different kind of load on the body than a single classical performance. Accumulated fatigue from travel and sleep loss, the specific strain of continuously monitoring your own voice in a loud environment, and a performance schedule with little rest — this page covers what tour fatigue actually is, how loud-environment monitoring affects the body and how to manage it, and how to think about getting through consecutive show days." },
  s1title: { ja: "ツアー疲労の原因と対策", en: "The Causes of Tour Fatigue and How to Manage It" },
  s1p1: { ja: "ライブ後に喉が疲れる感覚には、実は原因の異なる複数のタイプが混ざっていると考えられています。1つは単純な「声帯そのものの酷使」ですが、それとは別に見過ごされがちなのが、「全身の疲労や炎症が、声帯の回復を遅らせているタイプ」です。ツアー中の睡眠不足、偏った食事、連日の移動による疲労の蓄積は、体全体の炎症が引きにくい状態を作り、声帯という末端組織の回復にも影響します。", en: "The tired-throat feeling after a live show is thought to actually be a mix of several distinct causes. One is simple overuse of the vocal folds themselves. But a less obvious factor is whole-body fatigue and inflammation slowing down vocal fold recovery. Sleep deprivation during a tour, an unbalanced diet, and accumulated fatigue from daily travel all create a body-wide state where inflammation doesn't resolve easily — and that affects recovery even in a peripheral tissue like the vocal folds." },
  s1p2: { ja: "厄介なのは、この「喉そのものの力み」タイプと「全身の炎症」タイプが、本人の自覚症状としてはほぼ同じに感じられる点です。どちらも「ライブ後に喉が重い」「声が抜けない」「翌日も疲れが残る」という、似た訴えになります。ですが原因が違えば、必要な対策もまったく異なります。喉だけをケアしても、全身の疲労が土台にある場合は根本的な解決になりません。", en: "What makes this tricky is that throat tension and whole-body inflammation feel almost identical to the person experiencing them — both show up as \"my throat feels heavy after the show,\" \"my voice won't come out cleanly,\" or \"I'm still tired the next day.\" But because the causes differ, so do the fixes. Caring for the throat alone won't solve the problem if whole-body fatigue is the real underlying issue." },
  s1item1term: { ja: "声を出さない時間を作る", en: "Build in time without speaking" },
  s1item1desc: { ja: "喉の疲れを回復させる最も効果的な方法は、シンプルに「声を出さないこと」です。疲れているのに無理に声を出し続けると、疲労がそのまま炎症に発展する可能性があります。", en: "The single most effective way to recover from vocal fatigue is simply not using your voice. Continuing to push through fatigue risks turning that fatigue into inflammation." },
  s1item2term: { ja: "こまめな水分補給と湿度管理", en: "Frequent hydration and humidity control" },
  s1item2desc: { ja: "喉の粘膜は乾燥に弱いため、常温の水やぬるま湯を少しずつ、こまめに摂ることが回復を助けます。冷たい飲み物や刺激の強い飲み物は避け、部屋の湿度は50〜60%程度に保つのが目安です。", en: "The throat's mucosa is vulnerable to dryness, so sipping room-temperature water little and often helps recovery. Avoid cold or strongly stimulating drinks, and aim to keep room humidity around 50-60%." },
  s1item3term: { ja: "カフェイン・アルコールを控える", en: "Limit caffeine and alcohol" },
  s1item3desc: { ja: "カフェインにもアルコールにも利尿作用があり、体から水分を奪います。歌う前後は、特に控えることが推奨されています。", en: "Both caffeine and alcohol have a diuretic effect that draws fluid out of the body. It's especially worth limiting them around the times you sing." },
  s1item4term: { ja: "喉に良いとされる食材", en: "Foods considered good for the throat" },
  s1item4desc: { ja: "大根、ハチミツ、生姜、梨、かりんなどが、喉に良いとされる代表的な食材です。日々の発声で酷使した喉を、こうした食べ物・飲み物でいたわる習慣が、プロの間でも広く実践されています。", en: "Daikon radish, honey, ginger, pear, and quince are commonly cited as throat-friendly foods. Caring for a throat worked hard by daily singing with foods and drinks like these is a widely practiced habit among professionals." },
  s1callout: { ja: "同じステージに立っても、翌朝の声の回復スピードには個人差があります。その差の少なくとも一部は、「喉そのものの負担」ではなく「土台となる体全体のコンディション」の違いだと考えられています。ツアー中は、喉のケアと同じくらい、睡眠・食事・移動による疲労蓄積そのものへの対策が重要です。", en: "Even after standing on the same stage, recovery speed the next morning varies from person to person. At least part of that difference is thought to come not from throat strain itself, but from the underlying condition of the whole body. During a tour, managing the fatigue that builds up from sleep, diet, and travel matters just as much as caring for the throat directly." },
  s2title: { ja: "大音量環境でのモニタリングと、その克服方法", en: "Monitoring in Loud Environments, and How to Manage It" },
  s2p1: { ja: "バンドや大音量の環境で歌う歌手にとって、自分の声を正確に聴き取れないことは、それ自体が大きな問題です。周囲の音に自分の声がかき消されると、音程が不安定になったり、声のダイナミクスをコントロールできなくなったりして、結果的にシャウトするような発声になりがちです。これは自分では気づきにくく、後で録音を聴き返して初めて分かることも多いとされています。", en: "For a singer performing with a band or in a loud environment, not being able to hear their own voice accurately is a serious problem in itself. When the voice gets buried under surrounding sound, pitch becomes unstable and dynamic control breaks down — often leading to something closer to shouting than singing. This is hard to notice in the moment and is often only discovered later when listening back to a recording." },
  s2p2: { ja: "この問題への解決策として広く使われているのが、耳の型を採って作るカスタムイヤモニター(イヤモニ)です。耳を密閉することで外部の音圧に左右されない静かな環境を耳の中に作り出し、適切な音量でモニター音だけを返します。これにより、聴覚を保護しながら、音楽表現に必要な音の強弱(ダイナミクス)を確保できます。", en: "The widely used solution to this is a custom in-ear monitor (IEM), molded from an impression of the performer's own ear. By sealing the ear canal, it creates a quiet environment inside the ear that's independent of the ambient sound pressure on stage, returning only the monitor mix at an appropriate volume. This protects hearing while still preserving the dynamic range needed for musical expression." },
  s2p3: { ja: "一方で、イヤモニには「遮音性が高すぎて、観客の声援や会場の一体感が聴こえなくなる」という副作用もあります。これに対しては、ステージ前方にマイクを設置し、観客の音を意図的にモニターミックスへ混ぜ込む、といった工夫が行われています。片耳だけイヤモニを使う対応をする歌手もいますが、その場合、片方の耳だけに音量が集中し、かえって難聴のリスクを高める可能性があるため注意が必要です。", en: "On the other hand, IEMs have a known downside: their isolation can be so effective that performers lose the sense of the crowd and the room. A common workaround is placing microphones at the front of the stage and deliberately mixing that ambient crowd sound back into the monitor feed. Some singers use an IEM in only one ear to stay connected to the room, but this concentrates volume in that single ear and can actually raise the risk of hearing damage, so it needs care." },
  s2p4: { ja: "ミュージシャンの難聴は、決して珍しい話ではありません。大きな音に一度でもさらされることで起こる「音響外傷」と、継続的に大きな音を聴き続けることで進行する「慢性的な難聴」の両方のリスクがあります。5年後、10年後の聴力に、日々の音量管理が明確に差として表れるとされています。イヤモニに加えて、耳の型を採ったオーダーメイドの耳栓を、リハーサルや音響チェックの際に併用することも、有効な対策の一つです。", en: "Hearing loss among musicians is far from rare. There are two distinct risks: acute acoustic trauma from a single very loud exposure, and progressive chronic hearing loss from repeated exposure over time. Daily volume management is understood to make a clear, measurable difference in hearing five or ten years down the line. Alongside IEMs, wearing custom-molded earplugs — made from an ear impression — during rehearsals and sound checks is one effective additional measure." },
  s3title: { ja: "連続公演を乗り切るための考え方", en: "How to Think About Getting Through Consecutive Show Days" },
  s3p1: { ja: "連続公演は、1回のライブの疲労が完全に抜けきる前に、次の本番が来てしまう状態です。前述の「全身の疲労が声帯の回復を遅らせるタイプ」の負荷が、日を追うごとに積み重なりやすいのが最大の特徴です。", en: "Consecutive performances mean the next show arrives before you've fully recovered from the last one. The defining feature is that the \"whole-body fatigue slows vocal fold recovery\" pattern described above tends to compound day after day." },
  s3list1: { ja: "毎日、できるだけ長く睡眠時間を確保する。声を酷使した日ほど、睡眠以外に有効な回復手段はほとんど無いとされている", en: "Prioritize getting as much sleep as possible every day. On days when the voice was pushed hard, there's said to be almost no substitute for sleep as a recovery method" },
  s3list2: { ja: "本番当日以外は、発声そのものを控えめにし、私語や大きな声での会話を減らして声帯を休ませる", en: "On non-show days, keep vocal use itself modest — reduce casual talking and loud conversation to give the vocal folds rest" },
  s3list3: { ja: "公演スケジュールの合間に、栄養バランスの整った食事を意識的に取り入れる。偏った食事は全身の炎症が引きにくい状態を助長する", en: "Deliberately work nutritionally balanced meals into the schedule between shows — an unbalanced diet contributes to a body state where inflammation doesn't resolve easily" },
  s3list4: { ja: "移動そのものが疲労源であることを前提に、移動中も可能な範囲で休息を取る", en: "Recognize that travel itself is a source of fatigue, and rest as much as possible during transit" },
  s3list5: { ja: "「今日は声が出た」で終わらせず、翌日・翌々日に疲労が持ち越されていないかを、連続公演の間じゅう意識し続ける", en: "Don't stop at \"the voice held up today\" — keep checking throughout the run whether fatigue is carrying over into the next day or the day after" },
  footer: { ja: "主な参考: ライブ後の喉の疲労タイプに関する一般的な考察／プロのボーカリストによる喉ケア・食事に関する実践知の一般的なまとめ／カスタムイヤモニター開発関係者へのインタビュー記事／ミュージシャンの難聴リスクに関する一般的な知見。本ページはツアー・ライブパフォーマンスに関する一般的な知見を整理したものであり、特定の指導法や製品を推奨するものではありません。耳鳴りや聴力低下、声のかすれが続く場合は、それぞれ耳鼻咽喉科（できれば音声・聴覚を専門とする医師）にご相談ください。", en: "Main references: general discussion on the different types of post-show throat fatigue / general practical knowledge on vocal care and diet from professional vocalists / interviews with custom in-ear-monitor industry professionals / general knowledge on hearing-loss risk among musicians. This page summarizes general knowledge on touring and live performance and does not endorse any specific method or product. If you experience persistent tinnitus, hearing loss, or hoarseness, please consult an ENT specialist, ideally one who specializes in voice or hearing care." },
};

function tr(key, lang) {
  const entry = T[key];
  if (!entry) return "";
  return entry[lang] || entry.en || entry.ja || "";
}

function Section({ eyebrow, title, children, accent }) {
  return (
    <section style={{ marginTop: 56 }}>
      <p style={{ fontSize: 11.5, letterSpacing: "0.12em", color: accent || C.gold, fontWeight: 700, marginBottom: 6 }}>
        {eyebrow}
      </p>
      <h2 className="ff-display italic" style={{ fontSize: "1.9rem", color: C.ink, margin: "0 0 16px" }}>
        {title}
      </h2>
      <div style={{ color: C.ink, fontSize: 14.5, lineHeight: 1.95 }}>{children}</div>
    </section>
  );
}

function Callout({ children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", margin: "18px 0", fontSize: 13.5, color: C.inkSoft, lineHeight: 1.8 }}>
      {children}
    </div>
  );
}

function GlossaryItem({ term, children }) {
  return (
    <div style={{ borderTop: `1px solid ${C.line}`, padding: "16px 0" }}>
      <p style={{ margin: 0, fontWeight: 600, color: C.curtain, fontSize: 14.5 }}>{term}</p>
      <p style={{ margin: "6px 0 0", color: C.inkSoft, fontSize: 13.5, lineHeight: 1.8 }}>{children}</p>
    </div>
  );
}

// イヤモニ無し（周囲の音量に応じてモニター音量が無制限に上がる）と
// イヤモニあり（耳を密閉し、一定の安全な音量を保つ）の違いを示す簡易図
function MonitoringDiagram({ lang }) {
  return (
    <svg viewBox="0 0 680 220" width="100%" style={{ display: "block", margin: "24px auto" }}>
      {/* 左：イヤモニ無し */}
      <text x="170" y="24" fontSize="13" fontWeight="600" fill={C.curtain} textAnchor="middle">{tr("diagramWithoutTitle", lang)}</text>
      <path d="M50,180 L120,140 L170,60 L220,140 L290,180" fill="none" stroke={C.rust} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="50" y1="180" x2="290" y2="180" stroke={C.line} strokeWidth="1.5" />
      <text x="170" y="205" fontSize="11.5" fill={C.inkSoft} textAnchor="middle">
        <tspan x="170" dy="0">{tr("diagramWithoutDesc", lang).split("\n")[0]}</tspan>
        <tspan x="170" dy="14">{tr("diagramWithoutDesc", lang).split("\n")[1]}</tspan>
      </text>

      {/* 右：イヤモニあり */}
      <text x="510" y="24" fontSize="13" fontWeight="600" fill={C.sage} textAnchor="middle">{tr("diagramWithTitle", lang)}</text>
      <path d="M390,180 L440,100 L460,100 L490,100 L520,100 L560,100 L580,100 L630,180" fill="none" stroke={C.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="390" y1="180" x2="630" y2="180" stroke={C.line} strokeWidth="1.5" />
      <text x="510" y="205" fontSize="11.5" fill={C.inkSoft} textAnchor="middle">
        <tspan x="510" dy="0">{tr("diagramWithDesc", lang).split("\n")[0]}</tspan>
        <tspan x="510" dy="14">{tr("diagramWithDesc", lang).split("\n")[1]}</tspan>
      </text>
    </svg>
  );
}

export default function PerformerTheoryPage({ searchParams }) {
  const lang = LANGS.some((l) => l.code === searchParams?.lang) ? searchParams.lang : "ja";

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 96px", lineHeight: 1.8, fontSize: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: 11.5, letterSpacing: "0.14em", color: C.gold, fontWeight: 700, margin: 0 }}>
          {tr("eyebrow", lang)}
        </p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {LANGS.map((l) => (
            <a
              key={l.code}
              href={`/performer-theory?lang=${l.code}`}
              style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 999,
                border: `1px solid ${lang === l.code ? C.curtain : C.line}`,
                background: lang === l.code ? C.curtain : "transparent",
                color: lang === l.code ? "#FFFDF8" : C.inkSoft,
                textDecoration: "none"
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <h1 className="ff-display italic" style={{ fontSize: "2.6rem", color: C.curtain, margin: "10px 0 0", lineHeight: 1.2 }}>
        {tr("title", lang)}
      </h1>
      <p style={{ color: C.inkSoft, marginTop: 16, lineHeight: 1.9 }}>
        {tr("intro", lang)}
      </p>

      {/* ツアー疲労の原因と対策 */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s1title", lang)}>
        <p>{tr("s1p1", lang)}</p>
        <p>{tr("s1p2", lang)}</p>
        <div>
          {[1, 2, 3, 4].map((n) => (
            <GlossaryItem key={n} term={tr(`s1item${n}term`, lang)}>{tr(`s1item${n}desc`, lang)}</GlossaryItem>
          ))}
        </div>
        <Callout>{tr("s1callout", lang)}</Callout>
      </Section>

      {/* 大音量環境でのモニタリング */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s2title", lang)} accent={C.sage}>
        <p>{tr("s2p1", lang)}</p>
        <p>{tr("s2p2", lang)}</p>
        <MonitoringDiagram lang={lang} />
        <p style={{ textAlign: "center", fontSize: 12.5, color: C.inkSoft, marginTop: -8 }}>{tr("diagramTitle", lang)}</p>
        <p>{tr("s2p3", lang)}</p>
        <p>{tr("s2p4", lang)}</p>
      </Section>

      {/* 連続公演を乗り切るための考え方 */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s3title", lang)} accent={C.rust}>
        <p>{tr("s3p1", lang)}</p>
        <ul style={{ paddingLeft: 20, margin: "12px 0" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n} style={{ marginBottom: 8 }}>{tr(`s3list${n}`, lang)}</li>
          ))}
        </ul>
      </Section>

      <p style={{ marginTop: 56, fontSize: 11.5, color: C.inkSoft, borderTop: `1px solid ${C.line}`, paddingTop: 20, lineHeight: 1.8 }}>
        {tr("footer", lang)}
      </p>
    </main>
  );
}
