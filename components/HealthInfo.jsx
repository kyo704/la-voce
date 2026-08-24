"use client";

import { useState } from "react";
import { BookOpen, AlertCircle, Wind, Dumbbell, Ruler, ChevronDown } from "lucide-react";
import { C } from "@/lib/tokens";
import { HEALTH_INFO_CONTENT } from "@/lib/healthInfoContent";

function h(key, language) {
  const entry = HEALTH_INFO_CONTENT[key];
  if (!entry) return key;
  return entry[language] || entry.ja || key;
}

// **text** を <strong> に変換して表示する軽量マークアップパーサー
function Markup({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Section({ title, icon: Icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.card }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left"
      >
        <span className="flex items-center gap-2">
          <Icon size={18} style={{ color: C.curtain }} />
          <span className="ff-display italic text-lg">{title}</span>
        </span>
        <ChevronDown
          size={18}
          style={{ color: C.inkSoft, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-5 text-sm leading-relaxed space-y-3" style={{ color: C.ink }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Note({ children }) {
  return (
    <p className="text-xs rounded-xl p-3" style={{ background: C.paper, color: C.inkSoft, lineHeight: 1.7 }}>
      {children}
    </p>
  );
}

export default function HealthInfo({ language = "ja" }) {
  const t = (key) => h(key, language);
  return (
    <div className="space-y-4">
      <p style={{ background: "#ffe066", color: "#000", padding: "10px", fontWeight: "bold", fontSize: "16px", border: "3px solid red" }}>
        DEBUG: HealthInfo received language = "{language}" (typeof: {typeof language})
      </p>
      <p className="text-xs leading-relaxed px-1" style={{ color: C.inkSoft }}>
        {t("disclaimer")}
      </p>

      <Section title={t("s1Title")} icon={AlertCircle} defaultOpen>
        <p><Markup text={t("s1Para1")} /></p>
        <p><Markup text={t("s1Para2Intro")} /></p>
        <ul className="list-disc pl-5 space-y-1">
          <li><Markup text={t("s1List1")} /></li>
          <li><Markup text={t("s1List2")} /></li>
          <li><Markup text={t("s1List3")} /></li>
          <li><Markup text={t("s1List4")} /></li>
        </ul>
        <p><Markup text={t("s1Para3")} /></p>
        <p><Markup text={t("s1Para4Intro")} /></p>
        <ul className="list-disc pl-5 space-y-1">
          <li><Markup text={t("s1List5")} /></li>
          <li><Markup text={t("s1List6")} /></li>
          <li><Markup text={t("s1List7")} /></li>
          <li><Markup text={t("s1List8")} /></li>
        </ul>
        <Note>{t("s1Note")}</Note>
      </Section>

      <Section title={t("s2Title")} icon={AlertCircle}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>{t("s2Item1Term")}</strong>：{t("s2Item1Desc")}</li>
          <li><strong>{t("s2Item2Term")}</strong>：{t("s2Item2Desc")}</li>
          <li><strong>{t("s2Item3Term")}</strong>：{t("s2Item3Desc")}</li>
          <li><strong>{t("s2Item4Term")}</strong>：{t("s2Item4Desc")}</li>
        </ul>
        <Note>{t("s2Note")}</Note>
      </Section>

      <Section title={t("s3Title")} icon={Wind}>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("s3List1")}</li>
          <li>{t("s3List2")}</li>
          <li>{t("s3List3")}</li>
          <li>{t("s3List4")}</li>
          <li>{t("s3List5")}</li>
          <li>{t("s3List6")}</li>
        </ul>
      </Section>

      <Section title={t("s4Title")} icon={Dumbbell}>
        <div>
          <p className="font-medium mt-2">{t("s4Sub1")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>{t("s4Item1Term")}</strong>：{t("s4Item1Desc")}</li>
            <li><strong>{t("s4Item2Term")}</strong>：{t("s4Item2Desc")}</li>
            <li><strong>{t("s4Item3Term")}</strong>：{t("s4Item3Desc")}</li>
          </ul>
        </div>
        <div>
          <p className="font-medium mt-2">{t("s4Sub2")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>{t("s4Item4Term")}</strong>：{t("s4Item4Desc")}</li>
            <li><strong>{t("s4Item5Term")}</strong>：{t("s4Item5Desc")}</li>
            <li><strong>{t("s4Item6Term")}</strong>：{t("s4Item6Desc")}</li>
          </ul>
        </div>
        <div>
          <p className="font-medium mt-2">{t("s4Sub3")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>{t("s4Item7Term")}</strong>：{t("s4Item7Desc")}</li>
          </ul>
        </div>
      </Section>

      <Section title={t("s5Title")} icon={Dumbbell}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>{t("s5Item1Term")}</strong>：{t("s5Item1Desc")}</li>
          <li><strong>{t("s5Item2Term")}</strong>：{t("s5Item2Desc")}</li>
        </ul>
        <Note>{t("s5Note")}</Note>
      </Section>

      <Section title={t("s6Title")} icon={Ruler}>
        <p>{t("s6Para1")}</p>
      </Section>
    </div>
  );
}
