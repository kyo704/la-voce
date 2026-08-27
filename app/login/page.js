"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LOGIN_LANGS = [
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

const LT = {
  subtitle: { ja: "声を使う人のための体調管理アプリ", en: "A condition-tracking app for people who use their voice", zh: "为用嗓者打造的健康管理应用", it: "Un'app per il monitoraggio della condizione per chi usa la voce", de: "Eine App zur Verfassungsverfolgung für Stimmnutzer", fr: "Une application de suivi de la forme pour ceux qui utilisent leur voix", es: "Una app de seguimiento de la condición para quienes usan la voz", ko: "목소리를 쓰는 사람을 위한 컨디션 관리 앱", ru: "Приложение для отслеживания состояния для тех, кто использует свой голос" },
  formTitle: { ja: "開幕まであと少し", en: "The curtain is about to rise", zh: "开幕在即", it: "Il sipario sta per alzarsi", de: "Der Vorhang hebt sich gleich", fr: "Le rideau va bientôt se lever", es: "El telón está a punto de levantarse", ko: "곧 막이 오릅니다", ru: "Скоро поднимется занавес" },
  placeholderEmail: { ja: "メールアドレス", en: "Email address", zh: "电子邮箱", it: "Indirizzo e-mail", de: "E-Mail-Adresse", fr: "Adresse e-mail", es: "Correo electrónico", ko: "이메일 주소", ru: "Электронная почта" },
  placeholderPassword: { ja: "パスワード", en: "Password", zh: "密码", it: "Password", de: "Passwort", fr: "Mot de passe", es: "Contraseña", ko: "비밀번호", ru: "Пароль" },
  errorLogin: { ja: "メールアドレスまたはパスワードが正しくありません。", en: "The email address or password is incorrect.", zh: "邮箱地址或密码不正确。", it: "L'indirizzo e-mail o la password non sono corretti.", de: "E-Mail-Adresse oder Passwort ist falsch.", fr: "L'adresse e-mail ou le mot de passe est incorrect.", es: "El correo electrónico o la contraseña son incorrectos.", ko: "이메일 주소 또는 비밀번호가 올바르지 않습니다.", ru: "Неверный адрес электронной почты или пароль." },
  btnLoading: { ja: "開演準備中…", en: "Preparing to begin…", zh: "开演准备中…", it: "Preparazione in corso…", de: "Vorbereitung läuft…", fr: "Préparation en cours…", es: "Preparando…", ko: "공연 준비 중…", ru: "Готовимся начать…" },
  // パスワードの再設定（Supabase Auth の resetPasswordForEmail を使う）。
  linkForgot: { ja: "パスワードをお忘れの方は", en: "Forgot your password?", zh: "忘记密码？", it: "Password dimenticata?", de: "Passwort vergessen?", fr: "Mot de passe oublie ?", es: "\u00bfOlvidaste tu contrase\u00f1a?", ko: "비밀번호를 잊으셨나요?", ru: "Забыли пароль?" },
  resetTitle: { ja: "パスワードの再設定", en: "Reset your password", zh: "重置密码", it: "Reimposta la password", de: "Passwort zuruecksetzen", fr: "Reinitialiser le mot de passe", es: "Restablecer la contrase\u00f1a", ko: "비밀번호 재설정", ru: "Сброс пароля" },
  resetLead: { ja: "ご登録のメールアドレスに、再設定用のリンクをお送りします。", en: "We will email you a link to set a new password.", zh: "我们会将重置链接发送到您注册的邮箱。", it: "Ti invieremo per e-mail un link per impostare una nuova password.", de: "Wir senden dir per E-Mail einen Link zum Festlegen eines neuen Passworts.", fr: "Nous vous enverrons par e-mail un lien pour definir un nouveau mot de passe.", es: "Te enviaremos por correo un enlace para establecer una nueva contrase\u00f1a.", ko: "등록하신 이메일 주소로 재설정 링크를 보내드립니다.", ru: "Мы отправим на вашу почту ссылку для установки нового пароля." },
  resetSend: { ja: "再設定用のリンクを送る", en: "Send reset link", zh: "发送重置链接", it: "Invia il link", de: "Link senden", fr: "Envoyer le lien", es: "Enviar enlace", ko: "재설정 링크 보내기", ru: "Отправить ссылку" },
  resetSending: { ja: "送信しています…", en: "Sending…", zh: "正在发送…", it: "Invio in corso…", de: "Wird gesendet…", fr: "Envoi…", es: "Enviando…", ko: "보내는 중…", ru: "Отправка…" },
  resetSent: { ja: "再設定用のリンクをお送りしました。メール内のリンクから、新しいパスワードを設定してください。", en: "We have sent the reset link. Use the link in the email to set a new password.", zh: "重置链接已发送。请通过邮件中的链接设置新密码。", it: "Abbiamo inviato il link. Usalo per impostare una nuova password.", de: "Der Link wurde gesendet. Lege damit ein neues Passwort fest.", fr: "Le lien a ete envoye. Utilisez-le pour definir un nouveau mot de passe.", es: "Hemos enviado el enlace. Uselo para establecer una nueva contrase\u00f1a.", ko: "재설정 링크를 보냈습니다. 메일의 링크에서 새 비밀번호를 설정해 주세요.", ru: "Ссылка отправлена. Установите новый пароль по ссылке из письма." },
  resetSpamNote: { ja: "数分待っても届かない場合は、迷惑メールフォルダもご確認ください。", en: "If it has not arrived after a few minutes, please also check your spam folder.", zh: "如果等待几分钟仍未收到，请一并确认垃圾邮件文件夹。", it: "Se dopo qualche minuto non arriva, controlla anche la cartella spam.", de: "Falls nach einigen Minuten nichts ankommt, sieh bitte auch im Spam-Ordner nach.", fr: "Si vous ne recevez rien apres quelques minutes, verifiez aussi votre dossier spam.", es: "Si no llega tras unos minutos, revisa tambien la carpeta de spam.", ko: "몇 분을 기다려도 오지 않으면 스팸 메일함도 확인해 주세요.", ru: "Если письмо не пришло через несколько минут, проверьте также папку «Спам»." },
  resetBack: { ja: "ログインに戻る", en: "Back to login", zh: "返回登录", it: "Torna al login", de: "Zurueck zur Anmeldung", fr: "Retour a la connexion", es: "Volver al inicio de sesion", ko: "로그인으로 돌아가기", ru: "Вернуться ко входу" },
  resetError: { ja: "送信できませんでした。メールアドレスをご確認のうえ、もう一度お試しください。", en: "Could not send. Please check the address and try again.", zh: "发送失败。请确认邮箱地址后重试。", it: "Invio non riuscito. Controlla l\'indirizzo e riprova.", de: "Senden fehlgeschlagen. Pruefe die Adresse und versuche es erneut.", fr: "Echec de l\'envoi. Verifiez l\'adresse et reessayez.", es: "No se pudo enviar. Comprueba la direccion e intentalo de nuevo.", ko: "보내지 못했습니다. 이메일 주소를 확인한 뒤 다시 시도해 주세요.", ru: "Не удалось отправить. Проверьте адрес и повторите попытку." },
  btnLogin: { ja: "ログイン", en: "Log in", zh: "登录", it: "Accedi", de: "Anmelden", fr: "Se connecter", es: "Iniciar sesión", ko: "로그인", ru: "Войти" },
  noAccountText: { ja: "アカウントをお持ちでない方は", en: "Don't have an account?", zh: "尚未拥有账户？", it: "Non hai un account?", de: "Noch kein Konto?", fr: "Vous n'avez pas de compte ?", es: "¿No tienes una cuenta?", ko: "계정이 없으신가요?", ru: "Нет аккаунта?" },
  linkSignup: { ja: "新規登録", en: "Sign up", zh: "新用户注册", it: "Registrati", de: "Registrieren", fr: "S'inscrire", es: "Registrarse", ko: "회원가입", ru: "Регистрация" },
};

