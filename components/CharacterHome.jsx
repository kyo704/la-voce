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
        <path d="M56,108 Q80,124 104,108 L100,120 Q80,132 60,120 Z" fill="#C0454B" />
      )}
      {equipped.outfit === "outfit_overall" && (
        <g>
          <path d="M58,112 L102,112 L98,168 Q80,176 62,168 Z" fill="#5B7FA6" opacity="0.92" />
          <rect x="64" y="100" width="10" height="18" fill="#5B7FA6" />
          <rect x="86" y="100" width="10" height="18" fill="#5B7FA6" />
          <circle cx="69" cy="130" r="3" fill="#3E5A78" />
          <circle cx="91" cy="130" r="3" fill="#3E5A78" />
        </g>
      )}
      {equipped.outfit === "outfit_sweater" && (
        <path d="M50,105 Q80,96 110,105 Q114,140 104,166 Q80,176 56,166 Q46,140 50,105 Z" fill="#C98A56" opacity="0.92" />
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
          <circle cx="80" cy="6" r="7" fill="#F6EFDF" />
        </g>
      )}
      {equipped.hat === "hat_ribbon" && (
        <g>
          <path d="M56,36 Q66,20 80,30 Q94,20 104,36 Q90,32 80,38 Q70,32 56,36 Z" fill="#C0454B" />
          <circle cx="80" cy="34" r="5" fill="#96323A" />
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
      <rect x="2" y="10" width="56" height="26" rx="6" fill="#D9C9AE" />
      <rect x="2" y="10" width="56" height="10" rx="4" fill="#F0E6D2" />
      <rect x="8" y="13" width="16" height="7" rx="3" fill="#FFFDF8" />
    </svg>
  );
}
function ShelfIcon() {
  return (
    <svg viewBox="0 0 40 45" width="100%" height="100%">
      <rect x="2" y="4" width="36" height="41" fill="#B98A5E" />
      <rect x="2" y="17" width="36" height="3" fill="#8B6529" />
      <rect x="2" y="31" width="36" height="3" fill="#8B6529" />
      <rect x="7" y="6" width="9" height="9" fill="#C0454B" />
      <rect x="19" y="6" width="9" height="9" fill="#5B7FA6" />
    </svg>
  );
}
function PlantIcon() {
  return (
    <svg viewBox="0 0 40 50" width="100%" height="100%">
      <path d="M10,48 L30,48 L26,32 L14,32 Z" fill="#C98A56" />
      <ellipse cx="20" cy="26" rx="16" ry="18" fill="#6FA566" />
      <ellipse cx="12" cy="16" rx="10" ry="12" fill="#7FB577" />
      <ellipse cx="28" cy="18" rx="10" ry="12" fill="#5E9450" />
    </svg>
  );
}
function RugIcon() {
  return (
    <svg viewBox="0 0 100 40" width="100%" height="100%">
      <ellipse cx="50" cy="20" rx="48" ry="18" fill="#C98A9E" opacity="0.75" />
    </svg>
  );
}
function BenchIcon() {
  return (
    <svg viewBox="0 0 60 40" width="100%" height="100%">
      <rect x="4" y="14" width="52" height="6" fill="#8B5E3C" rx="2" />
      <rect x="4" y="2" width="52" height="6" fill="#8B5E3C" rx="2" />
      <rect x="7" y="2" width="5" height="30" fill="#6B4526" />
      <rect x="48" y="2" width="5" height="30" fill="#6B4526" />
    </svg>
  );
}
function FountainIcon() {
  return (
    <svg viewBox="0 0 50 50" width="100%" height="100%">
      <ellipse cx="25" cy="42" rx="22" ry="7" fill="#B8C4CC" />
      <rect x="21" y="14" width="8" height="26" fill="#9FB0BA" />
      <circle cx="25" cy="12" r="7" fill="#CFE0E8" />
    </svg>
  );
}
function LanternIcon() {
  return (
    <svg viewBox="0 0 30 45" width="100%" height="100%">
      <rect x="6" y="4" width="18" height="6" fill="#8B6529" rx="1.5" />
      <rect x="8" y="10" width="14" height="26" fill="#B8863B" rx="3" />
      <circle cx="15" cy="24" r="4.5" fill="#F6D98A" />
    </svg>
  );
}
function FlowerBedIcon() {
  return (
    <svg viewBox="0 0 60 30" width="100%" height="100%">
      <ellipse cx="30" cy="18" rx="28" ry="11" fill="#7A9C70" />
      {[10, 24, 36, 48].map((dx, i) => (
        <circle key={i} cx={dx} cy={12 + (i % 2) * 4} r="6" fill={["#D98A9E", "#E8B84B", "#8FA9C9", "#F6C6D0"][i]} />
      ))}
    </svg>
  );
}

const FURNITURE_ICON = { furniture_bed: BedIcon, furniture_shelf: ShelfIcon, furniture_plant: PlantIcon, furniture_rug: RugIcon };
const GARDEN_ICON = { garden_bench: BenchIcon, garden_fountain: FountainIcon, garden_lantern: LanternIcon, garden_flowerbed: FlowerBedIcon };

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

      <div style={{ position: "absolute", left: "8%", top: "9%", width: "26%", height: "28%", background: windowFrameColor, borderRadius: 8, padding: "6%", boxSizing: "border-box", zIndex: 1 }}>
        <div style={{ width: "100%", height: "100%", background: sceneryColor, borderRadius: 4 }} />
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
  const [leftPct, topPct, facingLeft, isWalking] = useWanderPercent(50, 80, 22, 6);

  return (
    <div style={{
      position: "relative", width: "100%", maxWidth: 480, margin: "0 auto", aspectRatio: "4 / 3",
      borderRadius: 18, overflow: "hidden",
      background: "linear-gradient(to bottom, #FFFBF2 0%, #F6E9D8 60%, #F6E9D8 100%)"
    }}>
      <div style={{ position: "absolute", right: "8%", top: "10%", width: "12%", aspectRatio: "1/1", borderRadius: "50%", background: "#F3D48A", opacity: 0.55 }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "30%", background: "#7A9C70" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "26%", height: "6%", background: "#8FAE84" }} />

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
                <div>
                  <div className="text-sm font-medium">{t(item.nameKey)}</div>
                  {!owned && <div className="text-xs ff-mono" style={{ color: C.inkSoft }}>{item.cost}pt</div>}
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
