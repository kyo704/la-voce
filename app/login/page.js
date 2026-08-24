import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isNativeApp } from "@/lib/isNativeApp";
import { C } from "@/lib/tokens";

const LANGS = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ko", label: "한국어" },
];

const T = {
  heroIntro: { ja: "声楽家にとって、楽器は自分自身の身体です。\nけれど多くの人は、その楽器の調子を「なんとなく」でしか把握していません。", en: "For a singer, the instrument is the body itself.\nYet most people only have a vague sense of how that instrument is doing.", zh: "对声乐家而言，乐器就是自己的身体。\n然而大多数人，对这件乐器的状态，只有一种模糊的感觉。", it: "Per un cantante, lo strumento è il proprio corpo.\nEppure la maggior parte delle persone ne conosce solo vagamente lo stato.", de: "Für eine Sängerin oder einen Sänger ist das Instrument der eigene Körper.\nDoch die meisten Menschen haben nur ein vages Gefühl dafür, wie es diesem Instrument gerade geht.", fr: "Pour un chanteur, l'instrument, c'est le corps lui-même.\nPourtant, la plupart des gens n'en ont qu'une idée vague de son état du moment.", es: "Para un cantante, el instrumento es su propio cuerpo.\nSin embargo, la mayoría solo tiene una idea vaga de cómo está ese instrumento.", ko: "성악가에게 악기란 자기 자신의 몸입니다.\n하지만 대부분의 사람들은 그 악기의 상태를 그저 막연하게만 파악하고 있습니다." },
  btnStart: { ja: "無料で始める", en: "Start for free", zh: "免费开始", it: "Inizia gratis", de: "Kostenlos starten", fr: "Commencer gratuitement", es: "Empezar gratis", ko: "무료로 시작하기" },
  btnLogin: { ja: "ログイン", en: "Log in", zh: "登录", it: "Accedi", de: "Anmelden", fr: "Se connecter", es: "Iniciar sesión", ko: "로그인" },
  noteFreeTrial: { ja: "現在、実験公開期間中につき無料でご利用いただけます", en: "Currently in an experimental free-trial period — free to use for now.", zh: "目前处于试验性公开期间，可免费使用。", it: "Attualmente in un periodo di prova sperimentale gratuito.", de: "Derzeit in einer experimentellen, kostenlosen Testphase — jetzt kostenlos nutzbar.", fr: "Actuellement en phase d'essai expérimentale gratuite.", es: "Actualmente en un período de prueba experimental gratuito.", ko: "현재 실험적 공개 기간이라 무료로 이용하실 수 있습니다." },
  whyTitle: { ja: "なぜ、このアプリは生まれたか", en: "Why This App Was Born", zh: "这款应用为何诞生", it: "Perché è nata questa app", de: "Warum diese App entstanden ist", fr: "Pourquoi cette application est née", es: "Por qué nació esta aplicación", ko: "이 앱은 왜 만들어졌나" },
  whyText: { ja: "睡眠が浅かった翌朝、声の出だしが重い。夕食の時間が遅かった日、なぜか喉がイガイガする。\n本番前日の過ごし方で、翌日の響きがまるで違う——声楽家なら誰もが、経験として知っていることです。\n\nけれど「経験として知っている」ことと「記録として持っている」ことの間には、大きな差があります。\nスポーツ選手が体調やトレーニングを細かく記録するように、声を仕事にする人にも、\n自分の身体という楽器と向き合うための場所が必要なのではないか——La Voce は、その問いから生まれました。\n\n睡眠、水分、食事とその時刻、当日の気候、そして声そのものの調子。\nバラバラに感じていたものを一つの記録としてつなげたとき、\nはじめて見えてくる「自分だけの傾向」があります。", en: "On a morning after shallow sleep, the voice feels heavy to start. On a day dinner ran late, the throat feels scratchy for no clear reason.\nHow the day before a performance goes changes how the voice resonates the next day entirely — every singer knows this from experience.\n\nBut there's a real gap between \"knowing from experience\" and \"having it on record.\"\nJust as athletes track their condition and training in detail, shouldn't people who work with their voice also have\na place to face the instrument that is their own body? La Voce was born from that question.\n\nSleep, hydration, meals and their timing, the day's weather, and the condition of the voice itself.\nOnce these scattered impressions are connected into a single record,\npatterns that are truly your own start to come into view for the first time.", zh: "睡眠浅的那个早晨，起声总是沉重。晚饭吃得晚的日子，喉咙不知为何总感觉发痒。\n演出前一天怎么过，第二天的声音共鸣就会截然不同——这是每一位声乐家都凭经验知道的事。\n\n但是，「凭经验知道」与「留有记录」之间，有着巨大的差距。\n正如运动员会细致记录自己的状态与训练一样，以声音为业的人，\n是否也需要一个直面「身体这件乐器」的地方呢——La Voce，正是从这个疑问中诞生的。\n\n睡眠、水分、饮食及其时间、当天的气候，以及声音本身的状态。\n当这些原本零散的感受被串联成一份记录时，\n才第一次能够看见「专属于自己的倾向」。", it: "La mattina dopo un sonno leggero, la voce parte pesante. Nei giorni in cui si cena tardi, la gola si irrita senza un motivo apparente.\nCome trascorri la vigilia di un'esibizione cambia completamente il timbro del giorno dopo — ogni cantante lo sa per esperienza.\n\nMa c'è una differenza enorme tra \"saperlo per esperienza\" e \"averlo registrato\".\nCosì come gli atleti tengono traccia minuziosa della propria condizione e degli allenamenti, chi lavora con la voce\nnon dovrebbe forse avere un luogo in cui confrontarsi con lo strumento che è il proprio corpo? La Voce è nata da questa domanda.\n\nSonno, idratazione, pasti e i loro orari, il clima del giorno, e la condizione della voce stessa.\nQuando queste sensazioni sparse vengono collegate in un unico registro,\nemergono per la prima volta tendenze che sono davvero solo tue.", de: "An einem Morgen nach unruhigem Schlaf fühlt sich die Stimme beim Start schwer an. An einem Tag mit spätem Abendessen kratzt der Hals aus unerklärlichem Grund.\nWie der Tag vor einem Auftritt verläuft, verändert völlig, wie die Stimme am nächsten Tag klingt — das weiß jede Sängerin, jeder Sänger aus Erfahrung.\n\nDoch zwischen „es aus Erfahrung wissen\" und „es aufgezeichnet haben\" liegt ein großer Unterschied.\nSo wie Sportler ihre Verfassung und ihr Training genau festhalten, sollten auch Menschen, die mit ihrer Stimme arbeiten,\neinen Ort haben, um sich mit dem Instrument auseinanderzusetzen, das ihr eigener Körper ist — daraus ist La Voce entstanden.\n\nSchlaf, Flüssigkeitszufuhr, Mahlzeiten und ihre Zeitpunkte, das Wetter des Tages und die Verfassung der Stimme selbst.\nWenn diese verstreuten Eindrücke zu einer einzigen Aufzeichnung verbunden werden,\nzeigen sich zum ersten Mal Muster, die wirklich die eigenen sind.", fr: "Un matin après un sommeil léger, la voix démarre lourdement. Un jour où le dîner a traîné, la gorge gratte sans raison apparente.\nLa façon dont se passe la veille d'une représentation change entièrement la résonance du lendemain — tout chanteur le sait par expérience.\n\nMais il existe un fossé réel entre « le savoir par expérience » et « l'avoir noté ».\nTout comme les athlètes consignent minutieusement leur condition et leur entraînement, les personnes qui travaillent avec leur voix ne devraient-elles pas, elles aussi,\navoir un lieu pour se confronter à cet instrument qu'est leur propre corps ? C'est de cette question qu'est née La Voce.\n\nLe sommeil, l'hydratation, les repas et leurs horaires, le climat du jour, et l'état de la voix elle-même.\nLorsque ces impressions éparses sont reliées en un seul registre,\ndes tendances qui vous sont vraiment propres apparaissent pour la première fois.", es: "En una mañana después de dormir poco, la voz empieza pesada. En un día en que la cena se retrasó, la garganta pica sin razón aparente.\nCómo transcurre la víspera de una actuación cambia por completo la resonancia del día siguiente — todo cantante lo sabe por experiencia.\n\nPero hay una gran diferencia entre \"saberlo por experiencia\" y \"tenerlo registrado\".\nAsí como los deportistas registran minuciosamente su condición y entrenamiento, quienes trabajan con la voz\n¿no deberían también tener un lugar para enfrentarse a ese instrumento que es su propio cuerpo? De esa pregunta nació La Voce.\n\nEl sueño, la hidratación, las comidas y sus horarios, el clima del día y el estado de la propia voz.\nCuando estas impresiones dispersas se conectan en un único registro,\npor primera vez emergen patrones que son verdaderamente propios.", ko: "잠을 얕게 잔 다음 날 아침에는 소리가 무겁게 시작됩니다. 저녁 식사가 늦었던 날에는 왠지 목이 칼칼합니다.\n공연 전날을 어떻게 보내느냐에 따라 다음 날의 울림이 완전히 달라진다는 것——성악가라면 누구나 경험으로 알고 있는 사실입니다.\n\n하지만 \"경험으로 아는 것\"과 \"기록으로 가지고 있는 것\" 사이에는 큰 차이가 있습니다.\n운동선수가 컨디션과 훈련을 세세히 기록하듯이, 목소리를 다루는 사람에게도\n자기 몸이라는 악기와 마주할 공간이 필요하지 않을까——La Voce는 그 물음에서 태어났습니다.\n\n수면, 수분, 식사와 그 시각, 그날의 날씨, 그리고 목소리 자체의 상태.\n따로따로 느껴지던 것들을 하나의 기록으로 이어보았을 때,\n비로소 보이기 시작하는 \"나만의 경향\"이 있습니다." },
  feature1Title: { ja: "声・喉のコンディション", en: "Voice & Throat Condition", zh: "声音・喉咙状态", it: "Condizione di voce e gola", de: "Stimme & Halszustand", fr: "État de la voix et de la gorge", es: "Estado de la voz y la garganta", ko: "목소리·목 컨디션" },
  feature1Desc: { ja: "起き抜けと発声後の声の高さ、響きのスコア、喉の症状まで。日々の変化を数値と記録の両方で追えます。", en: "From waking pitch and post-warmup pitch to resonance scores and throat symptoms — track day-to-day change through both numbers and notes.", zh: "从起床时和发声后的音高，到响度评分乃至喉咙症状——用数值与文字记录，双重追踪每日变化。", it: "Dall'altezza al risveglio e dopo il riscaldamento ai punteggi di risonanza fino ai sintomi della gola: monitora i cambiamenti quotidiani con numeri e note.", de: "Von der Tonhöhe beim Aufwachen und nach dem Aufwärmen über Resonanzwerte bis zu Halssymptomen — verfolge tägliche Veränderungen mit Zahlen und Notizen.", fr: "De la hauteur au réveil et après l'échauffement aux scores de résonance et aux symptômes de la gorge : suivez l'évolution quotidienne avec des chiffres et des notes.", es: "Desde el tono al despertar y tras el calentamiento hasta la puntuación de resonancia y los síntomas de garganta: sigue el cambio diario con números y notas.", ko: "기상 시와 발성 후의 음높이, 울림 점수, 목 증상까지. 매일의 변화를 수치와 기록 양쪽으로 추적할 수 있습니다." },
  feature2Title: { ja: "睡眠・食事とのつながり", en: "Links to Sleep & Meals", zh: "与睡眠・饮食的关联", it: "Legami con sonno e pasti", de: "Verbindung zu Schlaf & Mahlzeiten", fr: "Liens avec le sommeil et les repas", es: "Conexión con el sueño y las comidas", ko: "수면·식사와의 연결" },
  feature2Desc: { ja: "夕食の時刻と就寝までの間隔、水分、栄養バランス。前日の過ごし方が今日の声にどうつながるかを可視化します。", en: "Dinner timing and the gap before sleep, hydration, nutritional balance — see exactly how yesterday connects to today's voice.", zh: "晚餐时间与就寝间隔、水分、营养均衡——将前一天的生活方式如何影响今日声音的过程可视化。", it: "Orario della cena e intervallo prima di dormire, idratazione, equilibrio nutrizionale: visualizza come la giornata precedente influisce sulla voce di oggi.", de: "Abendessenszeit und Abstand bis zum Schlafengehen, Flüssigkeitszufuhr, Nährstoffbalance — sieh sichtbar, wie der Vortag mit der heutigen Stimme zusammenhängt.", fr: "Heure du dîner et intervalle avant le coucher, hydratation, équilibre nutritionnel : visualisez comment la veille influence la voix d'aujourd'hui.", es: "Hora de la cena e intervalo antes de dormir, hidratación, equilibrio nutricional: visualiza cómo el día anterior se conecta con la voz de hoy.", ko: "저녁 식사 시각과 취침까지의 간격, 수분, 영양 균형. 전날 어떻게 보냈는지가 오늘의 목소리로 어떻게 이어지는지 시각화합니다." },
  feature3Title: { ja: "自分だけの分析", en: "Analysis Just for You", zh: "专属于你的分析", it: "Un'analisi tutta tua", de: "Analyse nur für dich", fr: "Une analyse rien que pour vous", es: "Un análisis solo para ti", ko: "나만의 분석" },
  feature3Desc: { ja: "記録が増えるほど、あなたの声にとって本当に大切な習慣が見えてきます。グラフと相関分析で、感覚を裏付けます。", en: "The more you record, the clearer the habits that really matter for your voice become. Graphs and correlation analysis back up what you already sense.", zh: "记录越多，对你的声音真正重要的习惯就会越发清晰。用图表与相关性分析，为你的直觉提供依据。", it: "Più registri, più diventano chiare le abitudini davvero importanti per la tua voce. Grafici e analisi di correlazione confermano ciò che già percepisci.", de: "Je mehr du aufzeichnest, desto klarer werden die Gewohnheiten, die für deine Stimme wirklich zählen. Diagramme und Korrelationsanalysen untermauern, was du bereits spürst.", fr: "Plus vous enregistrez, plus les habitudes vraiment importantes pour votre voix deviennent claires. Graphiques et analyses de corrélation confirment ce que vous ressentez déjà.", es: "Cuanto más registras, más claros se vuelven los hábitos que realmente importan para tu voz. Gráficos y análisis de correlación respaldan lo que ya intuyes.", ko: "기록이 쌓일수록, 당신의 목소리에 정말 중요한 습관이 보이기 시작합니다. 그래프와 상관 분석으로 감각을 뒷받침합니다." },
  nativeAppNote: { ja: "アカウントをお持ちでない方は、ウェブサイトからご登録のうえ、こちらのアプリでログインしてください。", en: "If you don't have an account yet, please sign up on the website first, then log in here in the app.", zh: "尚未拥有账户的用户，请先在网站上注册，再在本应用中登录。", it: "Se non hai ancora un account, registrati prima sul sito web, poi accedi qui nell'app.", de: "Falls du noch kein Konto hast, registriere dich bitte zuerst auf der Website und melde dich dann hier in der App an.", fr: "Si vous n'avez pas encore de compte, veuillez d'abord vous inscrire sur le site web, puis vous connecter ici dans l'application.", es: "Si aún no tienes una cuenta, regístrate primero en el sitio web y luego inicia sesión aquí en la aplicación.", ko: "계정이 없으신 분은 먼저 웹사이트에서 가입하신 후, 이 앱에서 로그인해 주세요." },
  legalTokushoho: { ja: "特定商取引法に基づく表記", en: "Legal Notice (Japanese Commerce Law)", zh: "基于日本《特定商业交易法》的标示", it: "Informativa legale (legge commerciale giapponese)", de: "Rechtlicher Hinweis (japanisches Handelsgesetz)", fr: "Mentions légales (loi commerciale japonaise)", es: "Aviso legal (ley comercial japonesa)", ko: "특정상거래법에 따른 표기" },
  legalPrivacy: { ja: "プライバシーポリシー", en: "Privacy Policy", zh: "隐私政策", it: "Informativa sulla privacy", de: "Datenschutzerklärung", fr: "Politique de confidentialité", es: "Política de privacidad", ko: "개인정보처리방침" },
  legalTerms: { ja: "利用規約", en: "Terms of Service", zh: "使用条款", it: "Termini di servizio", de: "Nutzungsbedingungen", fr: "Conditions d'utilisation", es: "Términos de servicio", ko: "이용약관" },
};

