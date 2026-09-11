#!/usr/bin/env node
const { readCode } = require("./_source");
const src = readCode("components", "BottomSheet.jsx");
let failed = 0;
const ok = (v, s) => { if (v) console.log("  ✓ " + s); else { console.log("  ✗ " + s); failed++; } };
ok(/role="dialog"/.test(src) && /aria-modal="true"/.test(src), "ダイアログとして出す");
ok(/position: "fixed"/.test(src) && /bottom: 0/.test(src), "下から固定表示");
ok(/maxHeight: "82%"/.test(src) && /overflowY: "auto"/.test(src), "高さ制限とスクロール");
ok(/Escape/.test(src) && /closeRef\.current/.test(src), "Escapeで閉じる");
ok(/document\.body\.style\.overflow = "hidden"/.test(src), "背後のスクロールを止める");
ok(/closeLabel === null \? null/.test(src), "下部ボタンを任意に消せる");
ok(/export function SheetNote/.test(src) && /export function Pills/.test(src), "共通部品を提供");
process.exit(failed ? 1 : 0);
