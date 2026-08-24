"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { C } from "@/lib/tokens";
import {
  SHOP_ITEMS, SINGLE_SLOT_CATEGORIES, MULTI_SLOT_CATEGORIES,
  computeTotalEarned, computeStreaks, computeBalance
} from "@/lib/character";

const CATEGORY_LABEL_KEYS = {
  hat: "catHat", outfit: "catOutfit", floor: "catFloor", wall: "catWall",
  window: "catWindow", scenery: "catScenery", furniture: "catFurniture", garden: "catGarden"
};
const MATERIAL_COLORS = {
  floor_default: "#D8C9A8", floor_tile: "#C9C2B4", floor_carpet: "#C98A9E",
  wall_default: "#F3E9D8", wall_stripe: "#E9D9C0", wall_wood: "#B98A5E",
  window_default: "#FFFDF8", window_wood: "#8B5E3C", window_blue: "#5C7599",
  scenery_default: "#BFE0E8", scenery_night: "#2E3A5C", scenery_sakura: "#F2C9D3"
};

// ===== 羊のキャラクター（チビ体型・二頭身） =====
function SheepCharacter({ equipped, size = 120, isWalking = false }) {
  const bodyColor = "#F6EFDF";
  const bodyShade = "#EAE0C8";
  return (
    <svg viewBox="0 0 160 200" style={{ width: size, height: size * 1.25, overflow: "visible", display: "block" }}>
      <style>{`
        @keyframes sheepBlink { 0%, 88%, 100% { transform: scaleY(1); } 92% { transform: scaleY(0.12); } }
        .sheep-eye { transform-box: fill-box; transform-origin: center; animation: sheepBlink 4.6s ease-in-out infinite; }
        @keyframes legSwingL { 0%, 100% { transform: rotate(20deg); } 50% { transform: rotate(-20deg); } }
        @keyframes legSwingR { 0%, 100% { transform: rotate(-20deg); } 50% { transform: rotate(20deg); } }
        @keyframes armSwingL { 0%, 100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg); } }
        @keyframes armSwingR { 0%, 100% { transform: rotate(14deg); } 50% { transform: rotate(-14deg); } }
        @keyframes idleBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
        .leg-l { transform-box: fill-box; transform-origin: top center; ${isWalking ? "animation: legSwingL 0.62s ease-in-out infinite;" : ""} }
        .leg-r { transform-box: fill-box; transform-origin: top center; ${isWalking ? "animation: legSwingR 0.62s ease-in-out infinite;" : ""} }
        .arm-l { transform-box: fill-box; transform-origin: top center; ${isWalking ? "animation: armSwingL 0.62s ease-in-out infinite;" : "animation: idleBob 2.4s ease-in-out infinite;"} }
        .arm-r { transform-box: fill-box; transform-origin: top center; ${isWalking ? "animation: armSwingR 0.62s ease-in-out infinite;" : "animation: idleBob 2.4s ease-in-out infinite;"} }
      `}</style>

      <ellipse cx="80" cy="192" rx="34" ry="8" fill="#3D2E12" opacity="0.14" />

      <g className="leg-l">
        <rect x="52" y="150" width="20" height="34" rx="10" fill={bodyColor} />
        <ellipse cx="62" cy="180" rx="14" ry="8" fill="#EDE4CE" />
      </g>
      <g className="leg-r">
        <rect x="88" y="150" width="20" height="34" rx="10" fill={bodyColor} />
        <ellipse cx="98" cy="180" rx="14" ry="8" fill="#EDE4CE" />
      </g>

      <circle cx="80" cy="130" r="42" fill={bodyColor} />
      {[[45, 110, 16], [115, 110, 16], [40, 140, 14], [120, 140, 14], [55, 160, 14], [105, 160, 14], [80, 168, 16]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={bodyColor} />
      ))}
      <ellipse cx="98" cy="145" rx="30" ry="34" fill="#D8CBA8" opacity="0.35" />

      <g className="arm-l"><ellipse cx="35" cy="128" rx="13" ry="10" fill={bodyColor} /></g>
      <g className="arm-r"><ellipse cx="125" cy="128" rx="13" ry="10" fill={bodyColor} /></g>

      {equipped.outfit === "outfit_scarf" && (
        <g>
          <path d="M56,108 Q80,124 104,108 L100,120 Q80,132 60,120 Z" fill="#C0454B" />
          <path d="M58,116 Q80,127 102,116" stroke="#96323A" strokeWidth="1.2" fill="none" opacity="0.6" />
          {[63, 71, 79, 87, 95].map((x, i) => <circle key={i} cx={x} cy={116 + ((i % 2) * 3)} r="1.6" fill="#F6EFDF" opacity="0.85" />)}
          <path d="M60,120 L58,126 M64,122 L62,128 M96,122 L98,128 M100,120 L102,126" stroke="#96323A" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
      {equipped.outfit === "outfit_overall" && (
        <g>
          <path d="M58,112 L102,112 L98,168 Q80,176 62,168 Z" fill="#5B7FA6" opacity="0.92" />
          <rect x="64" y="100" width="10" height="18" fill="#5B7FA6" />
          <rect x="86" y="100" width="10" height="18" fill="#5B7FA6" />
          <path d="M80,138 Q76,133 72,137 Q70,142 80,150 Q90,142 88,137 Q84,133 80,138 Z" fill="#F6EFDF" opacity="0.9" />
          <circle cx="69" cy="130" r="3" fill="#F6D98A" stroke="#3E5A78" strokeWidth="0.8" />
          <circle cx="91" cy="130" r="3" fill="#F6D98A" stroke="#3E5A78" strokeWidth="0.8" />
        </g>
      )}
      {equipped.outfit === "outfit_sweater" && (
        <g>
          <path d="M50,105 Q80,96 110,105 Q114,140 104,166 Q80,176 56,166 Q46,140 50,105 Z" fill="#C98A56" opacity="0.92" />
          <path d="M64,102 Q80,108 96,102 L94,110 Q80,115 66,110 Z" fill="#B87740" />
          <path d="M74,128 Q80,122 86,128 Q86,134 80,140 Q74,134 74,128 Z" fill="#F6EFDF" opacity="0.85" />
        </g>
      )}

      <circle cx="80" cy="70" r="46" fill={bodyColor} />
      {[[40, 55, 15], [120, 55, 15], [36, 80, 13], [124, 80, 13], [50, 34, 13], [110, 34, 13], [80, 26, 15]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={bodyColor} />
      ))}
      <ellipse cx="102" cy="82" rx="26" ry="30" fill="#D8CBA8" opacity="0.3" />

      <ellipse cx="80" cy="76" rx="30" ry="26" fill="#FBF6EA" />

      <path d="M52,40 Q42,26 52,14 Q60,24 56,34 Q62,30 62,38 Q58,44 52,40 Z" fill="#D9AE6E" stroke="#A87D45" strokeWidth="1.2" />
      <path d="M108,40 Q118,26 108,14 Q100,24 104,34 Q98,30 98,38 Q102,44 108,40 Z" fill="#D9AE6E" stroke="#A87D45" strokeWidth="1.2" />

      <ellipse cx="42" cy="72" rx="8" ry="12" fill={bodyShade} transform="rotate(-20 42 72)" />
      <ellipse cx="118" cy="72" rx="8" ry="12" fill={bodyShade} transform="rotate(20 118 72)" />

      {equipped.hat === "hat_straw" && (
        <g>
          <ellipse cx="80" cy="41" rx="40" ry="9" fill="#C79A46" opacity="0.55" />
          <ellipse cx="80" cy="38" rx="38" ry="8" fill="#E8C979" />
          {Array.from({ length: 13 }).map((_, i) => {
            const t = i / 12;
            const x = 44 + t * 72;
            return <line key={`brim-${i}`} x1={x} y1="34" x2={x} y2="42" stroke="#C79A46" strokeWidth="0.8" opacity="0.55" />;
          })}
          <ellipse cx="80" cy="35" rx="37" ry="4" fill="#F3DFA0" opacity="0.6" />
          <path d="M48,40 Q48,8 80,2 Q112,8 112,40 Q80,24 48,40 Z" fill="#F0D68F" />
          {[
            "M55,38 Q66,20 80,6", "M62,39 Q73,22 86,7", "M69,39 Q80,23 93,9",
            "M76,39 Q87,24 100,12", "M83,39 Q94,25 104,17", "M58,37 Q69,33 80,31"
          ].map((d, i) => (
            <path key={`weave-${i}`} d={d} stroke="#C79A46" strokeWidth="0.9" fill="none" opacity="0.5" />
          ))}
          <path d="M52,36 Q80,29 108,36" stroke="#96323A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M56,35 Q80,28 104,35" stroke="#C0454B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      )}
      {equipped.hat === "hat_knit" && (
        <g>
          <path d="M50,42 Q52,4 80,4 Q108,4 110,42 Q80,32 50,42 Z" fill="#C0454B" />
          {[56, 64, 72, 80, 88, 96, 104].map((x, i) => (
            <path key={i} d={`M${x},40 Q${x},20 ${x - 2 + (i % 2) * 4},6`} stroke="#96323A" strokeWidth="1" fill="none" opacity="0.45" />
          ))}
          <path d="M50,40 Q80,30 110,40" stroke="#96323A" strokeWidth="2.5" fill="none" opacity="0.5" />
          <circle cx="80" cy="6" r="8" fill="#F6EFDF" />
          <circle cx="77" cy="3" r="2" fill="#FFFDF8" opacity="0.7" />
          <circle cx="83" cy="8" r="2" fill="#FFFDF8" opacity="0.7" />
        </g>
      )}
      {equipped.hat === "hat_ribbon" && (
        <g>
          <path d="M56,36 Q66,20 80,30 Q94,20 104,36 Q90,32 80,38 Q70,32 56,36 Z" fill="#C0454B" />
          <path d="M60,35 Q68,24 78,31" stroke="#E87680" strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M100,35 Q92,24 82,31" stroke="#E87680" strokeWidth="1.5" fill="none" opacity="0.6" />
          <circle cx="80" cy="34" r="5.5" fill="#96323A" />
          <circle cx="78" cy="32" r="1.8" fill="#C0454B" opacity="0.8" />
        </g>
      )}

      <ellipse className="sheep-eye" cx="66" cy="76" rx="4" ry="4" fill="#3D3226" />
      <ellipse className="sheep-eye" cx="94" cy="76" rx="4" ry="4" fill="#3D3226" />
      <ellipse cx="80" cy="88" rx="5" ry="3.5" fill="#C98A6E" />
      <path d="M72,94 Q80,99 88,94" stroke="#8A5A42" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="58" cy="88" r="6" fill="#F0B7A4" opacity="0.6" />
      <circle cx="102" cy="88" r="6" fill="#F0B7A4" opacity="0.6" />
    </svg>
  );
}

// ===== うろうろ歩き回るためのフック（CSSの left / top ％だけで位置を動かす）=====
// transform を移動アニメーションに使わないので、ブラウザによる解釈の違いが起きようがない。
function useWanderPercent(centerLeft, centerTop, rangeLeft, rangeTop) {
  const [leftPct, setLeftPct] = useState(centerLeft);
  const [topPct, setTopPct] = useState(centerTop);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const leftRef = useRef(centerLeft);

  useEffect(() => {
    let cancelled = false;
    let timer, walkTimer;
    function pickNext() {
      const delay = 3000 + Math.random() * 2500;
      timer = setTimeout(() => {
        if (cancelled) return;
        let nl, nt, tries = 0;
        do {
          const u = Math.random() * 2 - 1;
          const v = Math.random() * 2 - 1;
          if (u * u + v * v <= 1) {
            nl = centerLeft + u * rangeLeft;
            nt = centerTop + v * rangeTop;
            break;
          }
          tries += 1;
        } while (tries < 20);
        if (nl === undefined) { nl = centerLeft; nt = centerTop; }
        setFacingLeft(nl < leftRef.current - 1);
        leftRef.current = nl;
        setIsWalking(true);
        setLeftPct(nl);
        setTopPct(nt);
        walkTimer = setTimeout(() => { if (!cancelled) setIsWalking(false); }, 2200);
        pickNext();
      }, delay);
    }
    pickNext();
    return () => { cancelled = true; clearTimeout(timer); clearTimeout(walkTimer); };
  }, [centerLeft, centerTop, rangeLeft, rangeTop]);

  return [leftPct, topPct, facingLeft, isWalking];
}

// ===== 庭専用：鳥が飛んだり、宅配便が届いて羊が取りに行ったりする「生活感」フック =====
function useGardenLife(centerLeft, centerTop, rangeLeft, rangeTop) {
  const [leftPct, setLeftPct] = useState(centerLeft);
  const [topPct, setTopPct] = useState(centerTop);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [birds, setBirds] = useState([]);
  const [pkg, setPkg] = useState(null); // { left, top, stage: "waiting" | "collected" } | null
  const leftRef = useRef(centerLeft);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    const addTimer = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

    function moveTo(nl, nt, duration) {
      setFacingLeft(nl < leftRef.current - 1);
      leftRef.current = nl;
      setIsWalking(true);
      setLeftPct(nl);
      setTopPct(nt);
      addTimer(() => { if (!cancelled) setIsWalking(false); }, duration);
    }

    function scheduleWander() {
      const delay = 3000 + Math.random() * 2500;
      addTimer(() => {
        if (cancelled) return;
        if (busyRef.current) { scheduleWander(); return; }
        let nl, nt, tries = 0;
        do {
          const u = Math.random() * 2 - 1;
          const v = Math.random() * 2 - 1;
          if (u * u + v * v <= 1) { nl = centerLeft + u * rangeLeft; nt = centerTop + v * rangeTop; break; }
          tries += 1;
        } while (tries < 20);
        if (nl === undefined) { nl = centerLeft; nt = centerTop; }
        moveTo(nl, nt, 2200);
        scheduleWander();
      }, delay);
    }

    function scheduleBird() {
      const delay = 9000 + Math.random() * 13000;
      addTimer(() => {
        if (cancelled) return;
        const id = `${Date.now()}-${Math.random()}`;
        const top = 8 + Math.random() * 20;
        const dir = Math.random() < 0.5 ? "ltr" : "rtl";
        const duration = 6 + Math.random() * 3;
        setBirds((prev) => [...prev, { id, top, dir, duration }]);
        addTimer(() => { setBirds((prev) => prev.filter((b) => b.id !== id)); }, duration * 1000 + 200);
        scheduleBird();
      }, delay);
    }

    function schedulePackage() {
      const delay = 28000 + Math.random() * 27000;
      addTimer(() => {
        if (cancelled) return;
        const gateLeft = 88, gateTop = 80;
        setPkg({ left: gateLeft, top: gateTop, stage: "waiting" });
        busyRef.current = true;
        addTimer(() => {
          if (cancelled) return;
          moveTo(gateLeft, gateTop - 2, 2600);
          addTimer(() => {
            if (cancelled) return;
            setPkg((p) => (p ? { ...p, stage: "collected" } : p));
            addTimer(() => { if (!cancelled) { setPkg(null); busyRef.current = false; } }, 900);
          }, 2700);
        }, 600);
        schedulePackage();
      }, delay);
    }

    scheduleWander();
    scheduleBird();
    schedulePackage();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [centerLeft, centerTop, rangeLeft, rangeTop]);

  return { leftPct, topPct, facingLeft, isWalking, birds, pkg };
}

function BirdShape() {
  return (
    <svg viewBox="0 0 24 14" width="26" height="15">
      <path d="M1,8 Q6,1 12,7 Q18,1 23,8" stroke="#6B7F8F" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 30 30" width="100%" height="100%">
      <rect x="3" y="10" width="24" height="17" rx="2" fill="#C98A56" />
      <rect x="3" y="10" width="24" height="5" fill="#B87740" />
      <rect x="12" y="10" width="6" height="17" fill="#8B5E3C" opacity="0.65" />
      <path d="M8,10 L14,4 L20,10" stroke="#8B5E3C" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// キャラクターを部屋・庭の中に配置する。
// left/top はパーセント指定でアニメーション（CSSトランジション）、transformは常に固定値（アンカー・反転のみ）。
function PositionedCharacter({ equipped, size, leftPct, topPct, facingLeft, isWalking }) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: "translate(-50%, -100%)",
        transition: "left 2.2s ease-in-out, top 2.2s ease-in-out",
        zIndex: 5
      }}
    >
      <div style={{ transform: facingLeft ? "scaleX(-1)" : "none" }}>
        <SheepCharacter equipped={equipped} size={size} isWalking={isWalking} />
      </div>
    </div>
  );
}

