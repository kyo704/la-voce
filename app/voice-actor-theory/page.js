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
  timelineStart: { ja: "セッション開始", en: "Session start" },
  timelineOnset: { ja: "疲労を自覚し始める", en: "Fatigue perceived" },
  timelineEnd: { ja: "セッション終了（約8,354m相当）", en: "Session ends (≈8,354m dose)" },
  timelineRecovery: { ja: "声帯が回復", en: "Vocal folds recover" },
  eyebrow: { ja: "FOR VOICE ACTORS", en: "FOR VOICE ACTORS" },
  title: { ja: "声優のための声と体の理論", en: "Voice & Body Theory for Voice Actors" },
  intro: { ja: "声優の仕事は、他の声を使う職業と比べても特殊な負荷がかかります。数時間の収録の中で、まったく異なる複数のキャラクターを演じ分け、叫び・ささやき・感情の起伏までを、次のテイクでも同じクオリティで再現し続けなければなりません。ここでは、収録時間と声帯疲労の関係を示す研究データ、健康なキャラクターボイスの作り方の基礎、そして声優として知っておきたい実践知をまとめています。", en: "Voice acting places demands on the voice that are distinct even from other voice-heavy professions. Within a single recording session spanning several hours, you may need to switch between multiple, completely different characters — screams, whispers, emotional swings — while reproducing the same quality take after take. This page covers research data on the relationship between session length and vocal fatigue, the fundamentals of building healthy character voices, and practical knowledge every voice actor should have." },
  s1title: { ja: "収録セッションの長さと声帯疲労の関係", en: "Session Length and Vocal Fatigue" },
  s1p1: { ja: "声優の声帯疲労は、感覚だけでなく、実際に測定研究の対象になっています。ある研究では、4時間の収録セッションを行ったプロの声優16名に、喉に装着する加速度センサー(NSA)を取り付けて計測したところ、平均で約8,354mに相当する「振動距離量」が声帯にかかっていたことが報告されています。これは声帯がその日1日で物理的にどれだけ振動し続けたか、という負荷の指標です。", en: "Vocal fatigue in voice actors isn't just a matter of how it feels — it has been directly measured in research. One study fitted 16 professional voice actors with neck-surface accelerometers during 4-hour recording sessions and found an average accumulated \"distance dose\" of about 8,354 meters on the vocal folds — a physical measure of how far the vocal folds vibrated, cumulatively, over the course of the day." },
  s1p2: { ja: "さらに重要なのは、疲労の自覚が始まるタイミングです。同じ研究では、参加者はセッション開始からわずか2時間ほどで、すでに声の疲れを自覚し始めていたと報告されています。回復には、セッション終了から24〜48時間ほどかかることも分かっています。つまり「今日は大丈夫だった」と感じても、翌日・翌々日まで疲労が残っている可能性があるということです。", en: "Just as important is when fatigue perception begins. In the same study, participants reported perceiving vocal fatigue as early as about 2 hours into the session. Recovery took roughly 24 to 48 hours after the session ended. In other words, even if a session feels fine on the day, fatigue may still be present the next day or the day after." },
  s1p3: { ja: "音響的な指標として特に有効とされているのが、「ケプストラルピークプロミネンス(CPP)」と「スペクトラルティルト」という2つの数値です。これらは、朗読課題での声を分析することで、本人の疲労の自覚とよく一致する変化を示すことが分かっています。専門的な数値ですが、「声の疲労は、本人の感覚と、実際の音の物理的な変化の両方に表れる」という点が重要です。", en: "Two acoustic metrics have proven especially useful for tracking this: cepstral peak prominence (CPP) and spectral tilt. When measured from a passage-reading task, changes in these values closely track a person's own sense of vocal fatigue. The specific numbers are technical, but the key point is this: vocal fatigue shows up both in how it feels and in measurable, physical changes to the sound itself." },
  s1p4: { ja: "また別の研究では、トレーニング中の役者37名に、70〜80dB(かなり大きな声量)で30〜45分間の朗読課題を行わせたところ、課題後には音響的な指標にも、聴覚的な評価にも、明確な変化が現れました。大声量での発声を30分以上続けることは、それだけで声にはっきりとした負荷を与える、という裏付けになるデータです。", en: "Another study had 37 actors in training read a passage for 30-45 minutes at 70-80 dB SPL — a fairly loud volume — and found clear changes in both acoustic metrics and perceptual ratings afterward. This supports the idea that sustaining loud vocalization for more than about 30 minutes places a measurable, distinct load on the voice." },
  s1callout: { ja: "収録現場でのガイドラインとして、「1時間ごとに最低10分の休憩を取る」という基準が、声の専門家によって提案されています。これは感覚的な目安ではなく、疲労が測定可能な形で蓄積していくという研究結果を踏まえた、具体的な数字です。", en: "Voice specialists have proposed a concrete guideline for recording sessions: at least a 10-minute break every hour. This isn't an arbitrary rule of thumb — it's grounded in research showing that fatigue accumulates in measurable ways over the course of a session." },
  s2title: { ja: "「正しい発声」とは何か", en: "What Counts as \"Correct\" Vocalization" },
  s2p1: { ja: "声優にとっての「正しい発声」は、美しい声を出すことではなく、「同じキャラクターを、何十テイクも、何時間にもわたって、声を壊さずに再現し続けられる発声」のことです。その土台になるのが、喉ではなく呼吸から声を支えるという考え方です。", en: "For a voice actor, \"correct\" vocalization isn't about producing a beautiful sound — it's about being able to reproduce the same character, take after take, hour after hour, without damaging the voice. The foundation for this is supporting the voice from the breath, not from the throat." },
  s2p2: { ja: "喉を絞ってざらついた声、しゃがれた声、叫び声のようなキャラクターボイスを作ると、その場では「それらしい」音が出せても、長時間のセッションでは声帯を痛める原因になります。健康なキャラクターボイスは、呼吸の支えと、声を響かせる位置(共鳴のポイント)の調整、そして体の姿勢の使い方によって作られます。", en: "Building a character voice by straining the throat — rough, hoarse, or shouted — may produce a convincing sound in the moment, but over a long session it becomes a source of vocal fold damage. A healthy character voice is instead built from breath support, adjustments to resonance placement, and the physical posture used while speaking." },
  s2callout: { ja: "見分け方の目安として、「そのキャラクターボイスを10分間続けただけで疲れてしまうなら、そのやり方では長時間の収録に耐えられない」と言われます。逆に、呼吸と共鳴の調整だけで作られたキャラクターボイスは、声帯そのものには負担がかかりにくく、長時間のセッションでも再現し続けやすいとされています。", en: "A useful rule of thumb: if a character voice tires you out within just ten minutes, that approach won't hold up for a long session. A character voice built purely from breath and resonance adjustments, by contrast, places little direct strain on the vocal folds and tends to be sustainable across a long session." },
  s3title: { ja: "キャラクターボイスの負担と手法の基礎", en: "The Basics of Character Voice Technique and Its Costs" },
  s3item1term: { ja: "低く重いキャラクター(悪役など)", en: "Low, heavy characters (villains, etc.)" },
  s3item1desc: { ja: "呼吸の支え＋低めの共鳴位置＋それに合わせた姿勢、という組み合わせで作ります。喉を無理に締めて低音を出そうとすると、声帯への負担が大きくなります。", en: "Built from a combination of breath support, lower resonance placement, and a matching posture. Forcing the throat to squeeze out a lower pitch places significant strain on the vocal folds." },
  s3item2term: { ja: "高く軽いキャラクター(幼い声・妖精など)", en: "High, light characters (childlike voices, pixies, etc.)" },
  s3item2desc: { ja: "呼吸の支え＋高めの響きの位置＋それに応じた体の使い方、という組み合わせで作ります。声帯自体は健康な状態を保ちながら、キャラクターらしさを表現できます。", en: "Built from breath support, a higher resonance placement, and a corresponding physical commitment. This allows the character to come through while the vocal folds themselves stay in a healthy state." },
  s3item3term: { ja: "喉を基点にしたキャラクターボイスのリスク", en: "The risk of throat-based character voices" },
  s3item3desc: { ja: "ざらついた声、しゃがれ声、叫び声、ささやき声など、喉そのものを歪ませて作るキャラクターボイスは、長時間のセッションを重ねることで、声帯結節・ポリープ・筋緊張性発声障害(MTD)のリスクを高めることが指摘されています。", en: "Character voices built by distorting the throat itself — rough, hoarse, screamed, or breathy voices — are noted to raise the risk of vocal nodules, polyps, and muscle tension dysphonia (MTD) when repeated across many long sessions." },
  s4title: { ja: "その他、声優が知っておきたいこと", en: "Other Things Voice Actors Should Know" },
  s4item1term: { ja: "音質の変化は、声のコンディションのサイン", en: "Changes in audio quality are a sign of vocal condition" },
  s4item1desc: { ja: "脱水した声は「クリック音」や口の中の雑音が増え、疲労した声は「ブレシー(息もれ)」な音が増え、力み過ぎた声には微細な「かすれ」が生じます。週を通して収録データのノイズが増えてきたと感じたら、それは機材ではなく、声そのものの変化であることが多いとされています。", en: "A dehydrated voice tends to produce more clicks and mouth noise; a fatigued voice produces more breathy artifacts; an over-strained voice produces subtle audible cracks. If recordings get noisier over the course of a week, it's often the voice that changed, not the gear." },
  s4item2term: { ja: "セッション内で声量の強弱に順番をつける", en: "Sequence loud and quiet material within a session" },
  s4item2desc: { ja: "声が元気なセッション前半に、大きな声量や激しい表現を必要とする収録を持ってきて、静かな表現は後半に回すと、声への負担を抑えやすくなります。", en: "Placing loud, high-intensity material earlier in the session — while the voice is still fresh — and saving quieter material for later helps reduce overall strain on the voice." },
  s4item3term: { ja: "初期警告サインを見逃さない", en: "Don't miss the early warning signs" },
  s4item3desc: { ja: "軽いイガイガ感、喉の締めつけ感、高音域がわずかに出しにくくなる感覚——これらは、本格的なダメージが起こる前に体が発している合図とされています。感じたら、無理を続けずに休憩を取ることが推奨されています。", en: "A slight tickle, a feeling of tightness, or a subtle loss of range at the top of your voice are described as the body's early warning signs before real damage occurs. When you notice them, it's recommended that you take a break rather than push through." },
  s4item4term: { ja: "セッション後のクールダウン", en: "Cooling down after a session" },
  s4item4desc: { ja: "収録後は、温かい飲み物をゆっくり摂り、しばらく声を出さない時間を作ることが、喉のクールダウンとして有効とされています。ウォーミングアップと同じくらい、クールダウンも軽視しない方がよいとされています。", en: "After a session, sipping a warm drink slowly and giving yourself a period of not speaking is considered an effective way to cool the throat down. Cool-down deserves as much attention as warm-up, not less." },
  footer: { ja: "主な参考: Yiu et al. (2021) 頸部装着型加速度センサーによる声優の職業的音声モニタリング研究／ビデオゲーム音声収録における「Vocal Combat Technique」の無作為化比較試験研究／トレーニング俳優37名を対象とした発声負荷研究／プロの声優・ボイスコーチによる実践知の一般的なまとめ。本ページは声優の発声に関する一般的な知見を整理したものであり、特定の指導法や製品を推奨するものではありません。症状が続く場合は、耳鼻咽喉科（できれば音声を専門とする医師）にご相談ください。", en: "Main references: Yiu et al. (2021), a study on occupational voice monitoring in voice actors using neck-mounted accelerometers / a randomized controlled trial of the \"Vocal Combat Technique\" during video game voice recording / a vocal-loading study involving 37 actors in training / general practical knowledge from professional voice actors and voice coaches. This page summarizes general knowledge on vocal technique for voice acting and does not endorse any specific method or product. If symptoms persist, please consult an ENT specialist, ideally one who specializes in voice care." },
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

