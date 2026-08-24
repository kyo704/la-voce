"use client";

import { useMemo, useState, useEffect } from "react";
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
    <svg viewBox="0 0 160 200" style={{ width: size, height: size * 1.25, overflow: "visible" }}>
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

      {/* 接地シャドウ（立体感・奥行きを出すための影） */}
      <ellipse cx="80" cy="192" rx="34" ry="8" fill="#3D2E12" opacity="0.14" />

      {/* 足（脚全体を回転させて歩行アニメーション） */}
      <g className="leg-l">
        <rect x="52" y="150" width="20" height="34" rx="10" fill={bodyColor} />
        <ellipse cx="62" cy="180" rx="14" ry="8" fill="#EDE4CE" />
      </g>
      <g className="leg-r">
        <rect x="88" y="150" width="20" height="34" rx="10" fill={bodyColor} />
        <ellipse cx="98" cy="180" rx="14" ry="8" fill="#EDE4CE" />
      </g>

      {/* もこもこボディ（重なる円で質感を出す） */}
      <circle cx="80" cy="130" r="42" fill={bodyColor} />
      {[[45, 110, 16], [115, 110, 16], [40, 140, 14], [120, 140, 14], [55, 160, 14], [105, 160, 14], [80, 168, 16]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={bodyColor} />
      ))}
      {/* 立体感を出す陰影（右下をわずかに暗く） */}
      <ellipse cx="98" cy="145" rx="30" ry="34" fill="#D8CBA8" opacity="0.35" />

      {/* 腕（歩行時に脚と逆位相で振れる） */}
      <g className="arm-l"><ellipse cx="35" cy="128" rx="13" ry="10" fill={bodyColor} /></g>
      <g className="arm-r"><ellipse cx="125" cy="128" rx="13" ry="10" fill={bodyColor} /></g>

      {/* 服（体） */}
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

      {/* もこもこ頭（大きめ、二頭身） */}
      <circle cx="80" cy="70" r="46" fill={bodyColor} />
      {[[40, 55, 15], [120, 55, 15], [36, 80, 13], [124, 80, 13], [50, 34, 13], [110, 34, 13], [80, 26, 15]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={bodyColor} />
      ))}
      {/* 頭の陰影 */}
      <ellipse cx="102" cy="82" rx="26" ry="30" fill="#D8CBA8" opacity="0.3" />

      {/* 顔まわり（毛を少し短めにした肌色っぽい部分） */}
      <ellipse cx="80" cy="76" rx="30" ry="26" fill="#FBF6EA" />

      {/* 小さいツノ（はっきり見えるように色とアウトラインを強調） */}
      <path d="M52,40 Q42,26 52,14 Q60,24 56,34 Q62,30 62,38 Q58,44 52,40 Z" fill="#D9AE6E" stroke="#A87D45" strokeWidth="1.2" />
      <path d="M108,40 Q118,26 108,14 Q100,24 104,34 Q98,30 98,38 Q102,44 108,40 Z" fill="#D9AE6E" stroke="#A87D45" strokeWidth="1.2" />

      {/* 耳 */}
      <ellipse cx="42" cy="72" rx="8" ry="12" fill={bodyShade} transform="rotate(-20 42 72)" />
      <ellipse cx="118" cy="72" rx="8" ry="12" fill={bodyShade} transform="rotate(20 118 72)" />

      {/* 帽子 */}
      {equipped.hat === "hat_straw" && (
        <g>
          {/* つばの影 */}
          <ellipse cx="80" cy="41" rx="40" ry="9" fill="#C79A46" opacity="0.55" />
          {/* つば（麦わらの網目を放射状の線で表現） */}
          <ellipse cx="80" cy="38" rx="38" ry="8" fill="#E8C979" />
          {Array.from({ length: 13 }).map((_, i) => {
            const t = i / 12;
            const x = 44 + t * 72;
            return <line key={`brim-${i}`} x1={x} y1="34" x2={x} y2="42" stroke="#C79A46" strokeWidth="0.8" opacity="0.55" />;
          })}
          <ellipse cx="80" cy="35" rx="37" ry="4" fill="#F3DFA0" opacity="0.6" />
          {/* 山（ドーム部分） */}
          <path d="M54,39 Q80,8 106,39 Q80,25 54,39 Z" fill="#F0D68F" />
          {/* 編み目の質感（斜線を重ねて織り模様に） */}
          {[
            "M58,37 Q68,22 80,14", "M64,38 Q74,24 86,15", "M70,38 Q80,25 92,17",
            "M76,38 Q86,26 98,19", "M82,38 Q92,27 102,22", "M60,36 Q70,32 80,30"
          ].map((d, i) => (
            <path key={`weave-${i}`} d={d} stroke="#C79A46" strokeWidth="0.9" fill="none" opacity="0.5" />
          ))}
          {/* 帽子バンド */}
          <path d="M56,35 Q80,28 104,35" stroke="#96323A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
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

      {/* 目（まばたきする）・鼻・口・頬 */}
      <ellipse className="sheep-eye" cx="66" cy="76" rx="4" ry="4" fill="#3D3226" />
      <ellipse className="sheep-eye" cx="94" cy="76" rx="4" ry="4" fill="#3D3226" />
      <ellipse cx="80" cy="88" rx="5" ry="3.5" fill="#C98A6E" />
      <path d="M72,94 Q80,99 88,94" stroke="#8A5A42" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="58" cy="88" r="6" fill="#F0B7A4" opacity="0.6" />
      <circle cx="102" cy="88" r="6" fill="#F0B7A4" opacity="0.6" />
    </svg>
  );
}