// ===== 家具・置物のミニアイコン（固定サイズのSVG、位置は呼び出し側のdivで指定） =====
function BedIcon() {
  return (
    <svg viewBox="0 0 60 40" width="100%" height="100%">
      <rect x="0" y="6" width="6" height="30" rx="3" fill="#B98A5E" />
      <rect x="2" y="12" width="56" height="24" rx="7" fill="#D9C9AE" />
      <rect x="2" y="12" width="56" height="9" rx="4" fill="#F0E6D2" />
      <rect x="7" y="15" width="15" height="6" rx="3" fill="#FFFDF8" />
      <circle cx="14.5" cy="18" r="1.3" fill="#E8B7C4" opacity="0.7" />
      <path d="M4,28 Q30,24 56,28" stroke="#C9B896" strokeWidth="1.5" fill="none" opacity="0.5" />
    </svg>
  );
}
function ShelfIcon() {
  return (
    <svg viewBox="0 0 40 45" width="100%" height="100%">
      <rect x="2" y="4" width="36" height="41" rx="2" fill="#B98A5E" />
      <rect x="2" y="17" width="36" height="3" fill="#8B6529" />
      <rect x="2" y="31" width="36" height="3" fill="#8B6529" />
      <rect x="6" y="6" width="5" height="10" fill="#C0454B" />
      <rect x="12" y="6" width="5" height="10" fill="#5B7FA6" />
      <rect x="18" y="6" width="5" height="10" fill="#E8B84B" />
      <rect x="24" y="6" width="5" height="10" fill="#7FB577" />
      <circle cx="20" cy="24" r="4" fill="#F6D98A" />
      <rect x="7" y="34" width="26" height="8" rx="2" fill="#8FA9C9" />
    </svg>
  );
}
function PlantIcon() {
  return (
    <svg viewBox="0 0 40 50" width="100%" height="100%">
      <path d="M10,48 L30,48 L27,32 L13,32 Z" fill="#C98A56" />
      <rect x="11" y="32" width="18" height="3" fill="#B87740" />
      <ellipse cx="20" cy="24" rx="17" ry="19" fill="#6FA566" />
      <ellipse cx="11" cy="14" rx="10" ry="12" fill="#7FB577" />
      <ellipse cx="29" cy="16" rx="10" ry="12" fill="#5E9450" />
      <ellipse cx="20" cy="8" rx="9" ry="10" fill="#7FB577" />
      <circle cx="15" cy="20" r="2" fill="#8FC580" opacity="0.7" />
      <circle cx="26" cy="24" r="2.5" fill="#8FC580" opacity="0.7" />
    </svg>
  );
}
function RugIcon() {
  return (
    <svg viewBox="0 0 100 40" width="100%" height="100%">
      <ellipse cx="50" cy="20" rx="48" ry="18" fill="#C98A9E" opacity="0.8" />
      <ellipse cx="50" cy="20" rx="36" ry="12" fill="none" stroke="#F6EFDF" strokeWidth="2" opacity="0.5" />
      <ellipse cx="50" cy="20" rx="22" ry="7" fill="none" stroke="#F6EFDF" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}
function BenchIcon() {
  return (
    <svg viewBox="0 0 60 40" width="100%" height="100%">
      <rect x="4" y="14" width="52" height="6" fill="#8B5E3C" rx="2" />
      <rect x="4" y="2" width="52" height="6" fill="#8B5E3C" rx="2" />
      <line x1="8" y1="4" x2="52" y2="4" stroke="#6B4526" strokeWidth="0.8" opacity="0.5" />
      <line x1="8" y1="16" x2="52" y2="16" stroke="#6B4526" strokeWidth="0.8" opacity="0.5" />
      <rect x="7" y="2" width="5" height="30" fill="#6B4526" rx="1" />
      <rect x="48" y="2" width="5" height="30" fill="#6B4526" rx="1" />
      <circle cx="9.5" cy="8" r="1" fill="#4E3018" opacity="0.6" />
      <circle cx="50.5" cy="8" r="1" fill="#4E3018" opacity="0.6" />
    </svg>
  );
}
function FountainIcon() {
  return (
    <svg viewBox="0 0 50 50" width="100%" height="100%">
      <ellipse cx="25" cy="44" rx="23" ry="6" fill="#B8C4CC" />
      <ellipse cx="25" cy="40" rx="18" ry="5" fill="#CFE0E8" />
      <rect x="22" y="16" width="6" height="24" fill="#9FB0BA" />
      <ellipse cx="25" cy="16" rx="10" ry="4" fill="#B8C4CC" />
      <circle cx="25" cy="10" r="7" fill="#CFE0E8" />
      <circle cx="22" cy="7" r="1.5" fill="#FFFDF8" opacity="0.8" />
      <circle cx="27" cy="9" r="1" fill="#FFFDF8" opacity="0.7" />
    </svg>
  );
}
function LanternIcon() {
  return (
    <svg viewBox="0 0 30 45" width="100%" height="100%">
      <circle cx="15" cy="24" r="12" fill="#F6D98A" opacity="0.25" />
      <rect x="6" y="4" width="18" height="6" fill="#8B6529" rx="1.5" />
      <path d="M12,4 L18,4 L18,0 L12,0 Z" fill="#8B6529" />
      <rect x="8" y="10" width="14" height="26" fill="#B8863B" rx="3" />
      <rect x="10" y="14" width="10" height="18" rx="2" fill="#8B6529" opacity="0.3" />
      <circle cx="15" cy="24" r="5" fill="#F6D98A" />
      <circle cx="15" cy="24" r="2.5" fill="#FFFBEA" />
    </svg>
  );
}
function FlowerBedIcon() {
  return (
    <svg viewBox="0 0 60 30" width="100%" height="100%">
      <ellipse cx="30" cy="18" rx="28" ry="11" fill="#7A9C70" />
      <ellipse cx="30" cy="16" rx="26" ry="9" fill="#8FAE84" opacity="0.6" />
      {[8, 20, 32, 44, 52].map((dx, i) => (
        <g key={i}>
          <circle cx={dx} cy={11 + (i % 2) * 4} r="5" fill={["#D98A9E", "#E8B84B", "#8FA9C9", "#F6C6D0", "#C79ED9"][i]} />
          <circle cx={dx} cy={11 + (i % 2) * 4} r="1.6" fill="#FFFBEA" />
        </g>
      ))}
    </svg>
  );
}

const FURNITURE_ICON = { furniture_bed: BedIcon, furniture_shelf: ShelfIcon, furniture_plant: PlantIcon, furniture_rug: RugIcon };
const GARDEN_ICON = { garden_bench: BenchIcon, garden_fountain: FountainIcon, garden_lantern: LanternIcon, garden_flowerbed: FlowerBedIcon };

// ===== ショップ内のアイテムプレビュー（種類ごとに見た目を切り替える） =====
function ShopItemPreview({ item }) {
  const boxStyle = { width: 46, height: 46, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `1px solid ${C.line}`, overflow: "hidden" };
  if (item.category === "hat") {
    return (
      <div style={boxStyle}>
        <div style={{ transform: "translateY(30%)" }}>
          <SheepCharacter equipped={{ hat: item.key }} size={46} />
        </div>
      </div>
    );
  }
  if (item.category === "outfit") {
    return (
      <div style={boxStyle}>
        <div style={{ transform: "translateY(8%)" }}>
          <SheepCharacter equipped={{ outfit: item.key }} size={40} />
        </div>
      </div>
    );
  }
  if (["floor", "wall", "window", "scenery"].includes(item.category)) {
    return (
      <div style={boxStyle}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: MATERIAL_COLORS[item.key] || C.line }} />
      </div>
    );
  }
  const Icon = FURNITURE_ICON[item.key] || GARDEN_ICON[item.key];
  if (Icon) {
    return (
      <div style={boxStyle}>
        <div style={{ width: 34, height: 34 }}><Icon /></div>
      </div>
    );
  }
  return <div style={boxStyle} />;
}

