"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { C } from "@/lib/tokens";
import {
  SHOP_ITEMS, SINGLE_SLOT_CATEGORIES, MULTI_SLOT_CATEGORIES, PLACEMENT_LIMITS,
  computeTotalEarned, computeStreaks, computeBalance
} from "@/lib/character";

const CATEGORY_LABEL_KEYS = {
  hat: "catHat", outfit: "catOutfit", accessory: "catAccessory", floor: "catFloor", wall: "catWall",
  window: "catWindow", scenery: "catScenery", backdrop: "catBackdrop", furniture: "catFurniture", garden: "catGarden"
};
const MATERIAL_COLORS = {
  floor_default: "#D8C9A8", floor_tile: "#C9C2B4", floor_carpet: "#C98A9E",
  floor_tatami: "#C9B87C", floor_terracotta: "#C97C4E", floor_indian: "#D9A054", floor_american: "#B98A5E", floor_chinese: "#B8453F",
  wall_default: "#F3E9D8", wall_stripe: "#E9D9C0", wall_wood: "#B98A5E",
  wall_washi: "#EDE6D3", wall_mediterranean: "#F2ECDD", wall_indian: "#E8985F", wall_american: "#C9836A", wall_chinese: "#C0454B", wall_wainscoting: "#F0E9D8",
  window_default: "#FFFDF8", window_wood: "#8B5E3C", window_blue: "#5C7599",
  window_shoji: "#EDE6D3", window_mediterranean: "#8FA9C9", window_indian: "#D9A054", window_american: "#FFFDF8", window_chinese: "#C0454B",
  window_stained_glass: "#8B6529", window_porthole: "#9FB0BA", window_bamboo_washi: "#C9B87C", window_grand: "#8B5E3C",
  scenery_default: "#BFE0E8", scenery_night: "#2E3A5C", scenery_sakura: "#F2C9D3", scenery_aurora: "#2E3A5C", scenery_ocean: "#5C9AC9",
  scenery_italy: "#F6C97A", scenery_germany: "#BFE0E8", scenery_france: "#E8D9E8"
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
      {equipped.accessory === "accessory_chopsticks" && (
        <g className="arm-r">
          <rect x="128" y="90" width="2" height="50" rx="1" fill="#D9AE6E" transform="rotate(8 129 115)" />
          <rect x="132" y="92" width="2" height="48" rx="1" fill="#C99A5E" transform="rotate(8 133 116)" />
        </g>
      )}
      {equipped.accessory === "accessory_fork" && (
        <g className="arm-r">
          <rect x="129" y="100" width="3" height="38" rx="1.5" fill="#C7CDD3" transform="rotate(-10 130 118)" />
          <path d="M125,88 L125.5,98 M128.5,86 L128.5,98 M131.5,86 L131.5,98 M134.5,88 L134,98" stroke="#C7CDD3" strokeWidth="1.6" fill="none" transform="rotate(-10 130 94)" />
        </g>
      )}
      {equipped.accessory === "accessory_bottle" && (
        <g className="arm-r">
          <rect x="124" y="98" width="14" height="34" rx="4" fill="#7FB577" opacity="0.88" transform="rotate(6 131 115)" />
          <rect x="128" y="90" width="6" height="10" fill="#5E9450" transform="rotate(6 131 95)" />
          <rect x="126" y="106" width="10" height="12" fill="#FBF6EA" opacity="0.65" transform="rotate(6 131 112)" />
        </g>
      )}
      {equipped.accessory === "accessory_pet_bottle" && (
        <g className="arm-r">
          <path d="M126,132 L136,132 L136,102 Q136,95 131,93 Q126,95 126,102 Z" fill="#9FC9E8" opacity="0.5" stroke="#6C9BC4" strokeWidth="0.6" transform="rotate(6 131 112)" />
          <rect x="128" y="88" width="6" height="6" rx="1" fill="#5C9AC9" transform="rotate(6 131 91)" />
          <rect x="124" y="112" width="14" height="11" fill="#F6D46A" opacity="0.85" transform="rotate(6 131 117)" />
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
      {equipped.outfit === "outfit_kimono_male" && (
        <g>
          <path d="M50,104 Q50,98 58,100 L54,178 Q80,188 106,178 L102,100 Q110,98 110,104 L108,180 Q80,192 52,180 Z" fill="#3D5266" opacity="0.97" />
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={i} x1={54 + i * 6} y1="108" x2={50 + i * 6} y2="176" stroke="#2E3D4E" strokeWidth="0.4" opacity="0.35" />
          ))}
          {/* 広袖（腕全体を覆う、たっぷりとした袂） */}
          <path d="M50,104 L14,109 Q7,124 11,147 Q15,155 30,151 L52,138 L52,110 Z" fill="#3D5266" opacity="0.98" />
          <path d="M110,104 L146,109 Q153,124 149,147 Q145,155 130,151 L108,138 L108,110 Z" fill="#3D5266" opacity="0.98" />
          <path d="M16,120 Q11,132 15,144" stroke="#2E3D4E" strokeWidth="0.6" fill="none" opacity="0.4" />
          <path d="M144,120 Q149,132 145,144" stroke="#2E3D4E" strokeWidth="0.6" fill="none" opacity="0.4" />
          <path d="M14,109 L52,110" stroke="#2E3D4E" strokeWidth="0.5" opacity="0.35" />
          <path d="M146,109 L108,110" stroke="#2E3D4E" strokeWidth="0.5" opacity="0.35" />
          <path d="M66,112 Q64,150 68,180" stroke="#2A3A48" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M62,102 L80,130 L98,102 L92,109 L80,134 L68,109 Z" fill="#FBF6EA" opacity="0.92" />
          <path d="M62,102 L80,130 M98,102 L80,130" stroke="#D9CFB8" strokeWidth="0.6" opacity="0.6" />
          <path d="M74,104 Q80,110 86,104" stroke="#8B6529" strokeWidth="1.4" fill="none" />
          <circle cx="74" cy="104" r="1.6" fill="#8B6529" />
          <circle cx="86" cy="104" r="1.6" fill="#8B6529" />
          <rect x="64" y="126" width="32" height="19" fill="#1A2530" opacity="0.94" />
          <rect x="70" y="129" width="20" height="13" fill="#8B6529" opacity="0.8" />
          <path d="M70,132 L90,132 M70,138 L90,138" stroke="#6B4E1E" strokeWidth="0.6" opacity="0.5" />
          <ellipse cx="62" cy="134" rx="4" ry="6" fill="#1A2530" opacity="0.7" />
          <ellipse cx="98" cy="134" rx="4" ry="6" fill="#1A2530" opacity="0.7" />
          <circle cx="58" cy="112" r="3.4" fill="#FBF6EA" opacity="0.85" stroke="#2A3A48" strokeWidth="0.5" />
          <path d="M58,109.5 L59,111.5 L58,113.5 L57,111.5 Z" fill="#2A3A48" opacity="0.6" />
          <circle cx="102" cy="112" r="3.4" fill="#FBF6EA" opacity="0.85" stroke="#2A3A48" strokeWidth="0.5" />
          <path d="M102,109.5 L103,111.5 L102,113.5 L101,111.5 Z" fill="#2A3A48" opacity="0.6" />
        </g>
      )}
      {equipped.outfit === "outfit_kimono_female" && (
        <g>
          <path d="M50,104 Q50,98 58,100 L56,176 Q80,186 104,176 L102,100 Q110,98 110,104 L106,178 Q80,190 54,178 Z" fill="#E896C4" opacity="0.95" />
          <path d="M56,150 Q80,158 104,150 L102,176 Q80,186 58,176 Z" fill="#F2B6D6" opacity="0.4" />
          {/* 振袖（腕全体を覆い、下にたっぷりと長く垂れる袂） */}
          <path d="M50,106 L18,112 Q9,132 13,162 Q17,170 34,165 L52,142 L52,112 Z" fill="#E896C4" opacity="0.96" />
          <path d="M110,106 L142,112 Q151,132 147,162 Q143,170 126,165 L108,142 L108,112 Z" fill="#E896C4" opacity="0.96" />
          <path d="M20,124 Q13,144 17,158" stroke="#C0619A" strokeWidth="0.7" fill="none" opacity="0.5" />
          <path d="M140,124 Q147,144 143,158" stroke="#C0619A" strokeWidth="0.7" fill="none" opacity="0.5" />
          <path d="M18,112 L52,112" stroke="#C0619A" strokeWidth="0.5" opacity="0.4" />
          <path d="M142,112 L108,112" stroke="#C0619A" strokeWidth="0.5" opacity="0.4" />
          <path d="M62,102 L80,128 L98,102 L92,109 L80,132 L68,109 Z" fill="#FBF6EA" opacity="0.94" />
          <path d="M65,104 L80,124 L95,104 L91,109 L80,126 L69,109 Z" fill="none" stroke="#F2C9D3" strokeWidth="1.2" opacity="0.7" />
          {[[63, 118], [97, 118], [58, 145], [102, 145], [20, 130], [140, 130], [24, 152], [136, 152]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="3.4" fill="#FFFBEA" opacity="0.9" />
              <circle cx={x} cy={y} r="1.3" fill="#E8B84B" opacity="0.85" />
            </g>
          ))}
          {[[70, 128], [90, 128], [30, 140], [130, 140], [28, 158], [132, 158]].map(([x, y], i) => (
            <path key={i} d={`M${x - 3},${y} Q${x},${y - 5} ${x + 3},${y} Q${x},${y + 4} ${x - 3},${y} Z`} fill="#7FB577" opacity="0.6" />
          ))}
          <rect x="64" y="122" width="32" height="21" fill="#F6D98A" opacity="0.96" />
          <path d="M64,128 L96,128 M64,138 L96,138" stroke="#B8863B" strokeWidth="1" opacity="0.6" />
          {[70, 80, 90].map((x, i) => <circle key={i} cx={x} cy="133" r="1.6" fill="#C0619A" opacity="0.6" />)}
          <path d="M64,132 L96,132" stroke="#C0454B" strokeWidth="1.6" opacity="0.85" />
          <circle cx="80" cy="132" r="2.4" fill="#F0C955" stroke="#C0454B" strokeWidth="0.8" />
          <path d="M58,128 Q68,112 80,126 Q68,134 58,128 Z" fill="#E896C4" stroke="#C0619A" strokeWidth="0.6" />
          <path d="M102,128 Q92,112 80,126 Q92,134 102,128 Z" fill="#E896C4" stroke="#C0619A" strokeWidth="0.6" />
          <circle cx="80" cy="126" r="3.6" fill="#C0619A" />
        </g>
      )}
      {equipped.outfit === "outfit_tailcoat" && (
        <g>
          <path d="M62,140 L57,184 L70,179 L70,140 Z" fill="#14141A" />
          <path d="M98,140 L103,184 L90,179 L90,140 Z" fill="#14141A" />
          <path d="M64,144 L61,180" stroke="#2A2A30" strokeWidth="0.6" opacity="0.5" />
          <path d="M96,144 L99,180" stroke="#2A2A30" strokeWidth="0.6" opacity="0.5" />
          <path d="M52,106 L108,106 L104,142 Q80,148 56,142 Z" fill="#14141A" opacity="0.97" />
          <path d="M64,108 Q80,102 96,108 L92,140 Q80,144 68,140 Z" fill="#FBF6EA" />
          <path d="M68,112 L92,112 M68,120 L92,120" stroke="#E4DCC9" strokeWidth="0.5" opacity="0.5" />
          {[118, 126, 134].map((y, i) => <circle key={i} cx="80" cy={y} r="1.5" fill="#D9AE6E" stroke="#8B6529" strokeWidth="0.4" />)}
          <path d="M64,108 L78,124 L69,132 L58,112 Z" fill="#14141A" />
          <path d="M96,108 L82,124 L91,132 L102,112 Z" fill="#14141A" />
          <path d="M66,111 L76,122" stroke="#3A3A42" strokeWidth="1" opacity="0.6" />
          <path d="M94,111 L84,122" stroke="#3A3A42" strokeWidth="1" opacity="0.6" />
          <path d="M60,116 L66,113 L64,120 L58,120 Z" fill="#FBF6EA" stroke="#D9CFC0" strokeWidth="0.5" />
          <path d="M74,110 L80,118 L86,110 L83,115 L80,120 L77,115 Z" fill="#FBF6EA" stroke="#D9CFC0" strokeWidth="0.6" />
          <circle cx="38" cy="128" r="1.6" fill="#D9AE6E" stroke="#8B6529" strokeWidth="0.4" />
          <circle cx="122" cy="128" r="1.6" fill="#D9AE6E" stroke="#8B6529" strokeWidth="0.4" />
        </g>
      )}
      {equipped.outfit === "outfit_dress" && (
        <g>
          <path d="M60,106 Q80,100 100,106 L106,140 Q120,150 122,178 Q80,190 38,178 Q40,150 54,140 Z" fill="#7A3F6E" opacity="0.95" />
          <path d="M48,150 Q80,162 112,150 Q116,168 108,180 Q80,188 52,180 Q44,168 48,150 Z" fill="#8F5482" opacity="0.55" />
          <path d="M44,164 Q80,176 116,164" stroke="#5B2A50" strokeWidth="1" fill="none" opacity="0.4" />
          {Array.from({ length: 7 }).map((_, i) => (
            <path key={i} d={`M${44 + i * 12},150 Q${47 + i * 12},166 ${44 + i * 12},182`} stroke="#5B2A50" strokeWidth="0.8" opacity="0.35" fill="none" />
          ))}
          <path d="M64,108 Q80,104 96,108 L94,138 Q80,142 66,138 Z" fill="#8F5482" opacity="0.6" />
          <path d="M66,112 Q80,109 94,112" stroke="#5B2A50" strokeWidth="0.7" opacity="0.5" fill="none" />
          <path d="M68,108 Q64,100 58,102" stroke="#7A3F6E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M92,108 Q96,100 102,102" stroke="#7A3F6E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M56,140 Q80,150 104,140" stroke="#F0C955" strokeWidth="2.6" fill="none" opacity="0.9" />
          <circle cx="80" cy="140" r="3.6" fill="#F0C955" stroke="#C99A2E" strokeWidth="0.8" />
          <circle cx="80" cy="140" r="1.6" fill="#C0454B" />
          {[[68, 120], [92, 120], [72, 132], [88, 132]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1" fill="#F0C955" opacity="0.8" />
          ))}
        </g>
      )}
      {equipped.outfit === "outfit_king_robe" && (
        <g>
          <path d="M40,100 Q80,90 120,100 L128,180 Q80,190 32,180 Z" fill="#5B2A6E" opacity="0.96" />
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => (
              <path key={`${row}-${col}`}
                d={`M${44 + col * 18},${106 + row * 15} L${53 + col * 18},${112 + row * 15} L${44 + col * 18},${118 + row * 15} L${35 + col * 18},${112 + row * 15} Z`}
                fill="#F0C955" opacity="0.08" />
            ))
          )}
          <path d="M56,104 Q80,98 104,104 L100,178 Q80,186 60,178 Z" fill="#8A1428" opacity="0.96" />
          <path d="M56,104 Q80,98 104,104" stroke="#F0C955" strokeWidth="3" fill="none" />
          <path d="M60,178 Q80,186 100,178" stroke="#F0C955" strokeWidth="3" fill="none" />
          {[64, 96].map((x, i) => <path key={i} d={`M${x},110 L${x},170`} stroke="#F0C955" strokeWidth="2" opacity="0.75" />)}
          {[72, 88].map((x, i) => (
            <g key={i}>
              {[118, 138, 158].map((y, j) => <circle key={j} cx={x} cy={y} r="2" fill="#F0C955" opacity="0.5" />)}
            </g>
          ))}
          <path d="M38,100 Q80,88 122,100 L122,112 Q80,98 38,112 Z" fill="#FBF6EA" stroke="#D9CFC0" strokeWidth="1" />
          {[44, 54, 64, 74, 86, 96, 106, 116].map((x, i) => <circle key={i} cx={x} cy="104" r="2" fill="#241914" />)}
          <circle cx="56" cy="106" r="5.5" fill="#F0C955" stroke="#C99A2E" strokeWidth="1" />
          <circle cx="56" cy="106" r="2.6" fill="#5B7FA6" />
          <circle cx="55" cy="104.5" r="0.9" fill="#FFFFFF" opacity="0.8" />
          <circle cx="104" cy="106" r="5.5" fill="#F0C955" stroke="#C99A2E" strokeWidth="1" />
          <circle cx="104" cy="106" r="2.6" fill="#5B7FA6" />
          <circle cx="103" cy="104.5" r="0.9" fill="#FFFFFF" opacity="0.8" />
          <path d="M62,112 Q80,124 98,112" stroke="#F0C955" strokeWidth="2" fill="none" />
          <path d="M66,113 Q80,132 94,113" stroke="#F0C955" strokeWidth="1.3" fill="none" opacity="0.7" />
          <circle cx="80" cy="122" r="4" fill="#C0454B" stroke="#F0C955" strokeWidth="1.2" />
          <circle cx="80" cy="122" r="1.6" fill="#E87F8A" opacity="0.7" />
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
        const chairLeft = 79, chairFloorTop = 98, chairSeatTop = 89;
        busyRef.current = true;
        moveTo(chairLeft, chairFloorTop, 2000);
        addTimer(() => {
          if (cancelled) return;
          setLeftPct(chairLeft);
          setTopPct(chairSeatTop);
          setIsSitting(true);
          addTimer(() => {
            if (cancelled) return;
            setIsSitting(false);
            setLeftPct(chairLeft);
            setTopPct(chairFloorTop);
            leftRef.current = chairLeft;
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
        const bedApproachLeft = 13, bedFloorTop = 98, pillowLeft = 7, pillowTop = 82;
        busyRef.current = true;
        moveTo(bedApproachLeft, bedFloorTop, 2000);
        addTimer(() => {
          if (cancelled) return;
          setLeftPct(pillowLeft);
          setTopPct(pillowTop);
          setIsLying(true);
          addTimer(() => {
            if (cancelled) return;
            setIsLying(false);
            // 寝転び終わったら、必ず「立った状態の正しい足元座標」に戻してから次の行動に移る
            // （ここでリセットしないと、寝ている間の中央基準の座標がそのまま足元基準として解釈され、
            //   次に椅子へ歩く際に宙に浮いたように見えるバグが起きていた）
            setLeftPct(bedApproachLeft);
            setTopPct(bedFloorTop);
            leftRef.current = bedApproachLeft;
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
        const gateLeft = 95, gateTop = 98;
        setPkg({ left: gateLeft, top: gateTop, stage: "waiting" });
        busyRef.current = true;
        addTimer(() => {
          if (cancelled) return;
          moveTo(gateLeft, gateTop, 2600);
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
        const fieldLeft = 58, fieldTop = 98;
        busyRef.current = true;
        moveTo(fieldLeft, fieldTop, 2200);
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
function SheepSleepingHead({ size }) {
  return (
    <svg viewBox="0 0 60 60" style={{ width: size, height: size, display: "block", overflow: "visible" }}>
      <circle cx="30" cy="32" r="24" fill="#F6EFDF" />
      {[[12, 22, 8], [48, 22, 8], [10, 38, 6.5], [50, 38, 6.5], [21, 12, 6.5], [39, 12, 6.5], [30, 8, 7.5]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#F6EFDF" />
      ))}
      <ellipse cx="30" cy="35" rx="15" ry="13" fill="#FBF6EA" />
      <path d="M21,35 Q25,38 29,35" stroke="#3D3226" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M31,35 Q35,38 39,35" stroke="#3D3226" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="30" cy="42" rx="2.8" ry="1.8" fill="#C98A6E" />
      <circle cx="13" cy="40" r="3.6" fill="#F0B7A4" opacity="0.55" />
      <circle cx="47" cy="40" r="3.6" fill="#F0B7A4" opacity="0.55" />
      <path d="M15,15 Q11,7 16,3 Q19,9 17,16 Z" fill="#D9AE6E" stroke="#A87D45" strokeWidth="0.8" />
      <path d="M45,15 Q49,7 44,3 Q41,9 43,16 Z" fill="#D9AE6E" stroke="#A87D45" strokeWidth="0.8" />
      <text x="48" y="14" fontSize="12" fill="#B8863B" opacity="0.75" fontFamily="Georgia, serif" fontStyle="italic">z</text>
      <text x="56" y="6" fontSize="8" fill="#B8863B" opacity="0.6" fontFamily="Georgia, serif" fontStyle="italic">z</text>
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
          transition: "left 1.6s ease-in-out, top 1.6s ease-in-out",
          zIndex: 6
        }}
      >
        <SheepSleepingHead size={size * 0.62} />
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
    <svg viewBox="0 0 60 46" width="100%" height="100%">
      <rect x="0" y="4" width="7" height="34" rx="3" fill="#B98A5E" />
      <rect x="2" y="12" width="56" height="24" rx="6" fill="#D9C9AE" />
      <rect x="2" y="12" width="56" height="9" rx="4" fill="#F0E6D2" />
      <rect x="7" y="15" width="15" height="6" rx="3" fill="#FFFDF8" />
      <circle cx="14.5" cy="18" r="1.3" fill="#E8B7C4" opacity="0.7" />
      <path d="M4,28 Q30,24 56,28" stroke="#C9B896" strokeWidth="1.5" fill="none" opacity="0.5" />
      <rect x="3" y="38" width="4" height="7" fill="#8B6529" />
      <rect x="52" y="38" width="4" height="7" fill="#8B6529" />
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
    <svg viewBox="0 0 90 60" width="100%" height="100%">
      {/* 大屋根（グランドピアノの曲線ボディ） */}
      <path d="M8,20 Q6,10 22,8 L62,8 Q78,8 78,20 L78,30 Q78,36 68,38 L46,44 L22,38 Q8,35 8,28 Z" fill="#2E2118" />
      <path d="M12,20 Q11,14 23,12 L60,12 Q73,12 73,20 L73,28 Q73,32 66,34 L46,39 L24,34 Q12,32 12,26 Z" fill="#4A362A" opacity="0.4" />
      {/* 開いた蓋（支え棒付き） */}
      <path d="M20,10 L46,4 L70,14 L66,17 L46,9 L23,15 Z" fill="#1A1410" opacity="0.9" />
      <line x1="46" y1="9" x2="46" y2="30" stroke="#4A362A" strokeWidth="1.2" opacity="0.6" />
      {/* 鍵盤側の面 */}
      <path d="M22,38 L46,44 L68,38 L68,46 L46,52 L22,46 Z" fill="#1A1410" />
      <path d="M26,39 L46,44 L64,39 L64,45 L46,49.5 L26,45 Z" fill="#F6EFDF" />
      {Array.from({ length: 13 }).map((_, i) => (
        <rect key={i} x={27 + i * 2.85} y="39.5" width="2.1" height="9" fill="#1A1410" opacity={i % 2 === 0 ? 0 : 0.9} transform={`skewX(${(i - 6) * 0.4})`} />
      ))}
      {/* 譜面立て */}
      <rect x="38" y="16" width="16" height="9" fill="#1A1410" opacity="0.55" />
      {/* 脚（3本） */}
      <rect x="14" y="35" width="4.5" height="14" fill="#2E2118" />
      <rect x="72" y="27" width="4.5" height="16" fill="#2E2118" />
      <rect x="44" y="50" width="4.5" height="10" fill="#2E2118" />
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
function PaintingIcon() {
  return (
    <svg viewBox="0 0 50 60" width="100%" height="100%">
      <path d="M20,4 Q25,0 30,4" stroke="#8B6529" strokeWidth="1" fill="none" opacity="0.6" />
      <rect x="4" y="6" width="42" height="48" fill="#D9AE6E" stroke="#8B6529" strokeWidth="1.5" />
      <rect x="7" y="9" width="36" height="42" fill="#F6EFDF" />
      <rect x="7" y="9" width="36" height="26" fill="#BFE0E8" />
      <path d="M7,30 Q16,20 25,28 Q34,18 43,26 L43,35 L7,35 Z" fill="#7A9C70" />
      <circle cx="34" cy="15" r="4" fill="#F6D46A" opacity="0.8" />
      <rect x="7" y="35" width="36" height="16" fill="#8FAE84" opacity="0.5" />
    </svg>
  );
}

const FURNITURE_ICON = { furniture_bed: BedIcon, furniture_shelf: ShelfIcon, furniture_plant: PlantIcon, furniture_rug: RugIcon, furniture_chair: ChairIcon, furniture_piano: PianoIcon, furniture_painting: PaintingIcon };
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
  if (item.category === "backdrop") {
    return (
      <div style={boxStyle}>
        <svg viewBox="0 0 40 30" width="34" height="26">
          <rect width="40" height="30" fill="#A8D4EC" />
          <path d="M0,30 L10,12 L20,22 L28,8 L40,18 L40,30 Z" fill="#5E8A5E" />
        </svg>
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

// 家具は全て同じ「接地ライン」(top=98)に足元を揃え、横幅ぶん間隔を空けて重ならないように配置。
// ラグだけは床に敷く別レイヤー（家具の手前・足元の空きスペースに独立して配置）。
const FURNITURE_FLOOR_TOP = 98;
const FURNITURE_LAYOUT = {
  furniture_bed: { left: 13, top: FURNITURE_FLOOR_TOP, width: 26, z: 2 },
  furniture_piano: { left: 41, top: FURNITURE_FLOOR_TOP, width: 26, z: 2 },
  furniture_shelf: { left: 63, top: FURNITURE_FLOOR_TOP, width: 15, z: 2 },
  furniture_chair: { left: 79, top: FURNITURE_FLOOR_TOP, width: 15, z: 2 },
  furniture_plant: { left: 93, top: FURNITURE_FLOOR_TOP, width: 11, z: 2 },
  furniture_rug: { left: 50, top: 82, width: 26, z: 1 },
  // 絵画だけは床に接地せず、壁の高い位置に固定（窓のない右手のスペースに掛ける）
  furniture_painting: { left: 84, top: 32, width: 11, z: 3 }
};
// 庭は奥行きのある2列（奥列・手前列）で、それぞれの列内で足元のラインを揃えて重ならないように配置。
// 柵より手前に置かれるアイテムは柵を隠してよい。
const GARDEN_BACK_TOP = 76;
const GARDEN_FRONT_TOP = 98;
const GARDEN_LAYOUT = {
  garden_gazebo: { left: 18, top: GARDEN_BACK_TOP, width: 26, z: 1 },
  garden_lantern: { left: 50, top: GARDEN_BACK_TOP, width: 10, z: 1 },
  garden_pond: { left: 80, top: GARDEN_BACK_TOP, width: 24, z: 1 },
  garden_bench: { left: 12, top: GARDEN_FRONT_TOP, width: 20, z: 2 },
  garden_fountain: { left: 34, top: GARDEN_FRONT_TOP, width: 16, z: 2 },
  garden_field: { left: 58, top: GARDEN_FRONT_TOP, width: 26, z: 2 },
  garden_flowerbed: { left: 86, top: GARDEN_FRONT_TOP, width: 20, z: 2 }
};

// アイテムを左右方向にドラッグして位置を自由に決められるようにするラッパー。
// 縦方向（top）は接地ラインに固定したまま、横方向だけ自由に動かせる。
function DraggableItem({ left, top, width, z, editMode, minLeft = 3, maxLeft = 97, onDragEnd, transform, children }) {
  const wrapRef = useRef(null);
  const [dragLeft, setDragLeft] = useState(null);
  const draggingRef = useRef(false);

  function handlePointerDown(e) {
    if (!editMode) return;
    e.preventDefault();
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e) {
    if (!draggingRef.current || !wrapRef.current) return;
    const container = wrapRef.current.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    let pct = ((e.clientX - rect.left) / rect.width) * 100;
    pct = Math.max(minLeft, Math.min(maxLeft, pct));
    setDragLeft(pct);
  }
  function handlePointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (dragLeft !== null) onDragEnd(dragLeft);
    setDragLeft(null);
  }

  const effectiveLeft = dragLeft !== null ? dragLeft : left;

  return (
    <div
      ref={wrapRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: "absolute", left: `${effectiveLeft}%`, top: `${top}%`, width: `${width}%`,
        transform: transform || "translate(-50%, -100%)", zIndex: z,
        cursor: editMode ? "grab" : "default", touchAction: editMode ? "none" : "auto"
      }}
    >
      {editMode && (
        <div style={{ position: "absolute", inset: -4, border: `2px dashed ${C.gold}`, borderRadius: 8, pointerEvents: "none" }} />
      )}
      {children}
    </div>
  );
}

// ===== 部屋のシーン（正面から見たシンプルな部屋。中央寄せはCSSのleft/topで固定） =====
function FloorTexture({ material }) {
  const box = { position: "absolute", inset: 0, width: "100%", height: "100%" };
  const line = "rgba(60,40,20,0.16)";
  if (material === "floor_tile") {
    return (
      <svg viewBox="0 0 200 68" preserveAspectRatio="none" style={box}>
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => (
            <rect key={`${row}-${col}`} x={col * 25} y={row * 8.5} width="24" height="7.5"
              fill={(row + col) % 2 === 0 ? "rgba(255,255,255,0.12)" : "rgba(60,40,20,0.05)"}
              stroke={line} strokeWidth="1" />
          ))
        )}
      </svg>
    );
  }
  if (material === "floor_terracotta") {
    const hexPts = (cx, cy, r) => Array.from({ length: 6 }).map((_, i) => {
      const a = (Math.PI / 180) * (60 * i);
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");
    const hexes = [];
    const r = 13, dx = r * 1.5, dy = r * 1.73;
    for (let row = 0; row < 4; row++) {
      for (let col = -1; col < 8; col++) {
        hexes.push([col * dx + (row % 2 ? dx / 2 : 0), row * dy * 0.5 + 6]);
      }
    }
    return (
      <svg viewBox="0 0 200 68" preserveAspectRatio="none" style={box}>
        {hexes.map(([cx, cy], i) => (
          <polygon key={i} points={hexPts(cx, cy, r)} fill="none" stroke="rgba(90,40,10,0.3)" strokeWidth="1" />
        ))}
      </svg>
    );
  }
  if (material === "floor_tatami") {
    return (
      <svg viewBox="0 0 200 68" preserveAspectRatio="none" style={box}>
        {[2, 68, 134].map((x, i) => (
          <g key={i}>
            {Array.from({ length: 14 }).map((_, j) => (
              <line key={j} x1={x + 5 + j * 4.2} y1="8" x2={x + 5 + j * 4.2} y2="60" stroke="#A8934F" strokeWidth="0.6" opacity="0.45" />
            ))}
            {[24, 44].map((yy, j) => <line key={j} x1={x + 4} y1={yy} x2={x + 60} y2={yy} stroke="#8B6529" strokeWidth="0.8" opacity="0.35" />)}
            <rect x={x} y="4" width="64" height="60" fill="none" stroke="#2E4A2E" strokeWidth="4" opacity="0.88" />
            {Array.from({ length: 8 }).map((_, j) => <circle key={`t${j}`} cx={x + 8 + j * 7} cy="6" r="0.9" fill="#F0C955" opacity="0.75" />)}
            {Array.from({ length: 8 }).map((_, j) => <circle key={`b${j}`} cx={x + 8 + j * 7} cy="62" r="0.9" fill="#F0C955" opacity="0.75" />)}
          </g>
        ))}
      </svg>
    );
  }
  if (material === "floor_american") {
    return (
      <svg viewBox="0 0 200 68" preserveAspectRatio="none" style={box}>
        {[14, 28, 42, 56].map((y, i) => <line key={i} x1="0" y1={y} x2="200" y2={y} stroke={line} strokeWidth="1" />)}
        {[15, 55, 95, 135, 175].map((x, i) => <path key={i} d={`M${x},0 Q${x + 4},14 ${x},28`} stroke={line} strokeWidth="0.7" fill="none" opacity="0.7" />)}
      </svg>
    );
  }
  if (material === "floor_chinese") {
    return (
      <svg viewBox="0 0 200 68" preserveAspectRatio="none" style={box}>
        {Array.from({ length: 9 }).map((_, i) => <path key={`a${i}`} d={`M${i * 28 - 20},0 L${i * 28 + 34},68`} stroke="#F0C955" strokeWidth="1" opacity="0.4" />)}
        {Array.from({ length: 9 }).map((_, i) => <path key={`b${i}`} d={`M${i * 28 + 34},0 L${i * 28 - 20},68`} stroke="#F0C955" strokeWidth="1" opacity="0.4" />)}
      </svg>
    );
  }
  if (material === "floor_indian") {
    const colors = ["#5B7FA6", "#E8985F", "#7FB577", "#C0454B", "#D9A054"];
    return (
      <svg viewBox="0 0 200 68" preserveAspectRatio="none" style={box}>
        {Array.from({ length: 9 }).map((_, i) => (
          <g key={i} transform={`translate(${i * 24 + 12},34)`}>
            <rect x="-10" y="-10" width="20" height="20" fill={colors[i % colors.length]} opacity="0.3" transform="rotate(45)" />
            <circle r="4" fill={colors[(i + 2) % colors.length]} opacity="0.4" />
          </g>
        ))}
      </svg>
    );
  }
  if (material === "floor_carpet") {
    const spots = [[10, 14], [38, 20], [70, 12], [95, 22], [130, 14], [160, 20], [185, 12], [22, 42], [55, 48], [85, 40], [115, 50], [145, 42], [175, 48]];
    return (
      <svg viewBox="0 0 200 68" preserveAspectRatio="none" style={box}>
        {spots.map(([cx, cy], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx="8" ry="5.5" fill={i % 2 === 0 ? "rgba(255,255,255,0.45)" : "rgba(233,180,203,0.4)"} />
        ))}
        {Array.from({ length: 70 }).map((_, i) => (
          <circle key={`d${i}`} cx={(i % 20) * 10 + 3} cy={Math.floor(i / 20) * 24 + 6} r="0.7" fill="rgba(255,255,255,0.3)" />
        ))}
      </svg>
    );
  }
  return null;
}


function WallTexture({ material }) {
  const box = { position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 };
  if (material === "wall_stripe") {
    return (
      <svg viewBox="0 0 200 150" preserveAspectRatio="none" style={box}>
        {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={i * 20} y="0" width="10" height="150" fill="rgba(184,138,94,0.4)" />)}
      </svg>
    );
  }
  if (material === "wall_wood") {
    return (
      <svg viewBox="0 0 200 150" preserveAspectRatio="none" style={box}>
        {Array.from({ length: 8 }).map((_, i) => <line key={i} x1={i * 26} y1="0" x2={i * 26} y2="150" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />)}
        {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M${10 + i * 33},10 Q${16 + i * 33},60 ${10 + i * 33},140`} stroke="rgba(0,0,0,0.12)" strokeWidth="1" fill="none" />)}
      </svg>
    );
  }
  if (material === "wall_washi") {
    return (
      <svg viewBox="0 0 200 150" preserveAspectRatio="none" style={box}>
        {[50, 100, 150].map((x, i) => <line key={i} x1={x} y1="0" x2={x} y2="150" stroke="rgba(139,101,41,0.4)" strokeWidth="2" />)}
        {[38, 76, 114].map((y, i) => <line key={i} x1="0" y1={y} x2="200" y2={y} stroke="rgba(139,101,41,0.4)" strokeWidth="2" />)}
      </svg>
    );
  }
  if (material === "wall_american") {
    return (
      <svg viewBox="0 0 200 150" preserveAspectRatio="none" style={box}>
        {Array.from({ length: 8 }).map((_, row) => (
          <g key={row}>
            {Array.from({ length: 7 }).map((_, col) => (
              <rect key={col} x={col * 36 - (row % 2) * 18} y={row * 19} width="34" height="17"
                fill={(row + col) % 2 === 0 ? "rgba(140,60,40,0.28)" : "rgba(120,50,32,0.22)"}
                stroke="rgba(90,50,30,0.45)" strokeWidth="1" />
            ))}
          </g>
        ))}
      </svg>
    );
  }
  if (material === "wall_indian") {
    return (
      <svg viewBox="0 0 200 150" preserveAspectRatio="none" style={box}>
        {Array.from({ length: 10 }).map((_, i) => <path key={i} d={`M${i * 20},12 L${i * 20 + 10},2 L${i * 20 + 20},12`} fill="none" stroke="#C0454B" strokeWidth="1.5" opacity="0.6" />)}
        {Array.from({ length: 10 }).map((_, i) => <path key={`b${i}`} d={`M${i * 20},140 L${i * 20 + 10},150 L${i * 20 + 20},140`} fill="none" stroke="#C0454B" strokeWidth="1.5" opacity="0.6" />)}
        <g transform="translate(100,75)">
          <circle r="20" fill="none" stroke="#C0454B" strokeWidth="1.2" opacity="0.4" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (Math.PI / 4) * i;
            return <circle key={i} cx={Math.cos(a) * 20} cy={Math.sin(a) * 20} r="2.5" fill="#D9A054" opacity="0.4" />;
          })}
        </g>
      </svg>
    );
  }
  if (material === "wall_chinese") {
    return (
      <svg viewBox="0 0 200 150" preserveAspectRatio="none" style={box}>
        {[40, 100, 160].map((x, i) => <line key={i} x1={x} y1="0" x2={x} y2="150" stroke="#F0C955" strokeWidth="2" opacity="0.75" />)}
        {Array.from({ length: 3 }).map((_, row) =>
          Array.from({ length: 6 }).map((_, col) => (
            <rect key={`${row}-${col}`} x={12 + col * 32} y={12 + row * 45} width="20" height="20"
              fill="none" stroke="#F0C955" strokeWidth="1" opacity="0.45" transform={`rotate(45 ${22 + col * 32} ${22 + row * 45})`} />
          ))
        )}
      </svg>
    );
  }
  if (material === "wall_mediterranean") {
    return (
      <svg viewBox="0 0 200 150" preserveAspectRatio="none" style={box}>
        {Array.from({ length: 60 }).map((_, i) => (
          <circle key={i} cx={(i % 12) * 17 + 5} cy={Math.floor(i / 12) * 30 + 10} r="4" fill="rgba(200,190,170,0.18)" />
        ))}
      </svg>
    );
  }
  if (material === "wall_wainscoting") {
    return (
      <svg viewBox="0 0 200 150" preserveAspectRatio="none" style={box}>
        {/* 腰壁（木製パネル部分） */}
        <rect x="0" y="75" width="200" height="24" fill="#C9A26B" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={i * 25 + 2} y="78" width="21" height="18" rx="1" fill="none" stroke="#8B6529" strokeWidth="1.2" opacity="0.65" />
        ))}
        {/* 見切り材（チェアレール） */}
        <rect x="0" y="72.5" width="200" height="3.5" fill="#8B6529" />
        <rect x="0" y="76" width="200" height="1" fill="#F0DFA8" opacity="0.5" />
        <rect x="0" y="98.5" width="200" height="2.5" fill="#6B4E1E" opacity="0.65" />
      </svg>
    );
  }
  return null;
}

function RoomScene({ equipped, owned, onTogglePlacement, onUpdatePosition, t }) {
  const [editMode, setEditMode] = useState(false);
  const floorKey = equipped.floor || "floor_default";
  const wallKey = equipped.wall || "wall_default";
  const floorColor = MATERIAL_COLORS[floorKey] || MATERIAL_COLORS.floor_default;
  const wallColor = MATERIAL_COLORS[wallKey] || MATERIAL_COLORS.wall_default;
  const windowFrameColor = MATERIAL_COLORS[equipped.window || "window_default"] || MATERIAL_COLORS.window_default;
  const sceneryColor = MATERIAL_COLORS[equipped.scenery || "scenery_default"] || MATERIAL_COLORS.scenery_default;
  const placedList = equipped.furniture || [];
  const placedFurniture = placedList.filter((k) => FURNITURE_ICON[k]);

  const windowKey = equipped.window || "window_default";
  const windowShape =
    windowKey === "window_chinese" ? { borderRadius: "50%", muntin: "none" }
    : (windowKey === "window_mediterranean" || windowKey === "window_indian") ? { borderRadius: "50% 50% 6px 6px", muntin: "none" }
    : windowKey === "window_shoji" ? { borderRadius: 4, muntin: "grid" }
    : windowKey === "window_porthole" ? { borderRadius: "50%", muntin: "rivets" }
    : windowKey === "window_stained_glass" ? { borderRadius: 4, muntin: "stainedglass" }
    : windowKey === "window_bamboo_washi" ? { borderRadius: "50%", muntin: "washi" }
    : windowKey === "window_grand" ? { borderRadius: 6, muntin: "cross" }
    : { borderRadius: 4, muntin: "cross" };
  const isBamboo = windowKey === "window_bamboo_washi";
  const isGrand = windowKey === "window_grand";
  const boxWidth = isGrand ? "95%" : "32%";
  const boxHeight = isGrand ? "64%" : "34%";
  const boxLeft = isGrand ? "2.5%" : "6%";
  const boxTop = isGrand ? "5%" : "8%";
  const isRoomExpanded = equipped.backdrop === "backdrop_room_expand";

  const sceneryKey = equipped.scenery || "scenery_default";

  const [leftPct, topPct, facingLeft, isWalking, isSitting, isLying] = useRoomLife(
    50, 78, 18, 6,
    placedFurniture.includes("furniture_chair"),
    placedFurniture.includes("furniture_bed")
  );

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: isRoomExpanded ? 720 : 480, margin: "0 auto", aspectRatio: isRoomExpanded ? "16 / 7" : "4 / 3", borderRadius: 18, overflow: "hidden", background: wallColor, transition: "max-width 0.4s ease, aspect-ratio 0.4s ease" }}>
      <WallTexture material={wallKey} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "34%", background: floorColor, zIndex: 0, overflow: "hidden" }}>
        <FloorTexture material={floorKey} />
      </div>

      <div style={{
        position: "absolute", left: boxLeft, top: boxTop, width: boxWidth, height: boxHeight,
        background: isBamboo ? "repeating-conic-gradient(from 0deg, #C9B87C 0deg 7deg, #A8934F 7deg 14deg)" : windowFrameColor,
        borderRadius: windowShape.borderRadius === 4 ? 8 : windowShape.borderRadius, padding: isBamboo ? "5%" : (isGrand ? "1.5%" : "2.5%"), boxSizing: "border-box", zIndex: 1
      }}>
        <div style={{ position: "relative", width: "100%", height: "100%", background: isBamboo ? "#F0E9D6" : sceneryColor, borderRadius: windowShape.borderRadius, overflow: "hidden" }}>
          {sceneryKey === "scenery_aurora" && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <rect width="100" height="100" fill="#1A2340" />
              {[0, 1, 2].map((i) => (
                <circle key={i} cx={20 + i * 30} cy={15 + (i % 2) * 10} r="1.4" fill="#FFFDF0" opacity="0.8" />
              ))}
              <path d="M0,55 Q25,30 50,50 Q75,70 100,45 L100,100 L0,100 Z" fill="#6FD9A8" opacity="0.55" />
              <path d="M0,65 Q30,45 55,62 Q80,78 100,58 L100,100 L0,100 Z" fill="#9F7FD9" opacity="0.45" />
              <path d="M0,75 Q35,60 60,72 Q85,84 100,70 L100,100 L0,100 Z" fill="#5CA9D9" opacity="0.4" />
              {isGrand && (
                <>
                  <path d="M0,92 L15,78 L30,90 L45,72 L60,88 L75,76 L90,90 L100,80 L100,100 L0,100 Z" fill="#0F1A30" opacity="0.75" />
                  <line x1="14" y1="6" x2="24" y2="14" stroke="#FFFDF0" strokeWidth="1.2" opacity="0.7" />
                </>
              )}
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
              {isGrand && (
                <>
                  <path d="M65,48 L68,48 L67,38 Q72,40 72,48 L78,48 L74,52 L62,52 Z" fill="#3D2E12" opacity="0.6" />
                  <path d="M8,20 Q12,17 16,20" stroke="#3D2E12" strokeWidth="1" fill="none" opacity="0.5" />
                  <path d="M20,26 Q24,23 28,26" stroke="#3D2E12" strokeWidth="1" fill="none" opacity="0.4" />
                </>
              )}
            </svg>
          )}
          {sceneryKey === "scenery_night" && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <rect width="100" height="100" fill="#2E3A5C" />
              <circle cx="72" cy="24" r="12" fill="#F6F1DC" opacity="0.92" />
              <circle cx="68" cy="20" r="10" fill="#2E3A5C" opacity="0.3" />
              {[[15, 15], [30, 10], [45, 22], [60, 8], [85, 15], [20, 35], [50, 40], [90, 42], [10, 50], [35, 55], [58, 30]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.2 : 0.7} fill="#FFFDF0" opacity="0.85" />
              ))}
              <path d="M0,80 Q30,68 55,78 Q75,86 100,72 L100,100 L0,100 Z" fill="#1A2340" opacity="0.7" />
              {isGrand && (
                <>
                  {[10, 20, 32, 44, 60, 72, 84].map((x, i) => (
                    <rect key={i} x={x} y={90 - (i % 3) * 4} width="4" height={6 + (i % 3) * 4} fill="#0F1830" opacity="0.85" />
                  ))}
                  {[[10, 88], [22, 86], [46, 90], [62, 87], [86, 89]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="0.6" fill="#F6D46A" opacity="0.7" />
                  ))}
                  <path d="M78,10 L88,18" stroke="#FFFDF0" strokeWidth="1" opacity="0.6" />
                </>
              )}
            </svg>
          )}
          {sceneryKey === "scenery_sakura" && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <rect width="100" height="70" fill="#BFE0E8" />
              <rect y="70" width="100" height="30" fill="#8FAE84" opacity="0.6" />
              {[[12, 60, 14], [32, 50, 10], [68, 50, 10], [88, 60, 14]].map(([x, y, r], i) => (
                <g key={i}>
                  <rect x={x - 1.5} y={y} width="3" height={70 - y} fill="#6B4E3D" />
                  <circle cx={x} cy={y - r * 0.5} r={r} fill="#F2C9D3" />
                  <circle cx={x - r * 0.5} cy={y - r * 0.7} r={r * 0.7} fill="#F6D9E2" opacity="0.9" />
                  <circle cx={x + r * 0.5} cy={y - r * 0.7} r={r * 0.7} fill="#EDB8C9" opacity="0.9" />
                </g>
              ))}
              {[[20, 30], [45, 20], [60, 35], [75, 25], [35, 45]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="1" fill="#F2C9D3" opacity="0.8" />
              ))}
              {isGrand && (
                <>
                  <path d="M40,68 L50,30 L60,68 Z" fill="#8FA9C9" opacity="0.5" />
                  <path d="M46,40 L50,32 L54,40 Z" fill="#FBF6EA" opacity="0.7" />
                  {[[50, 62, 9], [58, 68, 8]].map(([x, y, r], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y - r * 0.5} r={r} fill="#F6D9E2" opacity="0.85" />
                    </g>
                  ))}
                  {[[8, 15], [90, 22], [55, 8], [15, 40], [85, 45]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="1" fill="#F2C9D3" opacity="0.75" />
                  ))}
                </>
              )}
            </svg>
          )}
          {sceneryKey === "scenery_italy" && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <rect width="100" height="100" fill="#F6C97A" />
              <circle cx="84" cy="16" r="9" fill="#FFE9A8" opacity="0.85" />
              <rect y="62" width="100" height="38" fill="#7A9AC9" opacity="0.35" />
              {/* トゥルッリ（円錐の石屋根の白い家） */}
              {[[10, 68, 17], [36, 62, 21], [64, 70, 16]].map(([x, y, w], i) => (
                <g key={i}>
                  <rect x={x} y={y} width={w} height={w * 0.85} rx="2" fill="#F6F1E7" stroke="#D9CFB8" strokeWidth="0.6" />
                  <path d={`M${x - 2},${y} Q${x + w / 2},${y - w * 0.9} ${x + w + 2},${y} Z`} fill="#9FA8A0" />
                  {Array.from({ length: 4 }).map((_, j) => (
                    <path key={j} d={`M${x + 2 + j * (w / 12)},${y - 2 - j * (w / 5)} Q${x + w / 2},${y - w * 0.85 + j * (w / 7)} ${x + w - 2 - j * (w / 12)},${y - 2 - j * (w / 5)}`} stroke="#7A8580" strokeWidth="0.5" fill="none" opacity="0.6" />
                  ))}
                  <circle cx={x + w / 2} cy={y - w * 0.88} r="1.2" fill="#5B7FA6" />
                  <rect x={x + w / 2 - 2} y={y + w * 0.42} width="4" height={w * 0.4} fill="#8B6529" opacity="0.75" />
                </g>
              ))}
              {/* 糸杉 */}
              {[86, 92].map((x, i) => (
                <path key={i} d={`M${x},96 L${x},74 Q${x - 2.5},72 ${x},70 Q${x + 2.5},72 ${x},74`} fill="#4A6B4A" opacity="0.85" />
              ))}
              {/* 運河とゴンドラ */}
              <rect y="84" width="100" height="16" fill="#6C9BC4" opacity="0.9" />
              <path d="M55,90 Q63,86 77,90 L75,94 L57,94 Z" fill="#3D2E12" />
              <path d="M77,82 L77,90" stroke="#3D2E12" strokeWidth="1.5" />
              {isGrand && (
                <>
                  <g>
                    <rect x="88" y="66" width="9" height="8" rx="1" fill="#F6F1E7" stroke="#D9CFB8" strokeWidth="0.4" />
                    <path d="M87,66 Q92.5,60 98,66 Z" fill="#9FA8A0" />
                  </g>
                  <ellipse cx="20" cy="20" rx="7" ry="9" fill="#C0454B" opacity="0.8" />
                  <path d="M16,27 L24,27 L22,32 L18,32 Z" fill="#8B6529" opacity="0.7" />
                  <line x1="17" y1="27" x2="18" y2="32" stroke="#8B6529" strokeWidth="0.4" />
                  <line x1="23" y1="27" x2="22" y2="32" stroke="#8B6529" strokeWidth="0.4" />
                </>
              )}
            </svg>
          )}
          {sceneryKey === "scenery_germany" && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <rect width="100" height="100" fill="#BFE0E8" />
              <path d="M0,70 Q30,55 55,66 Q75,75 100,62 L100,100 L0,100 Z" fill="#7A9C70" />
              {/* 針葉樹の森（お城の手前） */}
              {[[12, 78, 12], [22, 82, 10], [78, 80, 11], [90, 84, 9]].map(([x, y, h], i) => (
                <g key={i}>
                  <rect x={x - 1} y={y} width="2" height={h * 0.3} fill="#5A4A3D" />
                  <path d={`M${x - h * 0.35},${y} L${x},${y - h} L${x + h * 0.35},${y} Z`} fill="#3E5A46" opacity="0.85" />
                  <path d={`M${x - h * 0.26},${y - h * 0.3} L${x},${y - h * 0.75} L${x + h * 0.26},${y - h * 0.3} Z`} fill="#4A6B4A" opacity="0.85" />
                </g>
              ))}
              {/* 尖塔のあるお城（ノイシュヴァンシュタイン風） */}
              <rect x="38" y="40" width="24" height="30" fill="#E8E2D4" />
              <rect x="33" y="30" width="9" height="40" fill="#D9D2C0" />
              <path d="M33,30 L37.5,20 L42,30 Z" fill="#7A4A3D" />
              <rect x="58" y="26" width="9" height="44" fill="#D9D2C0" />
              <path d="M58,26 L62.5,16 L67,26 Z" fill="#7A4A3D" />
              <path d="M38,40 L50,28 L62,40 Z" fill="#8B5E3C" />
              <rect x="46" y="50" width="8" height="20" fill="#5A4A3D" opacity="0.8" />
              {isGrand && (
                <>
                  <path d="M0,62 L20,48 L40,58 L58,44 L80,56 L100,46 L100,60 L0,66 Z" fill="#9FB0BA" opacity="0.5" />
                  <ellipse cx="50" cy="88" rx="46" ry="6" fill="#8FA9C9" opacity="0.35" />
                  <path d="M38,70 Q50,66 62,70" stroke="#FFFDF8" strokeWidth="1" opacity="0.4" fill="none" />
                </>
              )}
            </svg>
          )}
          {sceneryKey === "scenery_france" && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              {/* 夕焼け空 */}
              <rect width="100" height="62" fill="#F2C9A8" />
              <rect width="100" height="62" fill="#E896C4" opacity="0.14" />
              <circle cx="76" cy="20" r="10" fill="#FFDCA0" opacity="0.92" />
              {/* セーヌ川 */}
              <rect y="72" width="100" height="28" fill="#8FA9C9" />
              <path d="M0,75 Q25,72 50,75 Q75,78 100,74" stroke="#FFFDF8" strokeWidth="1" fill="none" opacity="0.4" />
              {/* オスマン様式の建物（マンサード屋根） */}
              {[[3, 48, 17], [70, 50, 19], [86, 53, 13]].map(([x, y, w], i) => (
                <g key={i}>
                  <rect x={x} y={y} width={w} height={72 - y} fill="#E8D9C4" />
                  <path d={`M${x - 1},${y} L${x + w / 2},${y - 8} L${x + w + 1},${y} Z`} fill="#5A6B7A" />
                  {Array.from({ length: 3 }).map((_, r) => (
                    <rect key={r} x={x + 3} y={y + 6 + r * 9} width="4" height="6" fill="#7A8FA6" opacity="0.6" />
                  ))}
                </g>
              ))}
              {/* 石造りのアーチ橋 */}
              <path d="M25,72 Q50,58 75,72" stroke="#D9CFB8" strokeWidth="5" fill="none" />
              <path d="M25,72 Q50,62 75,72" stroke="#C4B896" strokeWidth="2" fill="none" opacity="0.6" />
              {Array.from({ length: 5 }).map((_, i) => <line key={i} x1={30 + i * 10} y1="68" x2={30 + i * 10} y2="72" stroke="#B8AA88" strokeWidth="1" opacity="0.5" />)}
              {/* エッフェル塔（装飾的なシルエット） */}
              <g transform="translate(46,8)">
                <path d="M4,10 L8,50 L11,50 L6,10 Z" fill="#3D2E12" opacity="0.9" />
                <path d="M4,10 L0,50 L-3,50 L2,10 Z" fill="#3D2E12" opacity="0.9" />
                <path d="M-2,50 L10,50 L7,62 L1,62 Z" fill="#3D2E12" opacity="0.9" />
                <path d="M1,62 L7,62 L5,80 L3,80 Z" fill="#3D2E12" opacity="0.9" />
                <line x1="-1" y1="28" x2="9" y2="28" stroke="#3D2E12" strokeWidth="1.2" opacity="0.7" />
                <line x1="-2.5" y1="46" x2="10.5" y2="46" stroke="#3D2E12" strokeWidth="1.2" opacity="0.7" />
                <circle cx="4" cy="8" r="1.2" fill="#F6D46A" opacity="0.85" />
              </g>
              {/* 並木道 */}
              {[9, 91].map((x, i) => (
                <g key={i}>
                  <rect x={x - 1} y="78" width="2" height="14" fill="#5A4A3D" />
                  <circle cx={x} cy="76" r="6" fill="#7A9C70" />
                </g>
              ))}
              {isGrand && (
                <>
                  <ellipse cx="18" cy="16" rx="6" ry="8" fill="#C0454B" opacity="0.8" />
                  <path d="M14,23 L22,23 L20,28 L16,28 Z" fill="#8B6529" opacity="0.7" />
                  <rect x="60" y="52" width="10" height="20" fill="#E8D9C4" opacity="0.7" />
                  <path d="M59,52 L65,45 L71,52 Z" fill="#5A6B7A" opacity="0.7" />
                </>
              )}
            </svg>
          )}
          {isBamboo && (
            <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              {[[20, 15, 70, 30], [75, 20, 30, 65], [15, 78, 65, 92], [10, 40, 25, 88]].map((d, i) => (
                <line key={i} x1={d[0]} y1={d[1]} x2={d[2]} y2={d[3]} stroke="#D9CFB0" strokeWidth="0.8" opacity="0.6" />
              ))}
              <circle cx="50" cy="50" r="46" fill="none" stroke="#D9CFB0" strokeWidth="1" opacity="0.4" />
            </svg>
          )}
          {windowShape.muntin === "cross" && (
            <>
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: windowFrameColor, opacity: 0.8, transform: "translateX(-50%)" }} />
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: windowFrameColor, opacity: 0.8, transform: "translateY(-50%)" }} />
              {isGrand && (
                <>
                  <div style={{ position: "absolute", left: "25%", top: 0, bottom: 0, width: 1.5, background: windowFrameColor, opacity: 0.6 }} />
                  <div style={{ position: "absolute", left: "75%", top: 0, bottom: 0, width: 1.5, background: windowFrameColor, opacity: 0.6 }} />
                </>
              )}
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
        <DraggableItem
          left={(equipped.furniturePositions || {}).furniture_rug ?? FURNITURE_LAYOUT.furniture_rug.left}
          top={FURNITURE_LAYOUT.furniture_rug.top} width={FURNITURE_LAYOUT.furniture_rug.width} z={FURNITURE_LAYOUT.furniture_rug.z}
          editMode={editMode} transform="translate(-50%, -50%)"
          onDragEnd={(nl) => onUpdatePosition && onUpdatePosition("furniture", "furniture_rug", nl)}
        >
          <RugIcon />
        </DraggableItem>
      )}

      <PositionedCharacter equipped={equipped} size={92} leftPct={leftPct} topPct={topPct} facingLeft={facingLeft} isWalking={isWalking} isSitting={isSitting} isLying={isLying} />

      {placedFurniture.filter((k) => k !== "furniture_rug").map((k) => {
        const Icon = FURNITURE_ICON[k];
        const layout = FURNITURE_LAYOUT[k];
        const customLeft = (equipped.furniturePositions || {})[k];
        return (
          <DraggableItem key={k}
            left={customLeft ?? layout.left} top={layout.top} width={layout.width} z={layout.z}
            editMode={editMode}
            onDragEnd={(nl) => onUpdatePosition && onUpdatePosition("furniture", k, nl)}
          >
            <Icon />
          </DraggableItem>
        );
      })}

      {placedFurniture.length > 0 && (
        <button type="button" onClick={() => setEditMode((v) => !v)}
          className="absolute bottom-2 right-2 text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: editMode ? C.curtain : "rgba(255,253,248,0.9)", color: editMode ? "#FFFDF8" : C.ink, border: `1px solid ${C.line}`, zIndex: 10 }}>
          {editMode ? t("btnDoneArranging") : t("btnArrangeItems")}
        </button>
      )}
    </div>
  );
}

// ===== 庭のシーン =====
function GardenScene({ equipped, owned, onUpdatePosition, t }) {
  const [editMode, setEditMode] = useState(false);
  const placedList = equipped.garden || [];
  const placedOrnaments = placedList.filter((k) => GARDEN_ICON[k]);
  const hasField = placedOrnaments.includes("garden_field");
  const { leftPct, topPct, facingLeft, isWalking, isFarming, birds, pkg } = useGardenLife(50, 80, 22, 6, hasField);
  const mountainTier = equipped.backdrop === "backdrop_mountains_huge" ? "huge" : equipped.backdrop === "backdrop_mountains_near" ? "near" : "default";

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

      {/* 遠くの緑の山々（backdrop_mountains_near / huge を装備すると、大きく・近く見える） */}
      <div style={{
        position: "absolute", left: 0, right: 0,
        bottom: mountainTier === "huge" ? "8%" : mountainTier === "near" ? "18%" : "22%",
        height: mountainTier === "huge" ? "88%" : mountainTier === "near" ? "46%" : "24%",
        zIndex: 0, transition: "height 0.4s ease, bottom 0.4s ease"
      }}>
        <svg viewBox="0 0 400 90" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M0,90 L40,30 L90,60 L140,15 L190,55 L240,25 L290,58 L340,20 L400,50 L400,90 Z" fill="#9FBFA0" opacity="0.6" />
          <path d="M0,90 L60,50 L120,70 L180,40 L250,68 L320,42 L400,65 L400,90 Z" fill="#7FA582" opacity="0.8" />
          {(mountainTier === "near" || mountainTier === "huge") && (
            <path d="M0,90 L50,44 L100,66 L160,38 L220,64 L280,40 L340,62 L400,48 L400,90 Z" fill="#5E8A5E" opacity="0.92" />
          )}
          {mountainTier === "huge" && (
            <>
              <path d="M0,90 L30,20 L70,50 L110,10 L150,46 L190,18 L230,52 L270,16 L310,48 L350,14 L400,40 L400,90 Z" fill="#4A6B4A" opacity="0.96" />
              {/* 岩肌の質感（すぐそばまで迫った山の地肌を思わせる筋） */}
              {Array.from({ length: 10 }).map((_, i) => (
                <path key={i} d={`M${i * 42 + 10},90 L${i * 42 + 4},${40 + (i % 3) * 8}`} stroke="#3A5238" strokeWidth="2" opacity="0.35" />
              ))}
            </>
          )}
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
        <div style={{ position: "absolute", left: "95%", top: "98%", width: "9%", transform: "translate(-50%, -100%)", zIndex: 4 }}>
          <PackageIcon />
        </div>
      )}

      {placedOrnaments.map((k) => {
        const Icon = GARDEN_ICON[k];
        const layout = GARDEN_LAYOUT[k];
        const customLeft = (equipped.gardenPositions || {})[k];
        return (
          <DraggableItem key={k}
            left={customLeft ?? layout.left} top={layout.top} width={layout.width} z={layout.z}
            editMode={editMode}
            onDragEnd={(nl) => onUpdatePosition && onUpdatePosition("garden", k, nl)}
          >
            <Icon />
          </DraggableItem>
        );
      })}

      <PositionedCharacter equipped={equipped} size={100} leftPct={leftPct} topPct={topPct} facingLeft={facingLeft} isWalking={isWalking} isFarming={isFarming} />

      {placedOrnaments.length > 0 && (
        <button type="button" onClick={() => setEditMode((v) => !v)}
          className="absolute bottom-2 right-2 text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: editMode ? C.curtain : "rgba(255,253,248,0.9)", color: editMode ? "#FFFDF8" : C.ink, border: `1px solid ${C.line}`, zIndex: 10 }}>
          {editMode ? t("btnDoneArranging") : t("btnArrangeItems")}
        </button>
      )}
    </div>
  );
}

export default function CharacterHome({ entries, ownedKeys, equipped, pointsSpent, onPurchase, onEquip, onTogglePlacement, onUpdatePosition, t }) {
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
          ? <RoomScene equipped={equipped} owned={ownedKeys} onTogglePlacement={onTogglePlacement} onUpdatePosition={onUpdatePosition} t={t} />
          : <GardenScene equipped={equipped} owned={ownedKeys} onUpdatePosition={onUpdatePosition} t={t} />}
        {(equipped.furniture || []).length > 0 || (equipped.garden || []).length > 0 ? (
          <p className="text-xs mt-2 text-center" style={{ color: C.inkSoft }}>{t("noteDragToArrange")}</p>
        ) : null}
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
            const isPlaced = isMultiSlot ? (equipped[item.category] || []).includes(item.key) : false;
            const isEquipped = isMultiSlot ? isPlaced : equipped[item.category] === item.key;
            const canAfford = balance >= item.cost;
            const sizeLimit = item.size ? PLACEMENT_LIMITS[item.size] : null;
            const placedOfSameSize = isMultiSlot && item.size
              ? (equipped[item.category] || []).filter((k) => {
                  const other = SHOP_ITEMS.find((i) => i.key === k);
                  return other && other.size === item.size;
                }).length
              : 0;
            const limitReached = isMultiSlot && item.size && !isPlaced && placedOfSameSize >= sizeLimit;
            return (
              <div key={item.key} className="flex items-center justify-between rounded-xl p-2.5" style={{ background: C.paper }}>
                <div className="flex items-center gap-3">
                  <ShopItemPreview item={item} />
                  <div>
                    <div className="text-sm font-medium">{t(item.nameKey)}</div>
                    {!owned && <div className="text-xs ff-mono" style={{ color: item.cost === 0 ? C.sage : C.inkSoft, fontWeight: item.cost === 0 ? 600 : 400 }}>{item.cost === 0 ? t("labelFreeNow") : `${item.cost}pt`}</div>}
                    {owned && limitReached && <div className="text-xs" style={{ color: C.rust }}>{t("noteLimitReached")}</div>}
                  </div>
                </div>
                {owned ? (
                  isMultiSlot ? (
                    <button type="button" disabled={limitReached} onClick={() => onTogglePlacement(item.category, item.key)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ background: isPlaced ? C.sage : (limitReached ? C.line : C.card), color: isPlaced ? "#FFFDF8" : C.inkSoft, border: `1px solid ${isPlaced ? C.sage : C.line}`, opacity: limitReached ? 0.6 : 1 }}>
                      {isPlaced ? t("btnPutAway") : t("btnPlace")}
                    </button>
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
