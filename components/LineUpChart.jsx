import { C } from "@/lib/tokens";
import { TYPE } from "@/lib/uiKit";

function mmdd(iso) {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

function valueOf(entry, key) {
  const value = entry && entry[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// 長さ＝値の割合、色の濃さ＝値の割合、の両方で差を見せる（長さだけの濃淡表現をやめる）。
function ratioOf(value, min, max) {
  if (value == null) return 0;
  return Math.max(0, Math.min(1, (value - min) / Math.max(1, max - min)));
}

function horizontalValue(value, min, max) {
  if (value == null) return 0;
  return 15 + ratioOf(value, min, max) * 85;
}

function Metric({ title, dates, entries, field, tint = C.curtain, min = 1, max = 5, sleep = false }) {
  const values = dates.map((date) => valueOf(entries[date], field));
  const filled = values.filter((value) => value != null);
  if (filled.length === 0) return null;
  const horizontal = dates.length <= 28;
  const height = sleep ? 72 : 64;
  return (
    <div className="card" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 9, minHeight: sleep ? 126 : horizontal ? 170 : 126, boxSizing: "border-box" }}>
      <div style={{ ...TYPE.mini, marginBottom: 8 }}>{title}</div>
      {horizontal && !sleep ? (
        <div style={{ display: "grid", gap: 4 }}>
          {values.map((value, index) => (
            <div key={dates[index]} style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 20 }}>
              <s style={{ width: 31, ...TYPE.usual, textDecoration: "none", color: C.inkSoft, flexShrink: 0 }}>
                {dates.length <= 14 || index % 7 === 0 ? mmdd(dates[index]) : ""}
              </s>
              <span style={{ flex: 1, height: 12, borderRadius: 2, background: C.line2, position: "relative", overflow: "hidden" }}>
                {value != null && (
                  <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${horizontalValue(value, min, max)}%`, background: tint, opacity: 0.35 + ratioOf(value, min, max) * 0.6, borderRadius: 2 }} />
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", gap: dates.length <= 14 ? 4 : 2, height }}>
          {values.map((value, index) => (
            <i key={dates[index]} title={value == null ? mmdd(dates[index]) : `${mmdd(dates[index])} ${value}`}
              style={{
                flex: 1, display: "block", minWidth: 0, height: value == null ? 0 : `${Math.max(10, ratioOf(value, min, max) * 100)}%`,
                background: tint, opacity: value == null ? 0 : 0.35 + ratioOf(value, min, max) * 0.6,
                borderRadius: "2px 2px 0 0"
              }} />
          ))}
        </div>
      )}
      <div style={{ ...TYPE.usual, textAlign: "right", marginTop: 7 }}>{sleep ? "4〜9時間" : !horizontal ? "1本＝1日" : ""}</div>
    </div>
  );
}

function Concerns({ dates, entries }) {
  const symptoms = ["のどが いがらっぽい", "せきばらい", "のどが 渇く", "鼻が つまる", "肩が こわばる", "胃が もたれる"];
  const rows = symptoms.map((symptom) => {
    const days = dates.map((date) => (entries[date]?.throatSymptoms || []).includes(symptom));
    return { symptom, days, count: days.filter(Boolean).length };
  });
  if (!rows.some((row) => row.count > 0)) return null;
  const horizontal = dates.length <= 28;
  return (
    <div className="card" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, minHeight: 218, boxSizing: "border-box" }}>
      <div style={{ ...TYPE.mini, marginBottom: 9 }}>気になったこと</div>
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map(({ symptom, days, count }) => {
          const weeks = [];
          for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7).filter(Boolean).length);
          return (
          <div key={symptom} style={{ display: "flex", alignItems: "center", gap: 7, minHeight: 18 }}>
            <span style={{ width: 112, ...TYPE.usual, flexShrink: 0 }}>{symptom}</span>
            <span style={{ display: "flex", flex: 1, gap: 2, alignItems: "center", height: horizontal ? 14 : 32 }}>
              {(horizontal ? days : weeks).map((amount, i) => <i key={i} style={{ flex: 1, height: horizontal ? 14 : `${amount ? 30 + (amount / 7) * 70 : 8}%`, minHeight: horizontal ? 14 : 3, borderRadius: 2, background: amount ? C.curtain : C.line2, opacity: amount ? 0.7 : 1 }} />)}
            </span>
            <span style={{ width: 30, textAlign: "right", ...TYPE.usual, flexShrink: 0 }}>{count}日</span>
          </div>
          );
        })}
      </div>
      <div style={{ ...TYPE.usual, marginTop: 7 }}>{horizontal ? "●＝その日 あった" : "1本＝1週間。高さ＝その週に あった日数"}</div>
    </div>
  );
}

export default function LineUpChart({ entries = {}, dates = [] }) {
  if (!dates.length) return null;
  return (
    <div>
      <Metric title="こえの ちょうし" dates={dates} entries={entries} field="voiceQuality" />
      <Metric title="のどの ちょうし" dates={dates} entries={entries} field="throatCondition" />
      <Metric title="昨夜の 睡眠" dates={dates} entries={entries} field="sleepHours" tint={C.sage} min={4} max={9} sleep />
      <Concerns dates={dates} entries={entries} />
    </div>
  );
}
