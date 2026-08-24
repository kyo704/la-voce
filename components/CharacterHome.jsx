"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { C } from "@/lib/tokens";
import {
  SHOP_ITEMS, SINGLE_SLOT_CATEGORIES, MULTI_SLOT_CATEGORIES,
  computeTotalEarned, computeStreaks, computeBalance
} from "@/lib/character";

const CATEGORY_LABEL_KEYS = {
  hat: "catHat", outfit: "catOutfit", accessory: "catAccessory", floor: "catFloor", wall: "catWall",
  window: "catWindow", scenery: "catScenery", furniture: "catFurniture", garden: "catGarden"
};
const MATERIAL_COLORS = {
  floor_default: "#D8C9A8", floor_tile: "#C9C2B4", floor_carpet: "#C98A9E",
  floor_tatami: "#C9B87C", floor_terracotta: "#C97C4E", floor_indian: "#D9A054", floor_american: "#B98A5E", floor_chinese: "#B8453F",
  wall_default: "#F3E9D8", wall_stripe: "#E9D9C0", wall_wood: "#B98A5E",
  wall_washi: "#EDE6D3", wall_mediterranean: "#F2ECDD", wall_indian: "#E8985F", wall_american: "#C9836A", wall_chinese: "#C0454B",
  window_default: "#FFFDF8", window_wood: "#8B5E3C", window_blue: "#5C7599",
  window_shoji: "#EDE6D3", window_mediterranean: "#8FA9C9", window_indian: "#D9A054", window_american: "#FFFDF8", window_chinese: "#C0454B",
  window_stained_glass: "#8B6529", window_porthole: "#9FB0BA",
  scenery_default: "#BFE0E8", scenery_night: "#2E3A5C", scenery_sakura: "#F2C9D3", scenery_aurora: "#2E3A5C", scenery_ocean: "#5C9AC9"
};