const FURNITURE_LAYOUT = {
  furniture_bed: { left: 16, top: 66, width: 26, z: 2 },
  furniture_shelf: { left: 82, top: 52, width: 15, z: 2 },
  furniture_plant: { left: 90, top: 74, width: 11, z: 2 },
  furniture_rug: { left: 50, top: 86, width: 34, z: 1 }
};
const GARDEN_LAYOUT = {
  garden_bench: { left: 14, top: 76, width: 20, z: 2 },
  garden_fountain: { left: 84, top: 68, width: 16, z: 2 },
  garden_lantern: { left: 24, top: 46, width: 10, z: 1 },
  garden_flowerbed: { left: 72, top: 84, width: 20, z: 1 }
};

// ===== 部屋のシーン（正面から見たシンプルな部屋。中央寄せはCSSのleft/topで固定） =====
function RoomScene({ equipped, owned }) {
  const floorColor = MATERIAL_COLORS[equipped.floor || "floor_default"] || MATERIAL_COLORS.floor_default;
  const wallColor = MATERIAL_COLORS[equipped.wall || "wall_default"] || MATERIAL_COLORS.wall_default;
  const windowFrameColor = MATERIAL_COLORS[equipped.window || "window_default"] || MATERIAL_COLORS.window_default;
  const sceneryColor = MATERIAL_COLORS[equipped.scenery || "scenery_default"] || MATERIAL_COLORS.scenery_default;
  const placedFurniture = (owned || []).filter((k) => FURNITURE_ICON[k]);

  const [leftPct, topPct, facingLeft, isWalking] = useWanderPercent(50, 78, 18, 6);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 480, margin: "0 auto", aspectRatio: "4 / 3", borderRadius: 18, overflow: "hidden", background: wallColor }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "34%", background: floorColor, zIndex: 0 }} />

      <div style={{ position: "absolute", left: "6%", top: "8%", width: "32%", height: "34%", background: windowFrameColor, borderRadius: 8, padding: "2.5%", boxSizing: "border-box", zIndex: 1 }}>
        <div style={{ position: "relative", width: "100%", height: "100%", background: sceneryColor, borderRadius: 4 }}>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: windowFrameColor, opacity: 0.8, transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: windowFrameColor, opacity: 0.8, transform: "translateY(-50%)" }} />
        </div>
      </div>

      {placedFurniture.includes("furniture_rug") && (
        <div style={{ position: "absolute", left: `${FURNITURE_LAYOUT.furniture_rug.left}%`, top: `${FURNITURE_LAYOUT.furniture_rug.top}%`, width: `${FURNITURE_LAYOUT.furniture_rug.width}%`, transform: "translate(-50%, -50%)", zIndex: FURNITURE_LAYOUT.furniture_rug.z }}>
          <RugIcon />
        </div>
      )}

      <PositionedCharacter equipped={equipped} size={92} leftPct={leftPct} topPct={topPct} facingLeft={facingLeft} isWalking={isWalking} />

      {placedFurniture.filter((k) => k !== "furniture_rug").map((k) => {
        const Icon = FURNITURE_ICON[k];
        const layout = FURNITURE_LAYOUT[k];
        return (
          <div key={k} style={{ position: "absolute", left: `${layout.left}%`, top: `${layout.top}%`, width: `${layout.width}%`, transform: "translate(-50%, -100%)", zIndex: layout.z }}>
            <Icon />
          </div>
        );
      })}
    </div>
  );
}

