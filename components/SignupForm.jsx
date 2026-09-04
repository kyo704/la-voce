"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/tokens";
import { OCCUPATIONS, occupationLabelIn } from "@/lib/occupation";

const SIGNUP_LANGS = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" },
];

const ST = {
  nativeTitle: { ja: "ご登録について", en: "About Signing Up", zh: "关于注册", it: "Informazioni sulla registrazione", de: "Zur Registrierung", fr: "À propos de l'inscription", es: "Sobre el registro", ko: "가입 안내", ru: "О регистрации" },
  nativeBody: { ja: "新規のご登録はウェブサイトから行っていただけます。登録後、このアプリでログインしてご利用いただけます。", en: "New sign-ups can be completed on the website. After registering, you can log in and use this app.", zh: "新用户请通过网站进行注册。注册完成后，即可在本应用中登录使用。", it: "La registrazione può essere completata sul sito web. Dopo la registrazione, potrai accedere e utilizzare questa app.", de: "Neuanmeldungen erfolgen über die Website. Nach der Registrierung kannst du dich in dieser App anmelden und sie nutzen.", fr: "Les nouvelles inscriptions se font sur le site web. Après votre inscription, vous pourrez vous connecter et utiliser cette application.", es: "Los nuevos registros se realizan en el sitio web. Después de registrarte, podrás iniciar sesión y usar esta aplicación.", ko: "신규 가입은 웹사이트에서 진행해 주세요. 가입 후에는 이 앱에서 로그인하여 이용하실 수 있습니다.", ru: "Новую регистрацию можно пройти на сайте. После регистрации вы сможете войти и пользоваться этим приложением." },
  doneTitle: { ja: "確認メールを送信しました", en: "Confirmation Email Sent", zh: "确认邮件已发送", it: "E-mail di conferma inviata", de: "Bestätigungs-E-Mail gesendet", fr: "E-mail de confirmation envoyé", es: "Correo de confirmación enviado", ko: "확인 이메일을 보냈습니다", ru: "Письмо с подтверждением отправлено" },
  doneBody: { ja: "{email} 宛にメールを送信しました。メール内のリンクをクリックして登録を完了してください。", en: "We've sent an email to {email}. Please click the link in the email to complete your registration.", zh: "已向 {email} 发送邮件。请点击邮件中的链接以完成注册。", it: "Abbiamo inviato un'e-mail a {email}. Clicca sul link nell'e-mail per completare la registrazione.", de: "Wir haben eine E-Mail an {email} gesendet. Bitte klicke auf den Link in der E-Mail, um die Registrierung abzuschließen.", fr: "Nous avons envoyé un e-mail à {email}. Veuillez cliquer sur le lien dans l'e-mail pour terminer votre inscription.", es: "Hemos enviado un correo a {email}. Haz clic en el enlace del correo para completar tu registro.", ko: "{email} 주소로 메일을 보냈습니다. 메일 안의 링크를 클릭하여 가입을 완료해 주세요.", ru: "Мы отправили письмо на {email}. Пожалуйста, перейдите по ссылке в письме, чтобы завершить регистрацию." },
  doneSpamNote: { ja: "数分待っても届かない場合は、迷惑メールフォルダもご確認ください。", en: "If it has not arrived after a few minutes, please also check your spam folder.", zh: "如果等待几分钟仍未收到，请一并确认垃圾邮件文件夹。", it: "Se dopo qualche minuto non arriva, controlla anche la cartella spam.", de: "Falls nach einigen Minuten nichts ankommt, sieh bitte auch im Spam-Ordner nach.", fr: "Si vous ne recevez rien après quelques minutes, vérifiez aussi votre dossier spam.", es: "Si no llega tras unos minutos, revisa también la carpeta de spam.", ko: "몇 분을 기다려도 오지 않으면 스팸 메일함도 확인해 주세요.", ru: "Если письмо не пришло через несколько минут, проверьте также папку «Спам»." },
  title: { ja: "Woolsong に登録", en: "Sign Up for Woolsong", zh: "注册 Woolsong", it: "Registrati su Woolsong", de: "Bei Woolsong registrieren", fr: "S'inscrire à Woolsong", es: "Regístrate en Woolsong", ko: "Woolsong 가입", ru: "Регистрация в Woolsong" },
  freeTrialNote: { ja: "現在、実験公開期間中につき無料でご利用いただけます。", en: "Currently in an experimental free-trial period — free to use for now.", zh: "目前处于试验性公开期间，可免费使用。", it: "Attualmente in un periodo di prova sperimentale gratuito.", de: "Derzeit in einer experimentellen, kostenlosen Testphase — jetzt kostenlos nutzbar.", fr: "Actuellement en phase d'essai expérimentale gratuite.", es: "Actualmente en un período de prueba experimental gratuito.", ko: "현재 실험적 공개 기간이라 무료로 이용하실 수 있습니다.", ru: "Сейчас идёт период бесплатного экспериментального доступа — пользоваться можно бесплатно." },
  privacyNote: { ja: "🔒 入力いただく体調・声の記録は、あなたご自身への分析表示のためだけに使い、広告目的での第三者提供や販売は一切行いません。詳しくは", en: "🔒 The condition and voice records you enter are used only to show your own analysis — we never share or sell them to third parties for advertising. For details, see our", zh: "🔒 您输入的身体・声音记录，仅用于为您本人展示分析结果，绝不会以广告为目的提供给第三方或出售。详情请参阅", it: "🔒 I dati sulla condizione e sulla voce che inserisci vengono usati solo per mostrarti la tua analisi personale — non li condividiamo né li vendiamo a terzi per scopi pubblicitari. Per maggiori dettagli, consulta la nostra", de: "🔒 Die von dir eingegebenen Verfassungs- und Stimmdaten werden ausschließlich zur Anzeige deiner eigenen Analyse verwendet — wir geben sie niemals zu Werbezwecken an Dritte weiter oder verkaufen sie. Näheres findest du in unserer", fr: "🔒 Les données de condition et de voix que vous saisissez ne servent qu'à afficher votre propre analyse — nous ne les partageons ni ne les vendons jamais à des tiers à des fins publicitaires. Pour en savoir plus, consultez notre", es: "🔒 Los datos de condición y voz que introduces se usan únicamente para mostrarte tu propio análisis; nunca los compartimos ni vendemos a terceros con fines publicitarios. Para más detalles, consulta nuestra", ko: "🔒 입력하신 컨디션·목소리 기록은 오직 본인에게 분석 결과를 보여주기 위해서만 사용되며, 광고 목적으로 제3자에게 제공하거나 판매하는 일은 결코 없습니다. 자세한 내용은", ru: "🔒 Вводимые вами данные о состоянии и голосе используются только для показа вашего собственного анализа — мы никогда не передаём и не продаём их третьим лицам в рекламных целях. Подробнее см." },
  privacyLink: { ja: "プライバシーポリシー", en: "Privacy Policy", zh: "隐私政策", it: "Informativa sulla privacy", de: "Datenschutzerklärung", fr: "politique de confidentialité", es: "política de privacidad", ko: "개인정보처리방침", ru: "Политика конфиденциальности" },
  placeholderName: { ja: "お名前", en: "Your name", zh: "姓名", it: "Nome", de: "Name", fr: "Nom", es: "Nombre", ko: "이름", ru: "Ваше имя" },
  placeholderEmail: { ja: "メールアドレス", en: "Email address", zh: "电子邮箱", it: "Indirizzo e-mail", de: "E-Mail-Adresse", fr: "Adresse e-mail", es: "Correo electrónico", ko: "이메일 주소", ru: "Электронная почта" },
  labelIsStudent: { ja: "学生です", en: "I'm a student", zh: "我是学生", it: "Sono uno studente/una studentessa", de: "Ich bin Student/in", fr: "Je suis étudiant(e)", es: "Soy estudiante", ko: "학생입니다", ru: "Я студент(ка)" },
  labelSchool: { ja: "学校名", en: "School name", zh: "学校名称", it: "Nome della scuola", de: "Name der Schule", fr: "Nom de l'établissement", es: "Nombre de la escuela", ko: "학교명", ru: "Название учебного заведения" },
  placeholderSchoolExample: { ja: "例：〇〇音楽大学", en: "e.g. Ondo College of Music", zh: "例：〇〇音乐大学", it: "Es.: Conservatorio 〇〇", de: "Z. B.: Musikhochschule 〇〇", fr: "Ex. : Conservatoire 〇〇", es: "Ej.: Conservatorio 〇〇", ko: "예: 〇〇음악대학", ru: "Например: Музыкальный колледж «Ондо»" },
  // ★職業は11個から選びます。呼び名の持ち主は lib/occupation.js です。
  //   ここに11個を書き写さないこと（片方だけ古くなります）。
  placeholderOccupationSelect: { ja: "選んでください", en: "Please select", zh: "请选择", it: "Seleziona", de: "Bitte wählen", fr: "Veuillez choisir", es: "Selecciona", ko: "선택해 주세요", ru: "Выберите" },
  occupationChangeNote: { ja: "あとから設定で変更できます。", en: "You can change this later in settings.", zh: "之后可在设置中更改。", it: "Puoi modificarlo in seguito nelle impostazioni.", de: "Du kannst dies später in den Einstellungen ändern.", fr: "Vous pourrez le modifier plus tard dans les réglages.", es: "Puedes cambiarlo más tarde en los ajustes.", ko: "나중에 설정에서 변경할 수 있습니다.", ru: "Это можно изменить позже в настройках." },
  labelOccupation: { ja: "職業", en: "Occupation", zh: "职业", it: "Professione", de: "Beruf", fr: "Profession", es: "Ocupación", ko: "직업", ru: "Профессия" },
  placeholderPassword: { ja: "パスワード（8文字以上）", en: "Password (8+ characters)", zh: "密码（8位以上）", it: "Password (min. 8 caratteri)", de: "Passwort (mind. 8 Zeichen)", fr: "Mot de passe (8 caractères min.)", es: "Contraseña (8 caracteres o más)", ko: "비밀번호(8자 이상)", ru: "Пароль (от 8 символов)" },
  btnLoading: { ja: "処理中…", en: "Processing…", zh: "处理中…", it: "Elaborazione in corso…", de: "Wird verarbeitet…", fr: "Traitement en cours…", es: "Procesando…", ko: "처리 중…", ru: "Обработка…" },
  btnSubmit: { ja: "登録する", en: "Sign up", zh: "注册", it: "Registrati", de: "Registrieren", fr: "S'inscrire", es: "Registrarse", ko: "가입하기", ru: "Зарегистрироваться" },
  haveAccountText: { ja: "すでにアカウントをお持ちの方は", en: "Already have an account?", zh: "已有账户？", it: "Hai già un account?", de: "Schon ein Konto?", fr: "Vous avez déjà un compte ?", es: "¿Ya tienes una cuenta?", ko: "이미 계정이 있으신가요?", ru: "Уже есть аккаунт?" },
  linkLogin: { ja: "ログイン", en: "Log in", zh: "登录", it: "Accedi", de: "Anmelden", fr: "Se connecter", es: "Iniciar sesión", ko: "로그인", ru: "Войти" },
  agreementText: { ja: "登録すると{terms}と{privacy}に同意したものとみなされます。", en: "By signing up, you agree to our {terms} and {privacy}.", zh: "注册即表示您同意我们的{terms}与{privacy}。", it: "Registrandoti, accetti i nostri {terms} e la nostra {privacy}.", de: "Mit der Registrierung stimmst du unseren {terms} und unserer {privacy} zu.", fr: "En vous inscrivant, vous acceptez nos {terms} et notre {privacy}.", es: "Al registrarte, aceptas nuestros {terms} y nuestra {privacy}.", ko: "가입하면 {terms} 및 {privacy}에 동의하는 것으로 간주됩니다.", ru: "Регистрируясь, вы соглашаетесь с {terms} и {privacy}." },
  termsLink: { ja: "利用規約", en: "Terms of Service", zh: "使用条款", it: "Termini di servizio", de: "Nutzungsbedingungen", fr: "conditions d'utilisation", es: "términos de servicio", ko: "이용약관", ru: "Условия использования" },
  // ★18歳未満かの確認（作業指示-公開前の実装.md A-7 の1行目）。
  //   答えなくても登録できます。答えないままの方は、未成年として扱います。
  labelAgeQuestion: { ja: "18歳未満ですか？", en: "Are you under 18?", zh: "您未满18岁吗？", it: "Hai meno di 18 anni?", de: "Bist du unter 18 Jahre alt?", fr: "Avez-vous moins de 18 ans ?", es: "¿Eres menor de 18 años?", ko: "만 18세 미만이신가요?", ru: "Вам меньше 18 лет?" },
  optionUnder18Yes: { ja: "はい（18歳未満です）", en: "Yes (under 18)", zh: "是（未满18岁）", it: "Sì (meno di 18 anni)", de: "Ja (unter 18)", fr: "Oui (moins de 18 ans)", es: "Sí (menor de 18)", ko: "예(18세 미만)", ru: "Да (меньше 18)" },
  optionUnder18No: { ja: "いいえ（18歳以上です）", en: "No (18 or older)", zh: "否（已满18岁）", it: "No (18 anni o più)", de: "Nein (18 oder älter)", fr: "Non (18 ans ou plus)", es: "No (18 o más)", ko: "아니요(18세 이상)", ru: "Нет (18 и старше)" },
  ageQuestionNote: { ja: "答えなくても登録できます。お答えいただくと、年齢に合わない項目をお出しせずに済みます。あとから設定でも変更できます。", en: "You can sign up without answering. Answering lets us avoid showing items that are not suitable for your age. You can change this later in Settings.", zh: "不回答也可以注册。回答后，我们可以避免显示不适合您年龄的项目。之后也可在设置中更改。", it: "Puoi registrarti anche senza rispondere. Rispondendo, eviteremo di mostrarti elementi non adatti alla tua età. Puoi modificarlo in seguito nelle impostazioni.", de: "Du kannst dich auch ohne Antwort registrieren. Mit einer Antwort können wir Inhalte ausblenden, die nicht zu deinem Alter passen. Du kannst das später in den Einstellungen ändern.", fr: "Vous pouvez vous inscrire sans répondre. Si vous répondez, nous éviterons d'afficher des éléments inadaptés à votre âge. Vous pourrez le modifier plus tard dans les réglages.", es: "Puedes registrarte sin responder. Si respondes, evitaremos mostrarte elementos que no sean adecuados para tu edad. Podrás cambiarlo después en los ajustes.", ko: "답하지 않아도 가입할 수 있습니다. 답해 주시면 연령에 맞지 않는 항목을 표시하지 않을 수 있습니다. 나중에 설정에서 변경할 수 있습니다.", ru: "Зарегистрироваться можно и без ответа. Ответ позволит нам не показывать то, что не подходит по возрасту. Изменить это можно позже в настройках." },
};