// ===== 自動でうろうろ歩き回るためのフック =====
function useWander(centerX, centerY, rangeX, rangeY) {
  const [pos, setPos] = useState([centerX, centerY]);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const MOVE_DURATION = 2600;

  useEffect(() => {
    let cancelled = false;
    let timer, walkTimer;
    function pickNext() {
      const delay = 2800 + Math.random() * 2400;
      timer = setTimeout(() => {
        if (cancelled) return;
        let nx, ny, tries = 0;
        do {
          const u = Math.random() * 2 - 1;
          const v = Math.random() * 2 - 1;
          if (u * u + v * v <= 1) {
            nx = centerX + u * rangeX;
            ny = centerY + v * rangeY;
            break;
          }
          tries += 1;
        } while (tries < 20);
        if (nx === undefined) { nx = centerX; ny = centerY; }
        setIsWalking(true);
        setPos((prev) => {
          setFacingLeft(nx < prev[0] - 2);
          return [nx, ny];
        });
        walkTimer = setTimeout(() => { if (!cancelled) setIsWalking(false); }, MOVE_DURATION);
        pickNext();
      }, delay);
    }
    pickNext();
    return () => { cancelled = true; clearTimeout(timer); clearTimeout(walkTimer); };
  }, [centerX, centerY, rangeX, rangeY]);

  return [pos, facingLeft, isWalking];
}

// キャラクターを部屋・庭の中で滑らかに動かして表示する
function AnimatedCharacter({ equipped, size, pos, facingLeft, isWalking }) {
  const halfW = size / 2;
  const footOffset = size * 1.15;
  return (
    <g style={{ transition: "transform 2.6s ease-in-out", transform: `translate(${pos[0]}px, ${pos[1]}px)` }}>
      <g transform={`translate(${-halfW},${-footOffset}) ${facingLeft ? `translate(${size},0) scale(-1,1)` : ""}`}>
        <SheepCharacter equipped={equipped} size={size} isWalking={isWalking} />
      </g>
    </g>
  );
}