function ltr(key, lang) { const e = LT[key]; if (!e) return ""; return e[lang] || e.en || e.ja || ""; }

const inputStyle = {
  padding: "13px 15px",
  borderRadius: 10,
  border: "1px solid #E4DCC9",
  fontSize: 15,
  background: "#FFFDF8",
  color: "#241914",
  width: "100%"
};

function LangSwitcher({ lang }) {
  return (
    <div style={{ position: "relative", zIndex: 4, display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 18 }}>
      {LOGIN_LANGS.map((l) => (
        <a
          key={l.code}
          href={l.code === "ja" ? "/login" : `/login?lang=${l.code}`}
          style={{
            fontSize: 11, padding: "3px 8px", borderRadius: 999,
            border: `1px solid ${lang === l.code ? "#D4A94F" : "rgba(217,199,168,0.4)"}`,
            background: lang === l.code ? "#D4A94F" : "transparent",
            color: lang === l.code ? "#2A1216" : "#D9C7A8",
            textDecoration: "none"
          }}
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

function CurtainPanel({ side }) {
  const isLeft = side === "left";
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [isLeft ? "left" : "right"]: 0,
        width: "34%",
        minWidth: 160,
        background: isLeft
          ? "repeating-linear-gradient(100deg, #6B1620 0px, #8A2A36 26px, #57121B 52px, #7A1F2B 78px)"
          : "repeating-linear-gradient(80deg, #6B1620 0px, #8A2A36 26px, #57121B 52px, #7A1F2B 78px)",
        boxShadow: isLeft ? "inset -40px 0 60px rgba(0,0,0,0.45)" : "inset 40px 0 60px rgba(0,0,0,0.45)",
        zIndex: 2
      }}
    >
      {/* 上部の房飾り（スワッグ）のシルエット */}
      <svg
        viewBox="0 0 200 60"
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 48, opacity: 0.9 }}
      >
        <path d={isLeft ? "M0,0 L200,0 L200,10 Q140,45 90,15 Q40,50 0,20 Z" : "M0,0 L200,0 L200,20 Q160,50 110,15 Q60,45 0,10 Z"} fill="#4A1119" />
      </svg>
    </div>
  );
}

