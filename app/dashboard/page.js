import { createClient } from "@/lib/supabase/server";
import VocalTracker from "@/components/VocalTracker";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <VocalTracker userId={user.id} userEmail={user.email} />;
}