// ===== 庭のシーン =====
function GardenScene({ equipped, owned }) {
  const placedOrnaments = (owned || []).filter((k) => GARDEN_ICON[k]);
  const { leftPct, topPct, facingLeft, isWalking, birds, pkg } = useGardenLife(50, 80, 22, 6);

  return (
    <div style={{
      position: "relative", width: "100%", maxWidth: 480, margin: "0 auto", aspectRatio: "4 / 3",
      borderRadius: 18, overflow: "hidden",
      background: "linear-gradient(to bottom, #FFFBF2 0%, #F6E9D8 60%, #F6E9D8 100%)"
    }}>
      <style>{`
        @keyframes birdFlyLTR { from { left: -10%; } to { left: 110%; } }
        @keyframes birdFlyRTL { from { left: 110%; } to { left: -10%; } }
      `}</style>

      <div style={{ position: "absolute", right: "8%", top: "10%", width: "12%", aspectRatio: "1/1", borderRadius: "50%", background: "#F3D48A", opacity: 0.55 }} />

      {/* 鳥（ランダムに飛んでくる） */}
      {birds.map((b) => (
        <div key={b.id} style={{
          position: "absolute", top: `${b.top}%`,
          animation: `${b.dir === "ltr" ? "birdFlyLTR" : "birdFlyRTL"} ${b.duration}s linear forwards`,
          zIndex: 3
        }}>
          <div style={{ transform: b.dir === "rtl" ? "scaleX(-1)" : "none" }}>
            <BirdShape />
          </div>
        </div>
      ))}

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "30%", background: "#7A9C70" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "26%", height: "6%", background: "#8FAE84" }} />

      {/* 柵（常設・購入不要） */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "25%", height: "9%", zIndex: 1 }}>
        <svg viewBox="0 0 400 36" width="100%" height="100%" preserveAspectRatio="none">
          {Array.from({ length: 18 }).map((_, i) => (
            <rect key={i} x={i * 22 + 4} y="4" width="9" height="30" rx="2" fill="#E8DCC4" stroke="#C4B592" strokeWidth="1" />
          ))}
          <rect x="0" y="10" width="400" height="4" fill="#D4C6A4" />
          <rect x="0" y="22" width="400" height="4" fill="#D4C6A4" />
        </svg>
      </div>

      {/* 宅配便（ときどき門のあたりに届き、羊が取りに行く） */}
      {pkg && pkg.stage === "waiting" && (
        <div style={{ position: "absolute", left: "88%", top: "80%", width: "9%", transform: "translate(-50%, -100%)", zIndex: 4 }}>
          <PackageIcon />
        </div>
      )}

      {placedOrnaments.map((k) => {
        const Icon = GARDEN_ICON[k];
        const layout = GARDEN_LAYOUT[k];
        return (
          <div key={k} style={{ position: "absolute", left: `${layout.left}%`, top: `${layout.top}%`, width: `${layout.width}%`, transform: "translate(-50%, -100%)", zIndex: layout.z }}>
            <Icon />
          </div>
        );
      })}

      <PositionedCharacter equipped={equipped} size={100} leftPct={leftPct} topPct={topPct} facingLeft={facingLeft} isWalking={isWalking} />
    </div>
  );
}