// ===== 羊のキャラクター（チビ体型・二頭身） =====
function SheepCharacter({ equipped, size = 120, isWalking = false, isFarming = false, showBook = false }) {
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
        @keyframes digBob { 0%, 100% { transform: rotate(-32deg); } 50% { transform: rotate(12deg); } }
        .leg-l { transform-box: fill-box; transform-origin: top center; ${isWalking ? "animation: legSwingL 0.62s ease-in-out infinite;" : ""} }
        .leg-r { transform-box: fill-box; transform-origin: top center; ${isWalking ? "animation: legSwingR 0.62s ease-in-out infinite;" : ""} }
        .arm-l { transform-box: fill-box; transform-origin: top center; ${isFarming ? "animation: digBob 0.5s ease-in-out infinite;" : isWalking ? "animation: armSwingL 0.62s ease-in-out infinite;" : "animation: idleBob 2.4s ease-in-out infinite;"} }
        .arm-r { transform-box: fill-box; transform-origin: top center; ${isFarming ? "animation: digBob 0.5s ease-in-out infinite reverse;" : isWalking ? "animation: armSwingR 0.62s ease-in-out infinite;" : "animation: idleBob 2.4s ease-in-out infinite;"} }
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
      {equipped.accessory === "accessory_staff" && (
        <g className="arm-r">
          <rect x="128" y="88" width="5" height="56" rx="2.5" fill="#8B6529" transform="rotate(10 130 116)" />
          <circle cx="134" cy="84" r="8" fill="#9FC9E8" opacity="0.85" />
          <circle cx="134" cy="84" r="4" fill="#F6FBFF" />
          <circle cx="132" cy="82" r="1.5" fill="#FFFFFF" opacity="0.9" />
        </g>
      )}
      {equipped.accessory === "accessory_sword" && (
        <g className="arm-r">
          <rect x="126" y="94" width="4.5" height="48" rx="1.5" fill="#D8DEE4" stroke="#A8B2BA" strokeWidth="0.6" transform="rotate(-16 128 118)" />
          <rect x="122" y="128" width="12" height="8" rx="2" fill="#3D2E12" transform="rotate(-16 128 132)" />
          <rect x="122" y="136" width="12" height="16" rx="3" fill="#7A1F2B" transform="rotate(-16 128 144)" />
          <circle cx="128" cy="132" r="1.3" fill="#D9AE6E" transform="rotate(-16 128 132)" />
        </g>
      )}

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
      {equipped.outfit === "outfit_western" && (
        <g>
          <path d="M54,108 L106,108 L100,170 Q80,178 60,170 Z" fill="#8B5E3C" opacity="0.92" />
          <path d="M60,112 Q80,108 100,112 L96,166 Q80,173 64,166 Z" fill="#F6EFDF" opacity="0.12" />
          <path d="M56,104 Q80,116 104,104 L100,114 Q80,124 60,114 Z" fill="#C0454B" />
          <circle cx="70" cy="130" r="2" fill="#F6D98A" />
          <circle cx="90" cy="130" r="2" fill="#F6D98A" />
          <path d="M56,109 L53,150 M104,109 L107,150" stroke="#6B4526" strokeWidth="2" opacity="0.5" fill="none" />
        </g>
      )}
      {equipped.outfit === "outfit_kimono" && (
        <g>
          <path d="M50,106 Q52,100 62,104 L60,170 Q80,180 100,170 L98,104 Q108,100 110,106 L108,172 Q80,184 52,172 Z" fill="#5B7FA6" opacity="0.94" />
          <path d="M62,104 L80,120 L98,104 L94,110 L80,124 L66,110 Z" fill="#FBF6EA" opacity="0.9" />
          {[112, 128, 144, 160].map((y, i) => (
            <circle key={i} cx={i % 2 === 0 ? 68 : 92} cy={y} r="2.6" fill="#F2C9D3" opacity="0.85" />
          ))}
          <rect x="70" y="118" width="20" height="46" fill="#C0454B" opacity="0.92" />
          <path d="M70,130 L90,130 M70,140 L90,140" stroke="#96323A" strokeWidth="1.2" opacity="0.6" />
          <path d="M72,118 Q80,112 88,118 L86,124 Q80,120 74,124 Z" fill="#96323A" />
        </g>
      )}
      {equipped.outfit === "outfit_tuxedo" && (
        <g>
          <path d="M52,106 L108,106 L102,172 Q80,180 58,172 Z" fill="#1A1A1E" opacity="0.95" />
          <path d="M62,108 Q80,102 98,108 L92,168 Q80,174 68,168 Z" fill="#FBF6EA" />
          <path d="M62,108 L78,124 L69,132 L58,112 Z" fill="#1A1A1E" />
          <path d="M98,108 L82,124 L91,132 L102,112 Z" fill="#1A1A1E" />
          <path d="M74,110 L80,120 L86,110 L83,116 L80,122 L77,116 Z" fill="#7A1F2B" />
          {[126, 138, 150].map((y, i) => <circle key={i} cx="80" cy={y} r="1.6" fill="#2E2E33" />)}
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
      {equipped.hat === "hat_western" && (
        <g>
          <ellipse cx="80" cy="41" rx="44" ry="8" fill="#A9784F" />
          <ellipse cx="80" cy="40" rx="43" ry="6.5" fill="#BC8A5D" opacity="0.5" />
          <path d="M52,40 Q54,14 80,12 Q106,14 108,40 Q94,31 80,33 Q66,31 52,40 Z" fill="#BC8A5D" />
          <path d="M56,36 Q80,29 104,36" stroke="#7A5537" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
      {equipped.hat === "hat_crown_king" && (
        <g>
          <path d="M50,40 L54,16 L64,32 L74,12 L80,20 L86,12 L96,32 L106,16 L110,40 Z" fill="#F0C955" stroke="#C99A2E" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="50" y="38" width="60" height="7" rx="1.5" fill="#F0C955" stroke="#C99A2E" strokeWidth="1" />
          <circle cx="64" cy="30" r="3" fill="#C0454B" stroke="#8A2E33" strokeWidth="0.6" />
          <circle cx="80" cy="22" r="3.5" fill="#5B7FA6" stroke="#3E5A78" strokeWidth="0.6" />
          <circle cx="96" cy="30" r="3" fill="#5E9450" stroke="#3E6636" strokeWidth="0.6" />
          <circle cx="58" cy="41" r="1.4" fill="#FFFBEA" opacity="0.9" />
          <circle cx="102" cy="41" r="1.4" fill="#FFFBEA" opacity="0.9" />
        </g>
      )}
      {equipped.hat === "hat_tiara_princess" && (
        <g>
          <path d="M54,40 Q58,20 68,26 Q74,14 80,24 Q86,14 92,26 Q102,20 106,40 Z" fill="#F6E9C9" stroke="#D9B968" strokeWidth="1.3" strokeLinejoin="round" />
          <circle cx="80" cy="24" r="4.2" fill="#E896C4" stroke="#C0619A" strokeWidth="1" />
          <circle cx="66" cy="31" r="2.2" fill="#9FC9E8" stroke="#6C9BC4" strokeWidth="0.6" />
          <circle cx="94" cy="31" r="2.2" fill="#9FC9E8" stroke="#6C9BC4" strokeWidth="0.6" />
          <circle cx="80" cy="24" r="1.6" fill="#FFFBEA" opacity="0.9" />
        </g>
      )}

      {showBook && (
        <g>
          <path d="M58,118 L80,124 L102,118 L102,138 L80,144 L58,138 Z" fill="#FBF6EA" stroke="#C9B896" strokeWidth="1" />
          <path d="M80,124 L80,144" stroke="#C9B896" strokeWidth="1" />
          <path d="M62,122 L76,127 M62,128 L76,133 M84,127 L98,122 M84,133 L98,128" stroke="#D9C7A8" strokeWidth="0.8" opacity="0.6" fill="none" />
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

// ===== 部屋専用：椅子に座って本を読んだり、ベッドで眠ったりする「生活感」フック =====
function useRoomLife(centerLeft, centerTop, rangeLeft, rangeTop, hasChair, hasBed) {
  const [leftPct, setLeftPct] = useState(centerLeft);
  const [topPct, setTopPct] = useState(centerTop);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const [isLying, setIsLying] = useState(false);
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

    function scheduleSitting() {
      const delay = 20000 + Math.random() * 20000;
      addTimer(() => {
        if (cancelled) return;
        if (!hasChair) { scheduleSitting(); return; }
        const chairLeft = 66, chairTop = 66;
        busyRef.current = true;
        moveTo(chairLeft, chairTop, 2000);
        addTimer(() => {
          if (cancelled) return;
          setIsSitting(true);
          addTimer(() => {
            if (cancelled) return;
            setIsSitting(false);
            busyRef.current = false;
          }, 5500);
        }, 2100);
        scheduleSitting();
      }, delay);
    }

    function scheduleLying() {
      const delay = 26000 + Math.random() * 24000;
      addTimer(() => {
        if (cancelled) return;
        if (!hasBed) { scheduleLying(); return; }
        const bedLeft = 17, bedTop = 66;
        busyRef.current = true;
        moveTo(bedLeft, bedTop, 2000);
        addTimer(() => {
          if (cancelled) return;
          setLeftPct(17);
          setTopPct(57);
          setIsLying(true);
          addTimer(() => {
            if (cancelled) return;
            setIsLying(false);
            busyRef.current = false;
          }, 6000);
        }, 2100);
        scheduleLying();
      }, delay);
    }

    scheduleWander();
    scheduleSitting();
    scheduleLying();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [centerLeft, centerTop, rangeLeft, rangeTop, hasChair, hasBed]);

  return [leftPct, topPct, facingLeft, isWalking, isSitting, isLying];
}

// ===== 庭専用：鳥が飛んだり、宅配便が届いて羊が取りに行ったりする「生活感」フック =====
function useGardenLife(centerLeft, centerTop, rangeLeft, rangeTop, hasField) {
  const [leftPct, setLeftPct] = useState(centerLeft);
  const [topPct, setTopPct] = useState(centerTop);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [isFarming, setIsFarming] = useState(false);
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

    function scheduleFarming() {
      const delay = 22000 + Math.random() * 22000;
      addTimer(() => {
        if (cancelled) return;
        if (!hasField) { scheduleFarming(); return; }
        const fieldLeft = 30, fieldTop = 88;
        busyRef.current = true;
        moveTo(fieldLeft, fieldTop - 1, 2200);
        addTimer(() => {
          if (cancelled) return;
          setIsFarming(true);
          addTimer(() => {
            if (cancelled) return;
            setIsFarming(false);
            busyRef.current = false;
          }, 3400);
        }, 2300);
        scheduleFarming();
      }, delay);
    }

    scheduleWander();
    scheduleBird();
    schedulePackage();
    scheduleFarming();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [centerLeft, centerTop, rangeLeft, rangeTop, hasField]);

  return { leftPct, topPct, facingLeft, isWalking, isFarming, birds, pkg };
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
function SheepSleepingIllustration({ size }) {
  return (
    <svg viewBox="0 0 140 80" style={{ width: size * 1.3, height: size * 0.75, display: "block" }}>
      {/* 掛け布団 */}
      <ellipse cx="70" cy="55" rx="65" ry="22" fill="#C0838F" />
      <path d="M8,50 Q70,38 132,50 L132,58 Q70,46 8,58 Z" fill="#A5606E" opacity="0.4" />
      {/* 布団から頭だけ出ている（もこもこ頭・簡略版） */}
      <g transform="translate(30,10)">
        <circle cx="30" cy="30" r="26" fill="#F6EFDF" />
        {[[10, 22, 9], [50, 22, 9], [8, 38, 7], [52, 38, 7], [20, 12, 7], [40, 12, 7], [30, 8, 8]].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#F6EFDF" />
        ))}
        <ellipse cx="30" cy="34" rx="16" ry="14" fill="#FBF6EA" />
        {/* 閉じた目 */}
        <path d="M20,34 Q24,37 28,34" stroke="#3D3226" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M32,34 Q36,37 40,34" stroke="#3D3226" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="30" cy="42" rx="3" ry="2" fill="#C98A6E" />
        <circle cx="12" cy="40" r="4" fill="#F0B7A4" opacity="0.55" />
        <circle cx="48" cy="40" r="4" fill="#F0B7A4" opacity="0.55" />
        {/* 小さいツノ */}
        <path d="M14,14 Q10,6 15,2 Q18,8 16,15 Z" fill="#D9AE6E" stroke="#A87D45" strokeWidth="0.8" />
        <path d="M46,14 Q50,6 45,2 Q42,8 44,15 Z" fill="#D9AE6E" stroke="#A87D45" strokeWidth="0.8" />
      </g>
      {/* Zzz（すやすや） */}
      <text x="92" y="20" fontSize="15" fill="#B8863B" opacity="0.75" fontFamily="Georgia, serif" fontStyle="italic">z</text>
      <text x="102" y="11" fontSize="10" fill="#B8863B" opacity="0.6" fontFamily="Georgia, serif" fontStyle="italic">z</text>
    </svg>
  );
}

function PositionedCharacter({ equipped, size, leftPct, topPct, facingLeft, isWalking, isFarming, isSitting, isLying }) {
  if (isLying) {
    return (
      <div
        style={{
          position: "absolute",
          left: `${leftPct}%`,
          top: `${topPct}%`,
          transform: "translate(-50%, -50%)",
          transition: "left 2.2s ease-in-out, top 2.2s ease-in-out",
          zIndex: 5
        }}
      >
        <SheepSleepingIllustration size={size} />
      </div>
    );
  }
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
        <SheepCharacter equipped={equipped} size={size} isWalking={isWalking} isFarming={isFarming} showBook={isSitting} />
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
function FieldIcon() {
  return (
    <svg viewBox="0 0 70 40" width="100%" height="100%">
      <rect x="2" y="6" width="66" height="30" rx="3" fill="#8B6529" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${6 + i * 13},8 Q${10 + i * 13},20 ${6 + i * 13},34`} stroke="#6B4E1E" strokeWidth="2" fill="none" opacity="0.6" />
      ))}
      {[10, 24, 38, 52].map((x, i) => (
        <g key={i}>
          <rect x={x} y="10" width="2" height="8" fill="#5E9450" />
          <circle cx={x + 1} cy="9" r="2.5" fill="#7FB577" />
        </g>
      ))}
    </svg>
  );
}
function ChairIcon() {
  return (
    <svg viewBox="0 0 45 50" width="100%" height="100%">
      <rect x="5" y="6" width="35" height="26" rx="6" fill="#8B5E3C" />
      <rect x="8" y="9" width="29" height="20" rx="4" fill="#C0454B" />
      <path d="M9,12 Q22,8 36,12" stroke="#96323A" strokeWidth="1.2" opacity="0.5" fill="none" />
      <rect x="2" y="26" width="41" height="14" rx="5" fill="#8B5E3C" />
      <rect x="5" y="29" width="35" height="9" rx="3" fill="#C0454B" />
      <rect x="4" y="38" width="5" height="10" fill="#6B4526" />
      <rect x="36" y="38" width="5" height="10" fill="#6B4526" />
    </svg>
  );
}
function PianoIcon() {
  return (
    <svg viewBox="0 0 70 45" width="100%" height="100%">
      <path d="M4,10 Q10,4 30,4 L60,4 Q66,4 66,12 L66,30 L20,30 Q4,30 4,18 Z" fill="#2E2118" />
      <path d="M8,12 Q14,8 30,8 L58,8 Q62,8 62,14 L62,26 L22,26 Q8,26 8,16 Z" fill="#4A362A" opacity="0.5" />
      <rect x="18" y="30" width="34" height="7" fill="#F6EFDF" />
      {Array.from({ length: 11 }).map((_, i) => (
        <rect key={i} x={18 + i * 3.1} y="30" width="2.5" height="7" fill="#1A1410" opacity={i % 2 === 0 ? 0 : 0.85} />
      ))}
      <rect x="10" y="37" width="4" height="8" fill="#2E2118" />
      <rect x="45" y="37" width="4" height="8" fill="#2E2118" />
    </svg>
  );
}
function GazeboIcon() {
  return (
    <svg viewBox="0 0 70 60" width="100%" height="100%">
      <path d="M35,4 L64,26 L58,26 L35,10 L12,26 L6,26 Z" fill="#8B5E3C" />
      <rect x="10" y="24" width="50" height="4" fill="#6B4526" />
      <rect x="12" y="28" width="4" height="26" fill="#B98A5E" />
      <rect x="54" y="28" width="4" height="26" fill="#B98A5E" />
      <rect x="33" y="28" width="4" height="26" fill="#B98A5E" opacity="0.7" />
      <rect x="8" y="52" width="54" height="4" fill="#8B6529" />
      <path d="M16,32 Q35,26 54,32" stroke="#D9C9AE" strokeWidth="1.5" opacity="0.6" fill="none" />
    </svg>
  );
}
function PondIcon() {
  return (
    <svg viewBox="0 0 70 40" width="100%" height="100%">
      <ellipse cx="35" cy="22" rx="32" ry="15" fill="#6C9BC4" />
      <ellipse cx="35" cy="20" rx="28" ry="12" fill="#84B0D4" opacity="0.7" />
      <ellipse cx="20" cy="16" rx="7" ry="4" fill="#5E9450" />
      <ellipse cx="48" cy="26" rx="6" ry="3.5" fill="#5E9450" />
      <path d="M30,22 Q34,18 38,22 Q34,20 30,22 Z" fill="#E8985F" />
      <path d="M40,16 Q44,13 47,17 Q43,15 40,16 Z" fill="#F0DFA8" />
      <circle cx="38" cy="22" r="1" fill="#1A0E0F" />
    </svg>
  );
}

const FURNITURE_ICON = { furniture_bed: BedIcon, furniture_shelf: ShelfIcon, furniture_plant: PlantIcon, furniture_rug: RugIcon, furniture_chair: ChairIcon, furniture_piano: PianoIcon };
const GARDEN_ICON = { garden_bench: BenchIcon, garden_fountain: FountainIcon, garden_lantern: LanternIcon, garden_flowerbed: FlowerBedIcon, garden_field: FieldIcon, garden_gazebo: GazeboIcon, garden_pond: PondIcon };

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
  if (item.category === "accessory") {
    return (
      <div style={boxStyle}>
        <div style={{ transform: "translateY(8%)" }}>
          <SheepCharacter equipped={{ accessory: item.key }} size={40} />
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
  furniture_rug: { left: 50, top: 86, width: 34, z: 1 },
  furniture_chair: { left: 66, top: 74, width: 15, z: 2 },
  furniture_piano: { left: 32, top: 66, width: 26, z: 2 }
};
const GARDEN_LAYOUT = {
  garden_bench: { left: 14, top: 76, width: 20, z: 2 },
  garden_fountain: { left: 84, top: 68, width: 16, z: 2 },
  garden_lantern: { left: 24, top: 46, width: 10, z: 1 },
  garden_flowerbed: { left: 72, top: 84, width: 20, z: 1 },
  garden_field: { left: 30, top: 90, width: 26, z: 1 },
  garden_gazebo: { left: 58, top: 40, width: 26, z: 1 },
  garden_pond: { left: 46, top: 93, width: 24, z: 1 }
};

// ===== 部屋のシーン（正面から見たシンプルな部屋。中央寄せはCSSのleft/topで固定） =====
function RoomScene({ equipped, owned }) {
  const floorColor = MATERIAL_COLORS[equipped.floor || "floor_default"] || MATERIAL_COLORS.floor_default;
  const wallColor = MATERIAL_COLORS[equipped.wall || "wall_default"] || MATERIAL_COLORS.wall_default;
  const windowFrameColor = MATERIAL_COLORS[equipped.window || "window_default"] || MATERIAL_COLORS.window_default;
  const sceneryColor = MATERIAL_COLORS[equipped.scenery || "scenery_default"] || MATERIAL_COLORS.scenery_default;
  const placedFurniture = (owned || []).filter((k) => FURNITURE_ICON[k]);

  const windowKey = equipped.window || "window_default";
  const windowShape =
    windowKey === "window_chinese" ? { borderRadius: "50%", muntin: "none" }
    : (windowKey === "window_mediterranean" || windowKey === "window_indian") ? { borderRadius: "50% 50% 6px 6px", muntin: "none" }
    : windowKey === "window_shoji" ? { borderRadius: 4, muntin: "grid" }
    : windowKey === "window_porthole" ? { borderRadius: "50%", muntin: "rivets" }
    : windowKey === "window_stained_glass" ? { borderRadius: 4, muntin: "stainedglass" }
    : { borderRadius: 4, muntin: "cross" };

  const sceneryKey = equipped.scenery || "scenery_default";

  const [leftPct, topPct, facingLeft, isWalking, isSitting, isLying] = useRoomLife(
    50, 78, 18, 6,
    (owned || []).includes("furniture_chair"),
    (owned || []).includes("furniture_bed")
  );

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 480, margin: "0 auto", aspectRatio: "4 / 3", borderRadius: 18, overflow: "hidden", background: wallColor }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "34%", background: floorColor, zIndex: 0 }} />

      <div style={{ position: "absolute", left: "6%", top: "8%", width: "32%", height: "34%", background: windowFrameColor, borderRadius: windowShape.borderRadius === 4 ? 8 : windowShape.borderRadius, padding: "2.5%", boxSizing: "border-box", zIndex: 1 }}>
        <div style={{ position: "relative", width: "100%", height: "100%", background: sceneryColor, borderRadius: windowShape.borderRadius, overflow: "hidden" }}>
          {sceneryKey === "scenery_aurora" && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <rect width="100" height="100" fill="#1A2340" />
              {[0, 1, 2].map((i) => (
                <circle key={i} cx={20 + i * 30} cy={15 + (i % 2) * 10} r="1.4" fill="#FFFDF0" opacity="0.8" />
              ))}
              <path d="M0,55 Q25,30 50,50 Q75,70 100,45 L100,100 L0,100 Z" fill="#6FD9A8" opacity="0.55" />
              <path d="M0,65 Q30,45 55,62 Q80,78 100,58 L100,100 L0,100 Z" fill="#9F7FD9" opacity="0.45" />
              <path d="M0,75 Q35,60 60,72 Q85,84 100,70 L100,100 L0,100 Z" fill="#5CA9D9" opacity="0.4" />
            </svg>
          )}
          {sceneryKey === "scenery_ocean" && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <rect width="100" height="55" fill="#BFE0E8" />
              <rect y="55" width="100" height="45" fill="#5C9AC9" />
              <circle cx="78" cy="18" r="9" fill="#F6D46A" opacity="0.9" />
              <path d="M0,60 Q15,55 30,60 Q45,65 60,60 Q75,55 100,60" stroke="#FFFDF8" strokeWidth="2" fill="none" opacity="0.5" />
              <path d="M0,72 Q15,67 30,72 Q45,77 60,72 Q75,67 100,72" stroke="#FFFDF8" strokeWidth="2" fill="none" opacity="0.4" />
              <path d="M20,50 L30,50 L27,44 Q34,44 34,50 L44,50 L38,56 L14,56 Z" fill="#F6EFDF" opacity="0.85" />
            </svg>
          )}
          {windowShape.muntin === "cross" && (
            <>
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: windowFrameColor, opacity: 0.8, transform: "translateX(-50%)" }} />
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: windowFrameColor, opacity: 0.8, transform: "translateY(-50%)" }} />
            </>
          )}
          {windowShape.muntin === "grid" && (
            <>
              {[33, 66].map((pct) => (
                <div key={`v${pct}`} style={{ position: "absolute", left: `${pct}%`, top: 0, bottom: 0, width: 1.5, background: windowFrameColor, opacity: 0.7 }} />
              ))}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1.5, background: windowFrameColor, opacity: 0.7, transform: "translateY(-50%)" }} />
            </>
          )}
          {windowShape.muntin === "rivets" && (
            <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <circle cx="50" cy="50" r="46" fill="none" stroke={windowFrameColor} strokeWidth="4" opacity="0.5" />
              {Array.from({ length: 10 }).map((_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return <circle key={i} cx={50 + Math.cos(a) * 44} cy={50 + Math.sin(a) * 44} r="2.6" fill={windowFrameColor} opacity="0.85" />;
              })}
            </svg>
          )}
          {windowShape.muntin === "stainedglass" && (
            <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <circle cx="50" cy="50" r="30" fill="#E8985F" opacity="0.55" />
              {Array.from({ length: 8 }).map((_, i) => {
                const a1 = (i / 8) * Math.PI * 2;
                const a2 = ((i + 1) / 8) * Math.PI * 2;
                const colors = ["#C0454B", "#5B7FA6", "#E8B84B", "#7FB577", "#C79ED9", "#F2C9D3", "#8FA9C9", "#D9AE6E"];
                return (
                  <path key={i} d={`M50,50 L${50 + Math.cos(a1) * 48},${50 + Math.sin(a1) * 48} L${50 + Math.cos(a2) * 48},${50 + Math.sin(a2) * 48} Z`}
                    fill={colors[i]} opacity="0.55" stroke="#3D2E12" strokeWidth="1" />
                );
              })}
              <circle cx="50" cy="50" r="9" fill="#FBF6EA" opacity="0.85" stroke="#3D2E12" strokeWidth="1" />
            </svg>
          )}
        </div>
      </div>

      {placedFurniture.includes("furniture_rug") && (
        <div style={{ position: "absolute", left: `${FURNITURE_LAYOUT.furniture_rug.left}%`, top: `${FURNITURE_LAYOUT.furniture_rug.top}%`, width: `${FURNITURE_LAYOUT.furniture_rug.width}%`, transform: "translate(-50%, -50%)", zIndex: FURNITURE_LAYOUT.furniture_rug.z }}>
          <RugIcon />
        </div>
      )}

      <PositionedCharacter equipped={equipped} size={92} leftPct={leftPct} topPct={topPct} facingLeft={facingLeft} isWalking={isWalking} isSitting={isSitting} isLying={isLying} />

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
  const hasField = (owned || []).includes("garden_field");
  const { leftPct, topPct, facingLeft, isWalking, isFarming, birds, pkg } = useGardenLife(50, 80, 22, 6, hasField);

  return (
    <div style={{
      position: "relative", width: "100%", maxWidth: 480, margin: "0 auto", aspectRatio: "4 / 3",
      borderRadius: 18, overflow: "hidden",
      background: "linear-gradient(to bottom, #7EB8E0 0%, #A8D4EC 35%, #D9EDDB 72%, #D9EDDB 100%)"
    }}>
      <style>{`
        @keyframes birdFlyLTR { from { left: -10%; } to { left: 110%; } }
        @keyframes birdFlyRTL { from { left: 110%; } to { left: -10%; } }
      `}</style>

      <div style={{ position: "absolute", right: "8%", top: "9%", width: "13%", aspectRatio: "1/1", borderRadius: "50%", background: "#F6D46A", opacity: 0.9 }} />

      {/* 遠くの緑の山々 */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "22%", height: "24%", zIndex: 0 }}>
        <svg viewBox="0 0 400 90" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M0,90 L40,30 L90,60 L140,15 L190,55 L240,25 L290,58 L340,20 L400,50 L400,90 Z" fill="#9FBFA0" opacity="0.6" />
          <path d="M0,90 L60,50 L120,70 L180,40 L250,68 L320,42 L400,65 L400,90 Z" fill="#7FA582" opacity="0.8" />
        </svg>
      </div>

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

      <PositionedCharacter equipped={equipped} size={100} leftPct={leftPct} topPct={topPct} facingLeft={facingLeft} isWalking={isWalking} isFarming={isFarming} />
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
                    {!owned && <div className="text-xs ff-mono" style={{ color: item.cost === 0 ? C.sage : C.inkSoft, fontWeight: item.cost === 0 ? 600 : 400 }}>{item.cost === 0 ? t("labelFreeNow") : `${item.cost}pt`}</div>}
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