function SingerSilhouette() {
  return (
    <svg viewBox="0 0 120 200" style={{ width: 92, height: "auto", position: "relative", zIndex: 3 }}>
      {/* 歌う人のシルエット：片腕を上げ、少し顔を上げたポーズ */}
      <ellipse cx="60" cy="190" rx="34" ry="8" fill="#1A0E0F" opacity="0.35" />
      <path
        d="M52,50 Q46,30 60,26 Q74,30 68,50 Q78,54 76,70 Q94,58 100,42 Q104,40 102,46 Q92,68 74,78 L78,140 Q90,150 88,182 L70,182 L66,140 L60,110 L54,140 L50,182 L32,182 Q30,150 42,140 L46,78 Q30,72 22,54 Q20,48 24,50 Q32,64 48,70 Q44,54 52,50 Z"
        fill="#1A0E0F"
      />
    </svg>
  );
}

function MusicNote({ style }) {
  return (
    <span
      style={{
        position: "absolute",
        fontSize: 22,
        color: "#D4A94F",
        opacity: 0.55,
        fontFamily: "Georgia, serif",
        animation: "noteFloat 7s ease-in-out infinite",
        ...style
      }}
    >
      ♪
    </span>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const lang = LOGIN_LANGS.some((l) => l.code === searchParams.get("lang")) ? searchParams.get("lang") : "ja";
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  // パスワードの再設定。Supabase Auth の標準の仕組み（resetPasswordForEmail）を使う。
  // 独自にトークンを作ったりはしない。
  const [mode, setMode] = useState("login");        // login | reset
  const [resetStatus, setResetStatus] = useState("idle"); // idle | sending | sent | error

  async function handleReset(e) {
    e.preventDefault();
    setResetStatus("sending");
    const supabase = createClient();
    // 再設定用リンクの戻り先。/auth/callback がセッションを確立してから
    // /reset-password へ送る（既存の仕組みをそのまま使う）。
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo });
    if (error) {
      console.error("パスワード再設定メールの送信に失敗しました:", error);
      setResetStatus("error");
      return;
    }
    setResetStatus("sent");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    });
    if (error) {
      setError(ltr("errorLogin", lang));
      setStatus("idle");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background: "radial-gradient(ellipse 70% 55% at 50% 32%, #3A1016 0%, #1A0A0D 62%, #12070A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px"
      }}
    >
      <style>{`
        @keyframes noteFloat {
          0%, 100% { transform: translateY(0) rotate(-4deg); opacity: 0.35; }
          50% { transform: translateY(-14px) rotate(4deg); opacity: 0.7; }
        }
        @keyframes spotlightPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.75; }
        }
        @keyframes cardRise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* スポットライト */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70%",
          height: "70%",
          background: "radial-gradient(ellipse 50% 60% at 50% 20%, rgba(240,223,168,0.35) 0%, rgba(240,223,168,0) 70%)",
          animation: "spotlightPulse 5s ease-in-out infinite",
          zIndex: 1,
          pointerEvents: "none"
        }}
      />

      {/* 音符（漂う） */}
      <MusicNote style={{ top: "14%", left: "12%", animationDelay: "0s" }} />
      <MusicNote style={{ top: "22%", right: "14%", animationDelay: "1.6s", fontSize: 28 }} />
      <MusicNote style={{ top: "40%", left: "8%", animationDelay: "3.1s", fontSize: 18 }} />
      <MusicNote style={{ top: "10%", right: "26%", animationDelay: "2.2s", fontSize: 16 }} />

      {/* 舞台袖のカーテン */}
      <CurtainPanel side="left" />
      <CurtainPanel side="right" />

      {/* コンテンツ */}
      <div style={{ position: "relative", zIndex: 4, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 420 }}>
        <LangSwitcher lang={lang} />
        <SingerSilhouette />

        <h1
          className="ff-display italic"
          style={{ fontSize: "3rem", color: "#F6F1E7", marginTop: 4, marginBottom: 2, textAlign: "center", textShadow: "0 2px 24px rgba(212,169,79,0.35)" }}
        >
          La Voce
        </h1>
        <p style={{ color: "#D9C7A8", fontSize: 13, letterSpacing: "0.04em", marginBottom: 30, textAlign: "center" }}>
          {ltr("subtitle", lang)}
        </p>

        <form
          onSubmit={mode === "reset" ? handleReset : handleSubmit}
          style={{
            width: "100%",
            background: "#FBF6EA",
            borderRadius: 18,
            padding: "30px 26px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,169,79,0.25)",
            animation: "cardRise 0.7s ease-out",
            display: "flex",
            flexDirection: "column",
            gap: 14
          }}
        >
          <h2 className="ff-display italic" style={{ fontSize: "1.4rem", color: "#7A1F2B", margin: "0 0 4px" }}>
            {mode === "reset" ? ltr("resetTitle", lang) : ltr("formTitle", lang)}
          </h2>
          {mode === "reset" && (
            <p style={{ fontSize: 13, color: "#6b5d52", margin: "0 0 4px" }}>{ltr("resetLead", lang)}</p>
          )}
          <input
            required
            type="email"
            placeholder={ltr("placeholderEmail", lang)}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            style={inputStyle}
          />
          {mode === "login" && (
            <input
              required
              type="password"
              placeholder={ltr("placeholderPassword", lang)}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              style={inputStyle}
            />
          )}
          {error && <p style={{ color: "#7A1F2B", fontSize: 13, margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              padding: "14px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(180deg, #8A2A36, #7A1F2B)",
              color: "#FBF6EA",
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: "0.02em",
              boxShadow: "0 6px 16px rgba(122,31,43,0.4)"
            }}
          >
            {mode === "reset"
              ? (resetStatus === "sending" ? ltr("resetSending", lang) : ltr("resetSend", lang))
              : (status === "loading" ? ltr("btnLoading", lang) : ltr("btnLogin", lang))}
          </button>

          {mode === "reset" && resetStatus === "sent" && (
            <>
              <p style={{ fontSize: 13, color: "#4F7562", margin: 0 }}>{ltr("resetSent", lang)}</p>
              <p style={{ fontSize: 12, color: "#6b5d52", margin: 0 }}>{ltr("resetSpamNote", lang)}</p>
            </>
          )}
          {mode === "reset" && resetStatus === "error" && (
            <p style={{ fontSize: 13, color: "#7A1F2B", margin: 0 }}>{ltr("resetError", lang)}</p>
          )}

          <button type="button"
            onClick={() => { setMode(mode === "reset" ? "login" : "reset"); setResetStatus("idle"); setError(""); }}
            style={{ background: "none", border: "none", padding: 0, fontSize: 13, color: "#7A1F2B", textDecoration: "underline", cursor: "pointer" }}>
            {mode === "reset" ? ltr("resetBack", lang) : ltr("linkForgot", lang)}
          </button>
        </form>

        <p style={{ marginTop: 22, fontSize: 13, color: "#D9C7A8" }}>
          {ltr("noAccountText", lang)}{" "}
          <a href="/signup" style={{ color: "#F0DFA8", fontWeight: 600 }}>
            {ltr("linkSignup", lang)}
          </a>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