function tr(key, lang) { const e = T[key]; if (!e) return ""; return e[lang] || e.en || e.ja || ""; }

function LangSwitcher({ lang }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", padding: "14px 24px 0" }}>
      {LANGS.map((l) => (
        <a
          key={l.code}
          href={l.code === "ja" ? "/" : `/?lang=${l.code}`}
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
  );
}

function StaffPulseHero() {
  return (
    <svg viewBox="0 0 640 160" style={{ width: "100%", maxWidth: 560, height: "auto" }}>
      {/* 五線譜 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="10" y1={40 + i * 20} x2="630" y2={40 + i * 20} stroke={C.line} strokeWidth="1.5" />
      ))}
      {/* 心拍・記録データのライン（五線の中を通り抜けていく） */}
      <path
        d="M10,80 L160,80 L180,30 L200,130 L220,50 L240,80 L340,80 L360,45 L380,115 L400,80 L630,80"
        fill="none"
        stroke={C.curtain}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ト音記号風の飾り（簡略） */}
      <path
        d="M56,20 Q40,20 40,38 Q40,56 58,58 Q76,60 76,42 Q76,28 62,28 Q52,28 52,40 L52,90 Q52,102 42,102 Q34,102 34,94"
        fill="none"
        stroke={C.gold}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* データポイント */}
      {[[180, 30], [220, 50], [360, 45], [400, 80]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={C.gold} stroke={C.card} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function FeatureCard({ title, desc, accent }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: "22px 20px",
        textAlign: "left",
        flex: "1 1 220px",
        minWidth: 220
      }}
    >
      <div style={{ width: 32, height: 3, background: accent, borderRadius: 2, marginBottom: 14 }} />
      <h3 className="ff-display italic" style={{ fontSize: "1.2rem", color: C.ink, margin: "0 0 6px" }}>
        {title}
      </h3>
      <p style={{ color: C.inkSoft, fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>{desc}</p>
    </div>
  );
}

export default async function LandingPage({ searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const nativeApp = isNativeApp();
  const lang = LANGS.some((l) => l.code === searchParams?.lang) ? searchParams.lang : "ja";

  return (
    <main style={{ minHeight: "100vh" }}>
      <LangSwitcher lang={lang} />

      {/* ヒーロー */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 24px 40px" }}>
        <p style={{ color: C.gold, fontSize: 12.5, letterSpacing: "0.14em", fontWeight: 600, marginBottom: 10 }}>
          VOICE HEALTH JOURNAL FOR SINGERS
        </p>
        <h1 className="ff-display italic" style={{ fontSize: "3.4rem", color: C.curtain, margin: 0, lineHeight: 1.15 }}>
          La Voce
        </h1>
        <p style={{ color: C.ink, maxWidth: 520, marginTop: 18, lineHeight: 1.85, fontSize: 15.5, whiteSpace: "pre-line" }}>
          {tr("heroIntro", lang)}
        </p>

        <div style={{ margin: "36px 0 8px" }}>
          <StaffPulseHero />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
          {!nativeApp && (
            <a
              href="/signup"
              style={{
                padding: "14px 32px",
                borderRadius: 999,
                background: C.curtain,
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 8px 20px rgba(122,31,43,0.25)"
              }}
            >
              {tr("btnStart", lang)}
            </a>
          )}
          <a
            href="/login"
            style={{
              padding: "14px 32px",
              borderRadius: 999,
              border: `1px solid ${C.line}`,
              color: C.ink,
              textDecoration: "none",
              background: C.card
            }}
          >
            {tr("btnLogin", lang)}
          </a>
        </div>
        <p style={{ color: C.gold, fontSize: 12.5, marginTop: 16, fontWeight: 500 }}>
          {tr("noteFreeTrial", lang)}
        </p>
      </section>

      {/* なぜ生まれたか */}
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "24px 24px 56px", textAlign: "center" }}>
        <h2 className="ff-display italic" style={{ fontSize: "1.9rem", color: C.ink, marginBottom: 18 }}>
          {tr("whyTitle", lang)}
        </h2>
        <p style={{ color: C.inkSoft, lineHeight: 1.9, fontSize: 14.5, textAlign: "left", whiteSpace: "pre-line" }}>
          {tr("whyText", lang)}
        </p>
      </section>

      {/* 何ができるか */}
      <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <FeatureCard
            accent={C.curtain}
            title={tr("feature1Title", lang)}
            desc={tr("feature1Desc", lang)}
          />
          <FeatureCard
            accent={C.sage}
            title={tr("feature2Title", lang)}
            desc={tr("feature2Desc", lang)}
          />
          <FeatureCard
            accent={C.gold}
            title={tr("feature3Title", lang)}
            desc={tr("feature3Desc", lang)}
          />
        </div>
      </section>

      {nativeApp && (
        <p style={{ textAlign: "center", fontSize: 12, color: C.inkSoft, maxWidth: 320, lineHeight: 1.7, margin: "0 auto 40px" }}>
          {tr("nativeAppNote", lang)}
        </p>
      )}

      <p style={{ textAlign: "center", padding: "0 24px 40px", fontSize: 12, color: C.inkSoft }}>
        <a href="/legal/tokushoho" style={{ color: C.inkSoft, marginRight: 12 }}>{tr("legalTokushoho", lang)}</a>
        <a href="/legal/privacy" style={{ color: C.inkSoft, marginRight: 12 }}>{tr("legalPrivacy", lang)}</a>
        <a href="/legal/terms" style={{ color: C.inkSoft }}>{tr("legalTerms", lang)}</a>
      </p>
    </main>
  );
}
