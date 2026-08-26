"use client";
// このファイルは components/AdminDashboard.jsx として配置してください。
// lavoce-管理画面仕様.md §7 第1版・実行順マスター Stage 2-1: 管理画面 第1版（既存テーブルのみ）。
//
// 【アクセス制御】profiles.is_admin が true のユーザーだけが中身を見られる。
// この判定はクライアント側だけでなく、Supabase側のRLSポリシー（Admins can view all entries/profiles）
// でも二重に保護されている。is_adminがfalseの一般ユーザーが仮にこの画面を開いても、
// RLSにより他ユーザーのデータは1件も返らないため、クライアント側の判定はUXのためのものであり、
// 実際のデータ保護はサーバ（RLS）側が担っている。

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/tokens";

const SURVEY_LABELS = {
  morning30: "朝30秒の記録",
  weekly_discovery: "週の振り返り・分析の発見",
  performance_prep: "本番に向けた準備",
  not_yet: "まだよく分からない"
};

export default function AdminDashboard({ userId }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: me, error: meError } = await supabase.from("profiles").select("is_admin").eq("id", userId).single();
      if (meError || !me || !me.is_admin) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id, created_at, survey_day7_response, pwa_install_prompted_at, pwa_installed_at, onboarding_completed, goal_focus, vocal_profession");
      const { data: entries, error: entriesError } = await supabase.from("entries").select("user_id, date, weight_kg, body_fat_pct, meals, exercises, exercise_level, temperature, humidity, medication_tags, mental_tags, mental_reason, cpps_value, voice_memo");

      if (profilesError || entriesError) {
        setError((profilesError && profilesError.message) || (entriesError && entriesError.message) || "データの取得に失敗しました。");
        setLoading(false);
        return;
      }

      // ユーザーごとの記録日数・直近記録日を集計する
      const byUser = {};
      (entries || []).forEach((e) => {
        if (!byUser[e.user_id]) byUser[e.user_id] = { count: 0, lastDate: e.date };
        byUser[e.user_id].count += 1;
        if (e.date > byUser[e.user_id].lastDate) byUser[e.user_id].lastDate = e.date;
      });

      const totalUsers = (profiles || []).length;
      const totalEntries = (entries || []).length;
      const usersWithAnyEntry = Object.keys(byUser).length;
      const usersWith7PlusDays = Object.values(byUser).filter((u) => u.count >= 7).length;
      const usersWith14PlusDays = Object.values(byUser).filter((u) => u.count >= 14).length;

      // 実行順マスター Stage 0-3と同じ考え方の入力率（全ユーザー・直近データの合算）
      const n = totalEntries || 1;
      const inputRates = {
        weight: (entries || []).filter((e) => typeof e.weight_kg === "number").length / n,
        bodyFat: (entries || []).filter((e) => typeof e.body_fat_pct === "number").length / n,
        mealDetail: (entries || []).filter((e) => Array.isArray(e.meals) && e.meals.length > 0).length / n,
        exerciseDetail: (entries || []).filter((e) => Array.isArray(e.exercises) && e.exercises.length > 0).length / n,
        environment: (entries || []).filter((e) => typeof e.temperature === "number" || typeof e.humidity === "number").length / n,
        medication: (entries || []).filter((e) => Array.isArray(e.medication_tags) && e.medication_tags.length > 0).length / n,
        mentalDetail: (entries || []).filter((e) => (Array.isArray(e.mental_tags) && e.mental_tags.length > 0) || (e.mental_reason || "").trim()).length / n,
        cpps: (entries || []).filter((e) => typeof e.cpps_value === "number").length / n,
        voiceMemo: (entries || []).filter((e) => (e.voice_memo || "").trim()).length / n
      };

      const surveyCounts = {};
      (profiles || []).forEach((p) => {
        if (p.survey_day7_response) surveyCounts[p.survey_day7_response] = (surveyCounts[p.survey_day7_response] || 0) + 1;
      });

      const pwaPrompted = (profiles || []).filter((p) => p.pwa_install_prompted_at).length;
      const pwaInstalled = (profiles || []).filter((p) => p.pwa_installed_at).length;

      const onboardingIncomplete = (profiles || []).filter((p) => !p.onboarding_completed).length;

      setStats({
        totalUsers, totalEntries, usersWithAnyEntry, usersWith7PlusDays, usersWith14PlusDays,
        inputRates, surveyCounts, pwaPrompted, pwaInstalled, onboardingIncomplete
      });
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return <div style={{ padding: 24, color: C.inkSoft }}>読み込み中…</div>;
  }
  if (isAdmin === false) {
    return <div style={{ padding: 24, color: C.ink }}>このページを見る権限がありません。</div>;
  }
  if (error) {
    return <div style={{ padding: 24, color: C.curtain }}>エラー: {error}</div>;
  }

  const pct = (v) => `${Math.round(v * 1000) / 10}%`;

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui", color: C.ink, background: C.paper, minHeight: "100vh" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>La Voce 管理画面（第1版）</h1>
      <p style={{ fontSize: 12, color: C.inkSoft, marginBottom: 24 }}>
        既存テーブル（entries / profiles）のみを使った集計です。管理画面仕様.md §7 第2版で events テーブルによる拡張を予定しています。
      </p>

      <Section title="全体">
        <Row label="登録ユーザー数" value={stats.totalUsers} />
        <Row label="総記録件数" value={stats.totalEntries} />
        <Row label="1件以上記録したユーザー" value={stats.usersWithAnyEntry} />
        <Row label="7日以上記録したユーザー" value={stats.usersWith7PlusDays} />
        <Row label="14日以上記録したユーザー" value={stats.usersWith14PlusDays} />
        <Row label="オンボーディング未完了" value={stats.onboardingIncomplete} />
      </Section>

      <Section title="項目ごとの入力率（全ユーザー・全記録の合算）">
        <Row label="体重" value={pct(stats.inputRates.weight)} />
        <Row label="体脂肪率" value={pct(stats.inputRates.bodyFat)} />
        <Row label="食事の詳細記録" value={pct(stats.inputRates.mealDetail)} />
        <Row label="運動の詳細記録" value={pct(stats.inputRates.exerciseDetail)} />
        <Row label="環境（気温・湿度）" value={pct(stats.inputRates.environment)} />
        <Row label="服薬タグ" value={pct(stats.inputRates.medication)} />
        <Row label="気持ちタグ・日記" value={pct(stats.inputRates.mentalDetail)} />
        <Row label="CPPS客観測定" value={pct(stats.inputRates.cpps)} />
        <Row label="声のメモ" value={pct(stats.inputRates.voiceMemo)} />
      </Section>

      <Section title="7日目マイクロ調査の回答分布">
        {Object.keys(stats.surveyCounts).length === 0 ? (
          <p style={{ fontSize: 13, color: C.inkSoft }}>まだ回答がありません。</p>
        ) : (
          Object.entries(stats.surveyCounts).map(([key, count]) => (
            <Row key={key} label={SURVEY_LABELS[key] || key} value={`${count}件`} />
          ))
        )}
      </Section>

      <Section title="PWAインストール導線">
        <Row label="インストールを促した回数" value={stats.pwaPrompted} />
        <Row label="実際にインストールされた数" value={stats.pwaInstalled} />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, borderBottom: `1px solid ${C.line}`, paddingBottom: 6 }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
      <span style={{ color: C.inkSoft }}>{label}</span>
      <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
