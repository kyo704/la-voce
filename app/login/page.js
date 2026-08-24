"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputStyle = {
  padding: "13px 15px",
  borderRadius: 10,
  border: "1px solid #E4DCC9",
  fontSize: 15,
  background: "#FFFDF8",
  color: "#241914",
  width: "100%"
};

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

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

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
      setError("メールアドレスまたはパスワードが正しくありません。");
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
        <SingerSilhouette />

        <h1
          className="ff-display italic"
          style={{ fontSize: "3rem", color: "#F6F1E7", marginTop: 4, marginBottom: 2, textAlign: "center", textShadow: "0 2px 24px rgba(212,169,79,0.35)" }}
        >
          La Voce
        </h1>
        <p style={{ color: "#D9C7A8", fontSize: 13, letterSpacing: "0.04em", marginBottom: 30, textAlign: "center" }}>
          声を使う人のための体調管理アプリ
        </p>

        <form
          onSubmit={handleSubmit}
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
            開幕まであと少し
          </h2>
          <input
            required
            type="email"
            placeholder="メールアドレス"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            style={inputStyle}
          />
          <input
            required
            type="password"
            placeholder="パスワード"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            style={inputStyle}
          />
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
            {status === "loading" ? "開演準備中…" : "ログイン"}
          </button>
        </form>

        <p style={{ marginTop: 22, fontSize: 13, color: "#D9C7A8" }}>
          アカウントをお持ちでない方は{" "}
          <a href="/signup" style={{ color: "#F0DFA8", fontWeight: 600 }}>
            新規登録
          </a>
        </p>
      </div>
    </main>
  );
}