function Bed({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-30" y="-16" width="60" height="30" rx="6" fill="#D9C9AE" />
      <rect x="-30" y="-16" width="60" height="10" rx="5" fill="#F0E6D2" />
      <rect x="-24" y="-13" width="16" height="8" rx="3" fill="#FFFDF8" />
    </g>
  );
}
function Shelf({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-18" y="-40" width="36" height="40" fill="#B98A5E" />
      <rect x="-18" y="-28" width="36" height="3" fill="#8B6529" />
      <rect x="-18" y="-14" width="36" height="3" fill="#8B6529" />
      <rect x="-13" y="-38" width="8" height="8" fill="#C0454B" />
      <rect x="-1" y="-38" width="8" height="8" fill="#5B7FA6" />
    </g>
  );
}
function PottedPlant({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M-10,0 L10,0 L7,-14 L-7,-14 Z" fill="#C98A56" />
      <ellipse cx="0" cy="-18" rx="12" ry="14" fill="#6FA566" />
      <ellipse cx="-6" cy="-26" rx="8" ry="10" fill="#7FB577" />
      <ellipse cx="6" cy="-24" rx="8" ry="10" fill="#5E9450" />
    </g>
  );
}
function Rug({ x, y }) {
  return <ellipse cx={x} cy={y} rx="34" ry="16" fill="#C98A9E" opacity="0.75" />;
}
function Bench({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-18" y="-4" width="36" height="4" fill="#8B5E3C" rx="1" />
      <rect x="-18" y="-14" width="36" height="4" fill="#8B5E3C" rx="1" />
      <rect x="-16" y="-14" width="3" height="14" fill="#6B4526" />
      <rect x="13" y="-14" width="3" height="14" fill="#6B4526" />
    </g>
  );
}
function Fountain({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="0" cy="8" rx="20" ry="6" fill="#B8C4CC" />
      <rect x="-3" y="-14" width="6" height="20" fill="#9FB0BA" />
      <circle cx="0" cy="-16" r="5" fill="#CFE0E8" />
    </g>
  );
}
function Lantern({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="-8" y="-4" width="16" height="5" fill="#8B6529" rx="1" />
      <rect x="-6" y="0" width="12" height="16" fill="#B8863B" rx="2" />
      <circle cx="0" cy="8" r="3" fill="#F6D98A" />
    </g>
  );
}
function FlowerBed({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="0" cy="4" rx="24" ry="10" fill="#7A9C70" />
      {[-14, -4, 8, 16].map((dx, i) => (
        <circle key={i} cx={dx} cy={-2 + (i % 2) * 3} r="5" fill={["#D98A9E", "#E8B84B", "#8FA9C9", "#F6C6D0"][i]} />
      ))}
    </g>
  );
}

const FURNITURE_RENDER = { furniture_bed: Bed, furniture_shelf: Shelf, furniture_plant: PottedPlant, furniture_rug: Rug };
const GARDEN_RENDER = { garden_bench: Bench, garden_fountain: Fountain, garden_lantern: Lantern, garden_flowerbed: FlowerBed };

// アイソメの壁面上の点を計算する（底辺2点を補間し、壁の高さ方向にずらす）
// baseP1→baseP2 が壁の底辺。t=0〜1で底辺上の位置、heightFrac=0〜1で壁の高さ方向の位置。
function wallPoint(baseP1, baseP2, t, heightFrac, wallH) {
  const bx = baseP1[0] + (baseP2[0] - baseP1[0]) * t;
  const by = baseP1[1] + (baseP2[1] - baseP1[1]) * t;
  return [bx, by - wallH * heightFrac];
}

