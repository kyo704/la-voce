import { isNativeApp } from "@/lib/isNativeApp";
import { C } from "@/lib/tokens";
import SignupForm from "@/components/SignupForm";

const NATIVE_T = {
  title: { ja: "ご登録について", en: "About Signing Up", zh: "关于注册", it: "Informazioni sulla registrazione", de: "Zur Registrierung", fr: "À propos de l'inscription", es: "Sobre el registro", ko: "가입 안내", ru: "О регистрации" },
  body: {
    ja: "新規のご登録はウェブサイトから行っていただけます。登録後、このアプリでログインしてご利用いただけます。",
    en: "New sign-ups can be completed on the website. After registering, you can log in and use this app.",
    zh: "新用户请通过网站进行注册。注册完成后，即可在本应用中登录使用。",
    it: "La registrazione può essere completata sul sito web. Dopo la registrazione, potrai accedere e utilizzare questa app.",
    de: "Neuanmeldungen erfolgen über die Website. Nach der Registrierung kannst du dich in dieser App anmelden und sie nutzen.",
    fr: "Les nouvelles inscriptions se font sur le site web. Après votre inscription, vous pourrez vous connecter et utiliser cette application.",
    es: "Los nuevos registros se realizan en el sitio web. Después de registrarte, podrás iniciar sesión y usar esta aplicación.",
    ko: "신규 가입은 웹사이트에서 진행해 주세요. 가입 후에는 이 앱에서 로그인하여 이용하실 수 있습니다.", ru: "Новую регистрацию можно пройти на сайте. После регистрации вы сможете войти и пользоваться этим приложением."
  }
};
const NATIVE_LANG_CODES = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];

export default function SignupPage({ searchParams }) {
  // ネイティブアプリ内では新規登録フォームを表示しない
  // （Apple Guideline 3.1.3(b) 準拠：アプリ内に購入・登録導線を置かない）
  if (isNativeApp()) {
    const lang = NATIVE_LANG_CODES.includes(searchParams?.lang) ? searchParams.lang : "ja";
    return (
      <main style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain }}>
          {NATIVE_T.title[lang]}
        </h1>
        <p style={{ color: C.inkSoft, marginTop: 12, lineHeight: 1.7 }}>
          {NATIVE_T.body[lang]}
        </p>
      </main>
    );
  }

  return <SignupForm />;
}