// 4時間セッションにおける疲労の時間経過を示す簡易タイムライン
// （研究データ：2時間で疲労自覚開始、4時間で約8,354m相当の振動距離量、24〜48時間で回復）
function FatigueTimeline({ lang }) {
  const points = [
    { x: 40, labelKey: "timelineStart", sub: "0h" },
    { x: 260, labelKey: "timelineOnset", sub: "2h" },
    { x: 480, labelKey: "timelineEnd", sub: "4h" },
    { x: 620, labelKey: "timelineRecovery", sub: "24-48h" }
  ];
  return (
    <svg viewBox="0 0 680 140" width="100%" style={{ display: "block", margin: "24px auto" }}>
      <line x1="40" y1="60" x2="620" y2="60" stroke={C.line} strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy="60" r="6" fill={i === 1 ? C.rust : C.gold} />
          <text x={p.x} y="90" fontSize="11" fill={C.inkSoft} textAnchor="middle">{p.sub}</text>
          <text x={p.x} y="35" fontSize="11.5" fill={C.ink} textAnchor="middle" fontWeight="600">{tr(p.labelKey, lang)}</text>
        </g>
      ))}
    </svg>
  );
}

export default function VoiceActorTheoryPage({ searchParams }) {
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
              href={`/voice-actor-theory?lang=${l.code}`}
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

      {/* 収録セッションと声帯疲労 */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s1title", lang)}>
        <p>{tr("s1p1", lang)}</p>
        <FatigueTimeline lang={lang} />
        <p>{tr("s1p2", lang)}</p>
        <p>{tr("s1p3", lang)}</p>
        <p>{tr("s1p4", lang)}</p>
        <Callout>{tr("s1callout", lang)}</Callout>
      </Section>

      {/* 正しい発声とは何か */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s2title", lang)} accent={C.sage}>
        <p>{tr("s2p1", lang)}</p>
        <p>{tr("s2p2", lang)}</p>
        <Callout>{tr("s2callout", lang)}</Callout>
      </Section>

      {/* キャラクターボイスの負担と手法の基礎 */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s3title", lang)} accent={C.rust}>
        <div>
          {[1, 2, 3].map((n) => (
            <GlossaryItem key={n} term={tr(`s3item${n}term`, lang)}>{tr(`s3item${n}desc`, lang)}</GlossaryItem>
          ))}
        </div>
      </Section>

      {/* その他、声優が知っておきたいこと */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s4title", lang)}>
        <div>
          {[1, 2, 3, 4].map((n) => (
            <GlossaryItem key={n} term={tr(`s4item${n}term`, lang)}>{tr(`s4item${n}desc`, lang)}</GlossaryItem>
          ))}
        </div>
      </Section>

      <p style={{ marginTop: 56, fontSize: 11.5, color: C.inkSoft, borderTop: `1px solid ${C.line}`, paddingTop: 20, lineHeight: 1.8 }}>
        {tr("footer", lang)}
      </p>
    </main>
  );
}