export default function CharacterHome({ entries, ownedKeys, equipped, pointsSpent, onPurchase, onEquip, t }) {
  const [view, setView] = useState("room");
  const [shopCategory, setShopCategory] = useState("hat");

  const totalEarned = useMemo(() => computeTotalEarned(entries), [entries]);
  const { currentStreak, longestStreak } = useMemo(() => computeStreaks(entries), [entries]);
  const balance = computeBalance(entries, pointsSpent);

  const itemsInCategory = SHOP_ITEMS.filter((i) => i.category === shopCategory);
  const isMultiSlot = MULTI_SLOT_CATEGORIES.includes(shopCategory);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
        <p className="text-xs leading-relaxed rounded-xl p-2.5 mb-3" style={{ color: C.inkSoft, background: C.paper }}>
          {t("characterIntro")}
        </p>

        <div className="flex rounded-full border p-1 mb-3 mx-auto" style={{ borderColor: C.line, width: "fit-content" }}>
          <button type="button" onClick={() => setView("room")}
            className="px-4 py-1.5 rounded-full text-xs font-medium"
            style={{ background: view === "room" ? C.curtain : "transparent", color: view === "room" ? "#FFFDF8" : C.inkSoft }}>
            {t("viewRoom")}
          </button>
          <button type="button" onClick={() => setView("garden")}
            className="px-4 py-1.5 rounded-full text-xs font-medium"
            style={{ background: view === "garden" ? C.curtain : "transparent", color: view === "garden" ? "#FFFDF8" : C.inkSoft }}>
            {t("viewGarden")}
          </button>
        </div>

        {view === "room"
          ? <RoomScene equipped={equipped} owned={ownedKeys} />
          : <GardenScene equipped={equipped} owned={ownedKeys} />}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-3 border text-center" style={{ background: C.card, borderColor: C.line }}>
          <div className="ff-display italic text-xl" style={{ color: C.gold }}>{balance}</div>
          <div className="text-xs mt-1" style={{ color: C.inkSoft }}>{t("labelPointsBalance")}</div>
        </div>
        <div className="rounded-2xl p-3 border text-center" style={{ background: C.card, borderColor: C.line }}>
          <div className="ff-display italic text-xl" style={{ color: C.curtain }}>{currentStreak}</div>
          <div className="text-xs mt-1" style={{ color: C.inkSoft }}>{t("labelCurrentStreak")}</div>
        </div>
        <div className="rounded-2xl p-3 border text-center" style={{ background: C.card, borderColor: C.line }}>
          <div className="ff-display italic text-xl" style={{ color: C.curtain }}>{longestStreak}</div>
          <div className="text-xs mt-1" style={{ color: C.inkSoft }}>{t("labelLongestStreak")}</div>
        </div>
      </div>

      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
        <h3 className="ff-display italic text-lg mb-3">{t("labelShop")}</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.keys(CATEGORY_LABEL_KEYS).map((cat) => (
            <button key={cat} type="button" onClick={() => setShopCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border"
              style={{
                background: shopCategory === cat ? C.curtain : C.paper,
                color: shopCategory === cat ? "#FFFDF8" : C.inkSoft,
                borderColor: shopCategory === cat ? C.curtain : C.line
              }}>
              {t(CATEGORY_LABEL_KEYS[cat])}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {itemsInCategory.map((item) => {
            const owned = ownedKeys.includes(item.key);
            const isEquipped = isMultiSlot ? owned : equipped[item.category] === item.key;
            const canAfford = balance >= item.cost;
            return (
              <div key={item.key} className="flex items-center justify-between rounded-xl p-2.5" style={{ background: C.paper }}>
                <div className="flex items-center gap-3">
                  <ShopItemPreview item={item} />
                  <div>
                    <div className="text-sm font-medium">{t(item.nameKey)}</div>
                    {!owned && <div className="text-xs ff-mono" style={{ color: C.inkSoft }}>{item.cost}pt</div>}
                  </div>
                </div>
                {owned ? (
                  isMultiSlot ? (
                    <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: C.sage, color: "#FFFDF8" }}>{t("labelPlaced")}</span>
                  ) : (
                    <button type="button" onClick={() => onEquip(item.category, isEquipped ? null : item.key)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ background: isEquipped ? C.curtain : C.card, color: isEquipped ? "#FFFDF8" : C.inkSoft, border: `1px solid ${C.line}` }}>
                      {isEquipped ? t("labelEquipped") : t("btnEquip")}
                    </button>
                  )
                ) : (
                  <button type="button" disabled={!canAfford} onClick={() => onPurchase(item)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ background: canAfford ? C.gold : C.line, color: canAfford ? "#3D2E12" : C.inkSoft }}>
                    {t("btnBuy")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!isMultiSlot && (
          <p className="text-xs mt-3" style={{ color: C.inkSoft }}>{t("noteSingleSlot")}</p>
        )}
      </div>
    </div>
  );
}