function str(key, lang) { const e = ST[key]; if (!e) return ""; return e[lang] || e.en || e.ja || ""; }

const inputStyle = {
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  // ★★16px を下回らないこと（2026-09-05）。
  //   ★iOS は、★16px 未満の入力欄に触ると、★画面を勝手に拡大します。
  //   ★★拡大されると、★戻し方が分からない方がいらっしゃいます。
  //   ★ここは 14px（0.875rem）でした。★拡大していました。
  //   ★max( ) にすると、★大きくはなれて、★小さくはなりません。
  fontSize: "max(16px, 1rem)",
  background: C.card,
  color: C.ink
};
const buttonStyle = {
  padding: "13px",
  borderRadius: 12,
  border: "none",
  background: C.curtain,
  color: "#fff",
  fontWeight: 600,
  fontSize: "0.9375rem"
};

function LangSwitcher({ lang }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 18 }}>
      {SIGNUP_LANGS.map((l) => (
        <a
          key={l.code}
          href={l.code === "ja" ? "/signup" : `/signup?lang=${l.code}`}
          style={{
            fontSize: "0.6875rem", padding: "3px 8px", borderRadius: 999,
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

// {terms} / {privacy} のプレースホルダーを、実際のリンク要素に置き換えて描画する
function AgreementSentence({ lang }) {
  const template = str("agreementText", lang);
  const parts = template.split(/(\{terms\}|\{privacy\})/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === "{terms}") return <a key={i} href="/legal/terms" style={{ color: C.inkSoft }}>{str("termsLink", lang)}</a>;
        if (part === "{privacy}") return <a key={i} href="/legal/privacy" style={{ color: C.inkSoft }}>{str("privacyLink", lang)}</a>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function SignupFormInner() {
  const searchParams = useSearchParams();
  const lang = SIGNUP_LANGS.some((l) => l.code === searchParams.get("lang")) ? searchParams.get("lang") : "ja";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    isStudent: false,
    // ★自由記述の occupation は、新しい登録では持ちません（11個から選びます）。
    //   すでに profiles.occupation に入っている26人ぶんの回答は、そのまま残します。
    voiceOccupation: "",
    school: "",
    // ★null は「答えていない」。既定を false（＝18歳以上）にしないこと。
    //   答えないまま登録した人は、未成年として扱われます（lib/ageGate.js）。
    isUnder18: null
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          // ★occupation（自由記述）は、もう送りません。
          //   送ると handle_new_user が profiles.occupation に書きます。
          //   新しい登録では、この列を書かないと決めました。
          school: form.isStudent ? form.school : "",
          // ★11個から選んだ職業。ここではまだログインしていないため
          //   profiles には書けません。初回ログインのときに VocalTracker が
          //   voice_occupation へ移します（lib/occupation.js の adoptSignupOccupation）。
          ...(form.voiceOccupation ? { voice_occupation: form.voiceOccupation } : {}),
          // ★ここではまだログインしていないため（確認メールの前）、
          //   profiles には書けません。いったん auth の user_metadata に預け、
          //   初回ログインのときに VocalTracker が profiles へ移します
          //   （lib/ageGate.js の adoptSignupAnswer）。
          //   答えていなければ、この鍵ごと送りません。
          ...(typeof form.isUnder18 === "boolean" ? { is_under_18: form.isUnder18 } : {})
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <main style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain }}>
          {str("doneTitle", lang)}
        </h1>
        <p style={{ color: C.inkSoft, marginTop: 12, lineHeight: 1.7 }}>
          {str("doneBody", lang).replace("{email}", form.email)}
        </p>
        <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
          {str("doneSpamNote", lang)}
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px" }}>
      <LangSwitcher lang={lang} />
      <h1 className="ff-display italic" style={{ fontSize: "2.5rem", color: C.curtain }}>
        {str("title", lang)}
      </h1>
      <p style={{ color: C.inkSoft, marginBottom: 16 }}>
        {str("freeTrialNote", lang)}
      </p>
      <div style={{ background: C.card, border: `1.5px solid ${C.sage}`, borderRadius: 12, padding: "12px 14px", marginBottom: 24, fontSize: "0.78125rem", color: C.inkSoft, lineHeight: 1.6 }}>
        {str("privacyNote", lang)}
        <a href="/legal/privacy" style={{ color: C.sage, fontWeight: 600 }}> {str("privacyLink", lang)}</a>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          required
          placeholder={str("placeholderName", lang)}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          style={inputStyle}
        />
        {/* ★★autocomplete を外すと、★端末がパスワードを覚えません。
            ★覚えないと、★Face ID の自動入力が出ません。
            ★★そうなると、★パスワードのほうが6桁より遅くなります。
            ★判断-パスワードを主にする（9月4日・訂正2）§4 の要です。
            ★消さないこと。 */}
        <input
          required
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          placeholder={str("placeholderEmail", lang)}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          style={inputStyle}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8125rem", color: C.inkSoft }}>
          <input
            type="checkbox"
            checked={form.isStudent}
            onChange={(e) => setForm((f) => ({ ...f, isStudent: e.target.checked }))}
          />
          {str("labelIsStudent", lang)}
        </label>

        {form.isStudent && (
          <div>
            <label style={{ fontSize: "0.75rem", color: C.inkSoft, display: "block", marginBottom: 4 }}>{str("labelSchool", lang)}</label>
            <input
              required
              placeholder={str("placeholderSchoolExample", lang)}
              value={form.school}
              onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
        )}

        {/* ★職業は11個から選びます（自由記述をやめました）。
            学生の方にもたずねます。学校名と職業は別のことだからです。
            選択肢は lib/occupation.js が持っています。ここに書き写さないこと。 */}
        <div>
          <label style={{ fontSize: "0.75rem", color: C.inkSoft, display: "block", marginBottom: 4 }}>{str("labelOccupation", lang)}</label>
          <select
            required
            value={form.voiceOccupation}
            onChange={(e) => setForm((f) => ({ ...f, voiceOccupation: e.target.value }))}
            style={{ ...inputStyle, width: "100%" }}
          >
            <option value="">{str("placeholderOccupationSelect", lang)}</option>
            {OCCUPATIONS.map((occ) => (
              <option key={occ} value={occ}>{occupationLabelIn(occ, lang)}</option>
            ))}
          </select>
          <p style={{ fontSize: "0.6875rem", color: C.inkSoft, marginTop: 4 }}>{str("occupationChangeNote", lang)}</p>
        </div>

        {/* ★18歳未満かの確認（A-7 の1行目）。
            required を付けないこと。答えずに登録できます（研究利用の同意 §4-4）。
            既定で選ばれている選択肢を作らないこと。答えていないことが、
            そのまま「未成年として扱う」に対応します。 */}
        <fieldset style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px" }}>
          <legend style={{ fontSize: "0.75rem", color: C.inkSoft, padding: "0 6px" }}>
            {str("labelAgeQuestion", lang)}
          </legend>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: C.ink }}>
              <input
                type="radio"
                name="isUnder18"
                checked={form.isUnder18 === true}
                onChange={() => setForm((f) => ({ ...f, isUnder18: true }))}
              />
              {str("optionUnder18Yes", lang)}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: C.ink }}>
              <input
                type="radio"
                name="isUnder18"
                checked={form.isUnder18 === false}
                onChange={() => setForm((f) => ({ ...f, isUnder18: false }))}
              />
              {str("optionUnder18No", lang)}
            </label>
          </div>
          <p style={{ fontSize: "0.71875rem", color: C.inkSoft, marginTop: 8, lineHeight: 1.6 }}>
            {str("ageQuestionNote", lang)}
          </p>
        </fieldset>

        {/* ★new-password です。★current-password ではありません。
            ★これで、端末が「新しいパスワードを作りますか」を出します。 */}
        <input
          required
          type="password"
          name="new-password"
          autoComplete="new-password"
          minLength={8}
          placeholder={str("placeholderPassword", lang)}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          style={inputStyle}
        />
        {error && <p style={{ color: C.curtain, fontSize: "0.8125rem" }}>{error}</p>}
        <button type="submit" disabled={status === "loading"} style={buttonStyle}>
          {status === "loading" ? str("btnLoading", lang) : str("btnSubmit", lang)}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: "0.8125rem", color: C.inkSoft }}>
        {str("haveAccountText", lang)} <a href="/login" style={{ color: C.curtain }}>{str("linkLogin", lang)}</a>
      </p>
      <p style={{ marginTop: 32, fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.6 }}>
        <AgreementSentence lang={lang} />
      </p>
    </main>
  );
}

export default function SignupForm() {
  return (
    <Suspense fallback={null}>
      <SignupFormInner />
    </Suspense>
  );
}
