#!/usr/bin/env node
const { readCode } = require("./_source");
const src = readCode("components", "TabBarV2.jsx");
let failed = 0;
const ok = (v, s) => { if (v) console.log("  ✓ " + s); else { console.log("  ✗ " + s); failed++; } };
ok(/position: "fixed"/.test(src) && /bottom: 0/.test(src), "画面下に固定");
ok(/height: TAB_BAR_HEIGHT/.test(src), "高さを共通定数から取る");
ok(/flex: "1 1 0"/.test(src) && /minWidth: 0/.test(src), "タブを等分して切れを防ぐ");
ok(/aria-label=\{label\}/.test(src), "帯に名前を付ける");
ok(/aria-current=\{on \? "page" : undefined\}/.test(src), "選択中を示す");
ok(/type="button"/.test(src) && /onSelect\(tab\.key\)/.test(src), "タブ操作をbuttonで行う");
ok(/height: 2/.test(src) && /background: on \? C\.curtain/.test(src), "選択線を表示");
ok(/if \(list\.length === 0\) return null/.test(src), "空の帯は表示しない");
process.exit(failed ? 1 : 0);
