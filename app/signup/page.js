import { isNativeApp } from "@/lib/isNativeApp";
import { C } from "@/lib/tokens";
import SignupForm from "@/components/SignupForm";

export default function SignupPage() {
  // ネイティブアプリ内では新規登録フォームを表示しない
  // （Apple Guideline 3.1.3(b) 準拠：アプリ内に購入・登録導線を置かない）
  if (isNativeApp()) {
    return (
      <main style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain }}>
          ご登録について
        </h1>
        <p style={{ color: C.inkSoft, marginTop: 12, lineHeight: 1.7 }}>
          新規のご登録はウェブサイトから行っていただけます。登録後、このアプリでログインしてご利用いただけます。
        </p>
      </main>
    );
  }

  return <SignupForm />;
}
