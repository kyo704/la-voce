import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserWithTimeout } from "@/lib/withTimeout";
import ConnectionError from "@/components/ConnectionError";
import VocalTracker from "@/components/VocalTracker";

export default async function DashboardPage() {
  const supabase = createClient();
  // 通信が不安定な瞬間（Supabaseの一時停止からの復帰中など）は、layout.js を通過していても
  // ここで user が null になりうる。以前はそのまま user.id を読んでいたため、
  // 「TypeError: Cannot read properties of null (reading 'id')」で画面ごと落ちていた。
  //
  // ★ただし、ログイン画面へ戻していいのは「本当にログインしていない」ときだけ。
  //   つながらないだけの人を戻すと、ログイン画面も同じ理由で開かず、
  //   利用者から見れば「アプリが二度と開かない」になる。
  // ★判定は lib/withTimeout.js の1か所から。以前はここに try/catch を
  //   書いていたため、同じ形がほかの10か所に広がらないままでした。
  const { user, unreachable } = await getUserWithTimeout(supabase, "認証の確認");
  if (unreachable) return <ConnectionError detail="認証の確認がタイムアウトしました" />;

  if (!user) redirect("/login");

  // ★登録画面で「18歳未満ですか？」に答えた人は、その答えが auth の
  //   user_metadata に預けてあります（確認メールの前で、まだ profiles に
  //   書けなかったため）。初回ログインのここで受け渡し、VocalTracker が
  //   profiles へ移します（lib/ageGate.js の adoptSignupAnswer）。
  //   答えていなければ null で、アプリの中の質問が出るだけです。
  const signupAgeAnswer = typeof user.user_metadata?.is_under_18 === "boolean"
    ? user.user_metadata.is_under_18
    : null;

  // ★登録画面で選んだ職業。年齢の答えと同じ道すじで、初回ログインに
  //   profiles.voice_occupation へ移します（lib/occupation.js の
  //   adoptSignupOccupation）。★profiles.occupation には書きません。
  const signupVoiceOccupation =
    typeof user.user_metadata?.voice_occupation === "string"
      ? user.user_metadata.voice_occupation
      : null;

  return (
    <VocalTracker
      userId={user.id}
      userEmail={user.email}
      signupAgeAnswer={signupAgeAnswer}
      signupVoiceOccupation={signupVoiceOccupation}
    />
  );
}
