import { C } from "@/lib/tokens";
import { TYPE } from "@/lib/uiKit";

function mmdd(iso) {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

function valueOf(entry, key) {
  const value = entry && entry[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function Metric({ title, dates, entries, field, tint = C.curtain, min = 1, max = 3, sleep = false }) {
  const values = dates.map((date) => valueOf(entries[date], field));
  const filled = values.filter((value) => value != null);
  if (filled.length === 0) return null;
  const height = 56;
  return (
    <div className="card" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 9 }}>
      <div style={{ ...TYPE.mini, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: dates.length <= 14 ? 4 : 2, height }}>
        {values.map((value, index) => (
          <i key={dates[index]} title={value == null ? mmdd(dates[index]) : `${mmdd(dates[index])} ${value}`}
            style={{
              flex: 1, display: "block", minWidth: 0, height: value == null ? 0 : `${Math.max(10, ((value - min) / Math.max(1, max - min)) * 100)}%`,
              background: tint, opacity: value == null ? 0 : 0.45 + ((value - min) / Math.max(1, max - min)) * 0.45,
              borderRadius: "2px 2px 0 0"
            }} />
        ))}
      </div>
      <div style={{ ...TYPE.usual, textAlign: "right", marginTop: 5 }}>
        {sleep ? "4〜9時間" : dates.length <= 14 ? dates.filter((_, i) => i % 3 === 0).map((d) => mmdd(d)).join("　") : "1本＝1日"}
      </div>
    </div>
  );
}

function Concerns({ dates, entries }) {
  const marks = dates.map((date) => Array.isArray(entries[date]?.throatSymptoms) && entries[date].throatSymptoms.length > 0);
  if (!marks.some(Boolean)) return null;
  return (
    <div className="card" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
      <div style={{ ...TYPE.mini, marginBottom: 9 }}>気になったこと</div>
      <div style={{ display: "grid", gap: 6 }}>
        {["気になったこと"].map((label) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ minWidth: 92, ...TYPE.usual }}>{label}</span>
            <span style={{ display: "flex", flex: 1, gap: 2 }}>
              {marks.map((on, i) => <i key={dates[i]} style={{ flex: 1, height: 14, borderRadius: 2, background: on ? C.curtain : C.line2, opacity: on ? 0.7 : 1 }} />)}
            </span>
          </div>
        ))}
      </div>
      <div style={{ ...TYPE.usual, marginTop: 7 }}>●＝その日 あった</div>
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