// ===== アイソメトリック風の部屋 =====
function RoomScene({ equipped, owned }) {
  const floorColor = MATERIAL_COLORS[equipped.floor || "floor_default"] || MATERIAL_COLORS.floor_default;
  const wallColor = MATERIAL_COLORS[equipped.wall || "wall_default"] || MATERIAL_COLORS.wall_default;
  const windowFrameColor = MATERIAL_COLORS[equipped.window || "window_default"] || MATERIAL_COLORS.window_default;
  const sceneryColor = MATERIAL_COLORS[equipped.scenery || "scenery_default"] || MATERIAL_COLORS.scenery_default;
  const placedFurniture = (owned || []).filter((k) => FURNITURE_RENDER[k]);

  // アイソメの床（ひし形）と左右の壁
  const cx = 200, cy = 210;
  const fw = 150, fh = 75; // floor half-width / half-height (isometric)
  const wallH = 130;
  const top = [cx, cy - fh];
  const right = [cx + fw, cy];
  const bottom = [cx, cy + fh];
  const left = [cx - fw, cy];

  // 窓枠・ガラス・格子を、左壁の傾きに正しく沿わせて計算する
  const winOuter = [
    wallPoint(left, top, 0.22, 0.40, wallH),
    wallPoint(left, top, 0.62, 0.40, wallH),
    wallPoint(left, top, 0.62, 0.88, wallH),
    wallPoint(left, top, 0.22, 0.88, wallH)
  ];
  const winInner = [
    wallPoint(left, top, 0.26, 0.46, wallH),
    wallPoint(left, top, 0.58, 0.46, wallH),
    wallPoint(left, top, 0.58, 0.82, wallH),
    wallPoint(left, top, 0.26, 0.82, wallH)
  ];
  const winMidV1 = [wallPoint(left, top, 0.42, 0.46, wallH), wallPoint(left, top, 0.42, 0.82, wallH)];
  const winMidH = [wallPoint(left, top, 0.26, 0.64, wallH), wallPoint(left, top, 0.58, 0.64, wallH)];

  const [wanderPos, facingLeft, isWalking] = useWander(cx, cy + 14, 58, 26);

  return (
    <svg viewBox="0 0 400 340" style={{ width: "100%", maxWidth: 580 }}>
      <rect x="0" y="0" width="400" height="340" fill="#FBF6EA" />

      {/* 左壁 */}
      <polygon points={`${left[0]},${left[1]} ${top[0]},${top[1]} ${top[0]},${top[1] - wallH} ${left[0]},${left[1] - wallH}`} fill={wallColor} />
      {/* 右壁 */}
      <polygon points={`${top[0]},${top[1]} ${right[0]},${right[1]} ${right[0]},${right[1] - wallH} ${top[0]},${top[1] - wallH}`} fill={wallColor} opacity="0.88" />

      {/* 窓（左壁と平行・同じ傾きで設置） */}
      <polygon points={winOuter.map((p) => p.join(",")).join(" ")} fill={windowFrameColor} />
      <polygon points={winInner.map((p) => p.join(",")).join(" ")} fill={sceneryColor} />
      <line x1={winMidV1[0][0]} y1={winMidV1[0][1]} x2={winMidV1[1][0]} y2={winMidV1[1][1]} stroke={windowFrameColor} strokeWidth="2" />
      <line x1={winMidH[0][0]} y1={winMidH[0][1]} x2={winMidH[1][0]} y2={winMidH[1][1]} stroke={windowFrameColor} strokeWidth="2" />

      {/* 床（ひし形） */}
      <polygon points={`${top[0]},${top[1]} ${right[0]},${right[1]} ${bottom[0]},${bottom[1]} ${left[0]},${left[1]}`} fill={floorColor} />

      {/* ラグは床の上に敷く */}
      {placedFurniture.includes("furniture_rug") && <Rug x={cx} y={cy + 10} />}

      {/* キャラクター（自動でうろうろ歩き回る） */}
      <AnimatedCharacter equipped={equipped} size={112} pos={wanderPos} facingLeft={facingLeft} isWalking={isWalking} />

      {/* 家具（ラグ以外） */}
      {placedFurniture.filter((k) => k !== "furniture_rug").map((k, i) => {
        const Comp = FURNITURE_RENDER[k];
        const positions = [[cx - 110, cy - 10], [cx + 90, cy - 30], [cx + 60, cy + 30]];
        const [px, py] = positions[i % positions.length];
        return <Comp key={k} x={px} y={py} />;
      })}
    </svg>
  );
}

// ===== 庭のシーン =====
function GardenScene({ equipped, owned }) {
  const placedOrnaments = (owned || []).filter((k) => GARDEN_RENDER[k]);
  const [wanderPos, facingLeft, isWalking] = useWander(200, 232, 95, 24);

  return (
    <svg viewBox="0 0 400 300" style={{ width: "100%", maxWidth: 580 }}>
      <defs>
        <linearGradient id="charSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFBF2" />
          <stop offset="100%" stopColor="#F6E9D8" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="300" fill="url(#charSky)" />
      <circle cx="345" cy="42" r="22" fill="#F3D48A" opacity="0.55" />
      <path d="M0,220 Q200,204 400,220 L400,300 L0,300 Z" fill="#8FAE84" />
      <path d="M0,226 Q200,210 400,226 L400,300 L0,300 Z" fill="#7A9C70" />

      {placedOrnaments.map((k, i) => {
        const Comp = GARDEN_RENDER[k];
        const positions = [[70, 220], [320, 216], [130, 90], [300, 250]];
        const [px, py] = positions[i % positions.length];
        return <Comp key={k} x={px} y={py} />;
      })}

      <AnimatedCharacter equipped={equipped} size={125} pos={wanderPos} facingLeft={facingLeft} isWalking={isWalking} />
    </svg>
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
