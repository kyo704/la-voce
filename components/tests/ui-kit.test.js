#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");
const src = readRaw("lib", "uiKit.js");
let failed = 0;
const ok = (v, s) => { if (v) console.log("  ✓ " + s); else { console.log("  ✗ " + s); failed++; } };
ok(/export const FONT_STACK/.test(src), "共通フォントを持つ");
ok(/export function rem\(px\)/.test(src), "文字サイズをremにする");
ok(/export const TYPE =/.test(src) && /note:/.test(src), "共通文字設定を持つ");
ok(/export const RADIUS =/.test(src) && /pill: 99/.test(src), "角丸を一か所で持つ");
ok(/export const SPACE =/.test(src) && /TAB_BAR_HEIGHT = 56/.test(src), "余白と帯の高さを持つ");
ok(/SHEEP_WIDTH_RATIO/.test(src) && /function sheepCssSize/.test(src), "羊の大きさを共通化");
ok(!/fontSize:\s*\d+[,}]/.test(src), "文字サイズをpx直書きしない");
ok(readRaw("components", "UiV2.jsx").includes("TYPE.note"), "共通注記が実際に使われる");
process.exit(failed ? 1 : 0);
