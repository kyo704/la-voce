# 基準画（2026-09-26）

実装 自身の「前の 絵」です。見本では ありません。
`tools/pixel_gate.py --baseline` が、今の 実装を 撮って ここの 絵と 1画素まで くらべます。

## ★いちばん 大事な こと（Opus Q5）

**同じ 環境で 撮った 2枚 どうし でしか 意味を 持ちません。**

- 環境 ＝ 台（OS）・見るもの（chrome の 版）・横・縦・倍・時計・言葉・時刻帯・色・切る ところ。
- 各 `<名>.json` の `名札` に 撮った ときの 環境が あります。
- 今の 環境と 1つでも 違えば、その 基準画は **無効** です。道具は くらべずに 止まります。
- chrome が 上がった／別の 機械で 動かす ときは、`--update-baseline` で 撮り直します。
- 試しの 台帳の 行（届いたもの の 中身 など）が 変われば、画面も 変わります。それも 差に 出ます。

2026-09-26 に 撮った 環境 …… darwin 21.6.0 ／ chrome 150.0.7871.125 ／ 390×844 ／ 倍 3 ／
時計 2026-09-26T10:00:00+09:00 ／ ja-JP ／ Asia/Tokyo ／ light ／ `main` を 切り取り。
台は `http://localhost:3100`（試しの 台帳・E2E_LOCAL の 人）。

## 使い方

```
python3 tools/pixel_gate.py --check-all                  # 基準画の ある 画面 すべて。まとめ 4組 と reports/ の 紙
python3 tools/pixel_gate.py --baseline 届いたもの        # くらべる
python3 tools/pixel_gate.py --baseline --all
python3 tools/pixel_gate.py --update-baseline 区切り     # 作る／替える
```

- くらべる 前に 必ず 較正します（`pixel_lint.calibrate` ＋ 覆いの 外の 1画素を 1 だけ 変えた 写し）。
  差 1 を 見つけられなければ、くらべません。
- 替える ときは 2回 撮り、2枚が 差 0 で なければ 替えません（揺れる 絵は 基準に しません）。
- 前の 基準画が あれば、前後の 差（画素数・率・差の 絵）を 出し、`yes` と 打たれた ときだけ 上書きします。

## 作業用の 木（`la-voce-sub3` など）から 動かす とき

作業用の 木には `node_modules` と `.env.e2e` が ありません（`.env.e2e` は git に 入りません）。
写しは 作らず、本体の 木を 指します。

```
NODE_PATH=/Users/sakamotokyou/Desktop/la-voce/node_modules \
LAVOCE_E2E_ENV=/Users/sakamotokyou/Desktop/la-voce/.env.e2e \
python3 tools/pixel_gate.py --baseline --all
```

- `NODE_PATH` …… `playwright` を 見つける ため（`tools/baseline_shot.js` が 使う）。
- `LAVOCE_E2E_ENV` …… 入る 人と 口（`E2E_LOCAL_URL`）を 読む ため（`tools/personal_nav.js` が 読む）。
- 台（`E2E_LOCAL_URL`、2026-09-26 は `http://localhost:3100`）が 立って いる ことが 前提です。

## まとめの 4組（`--check-all`）

- `OK` …… 差 0
- `DIFF` …… 差 1 以上、または 大きさが 違う（差の 絵は `_diff/<名>-差.png`）
- `NO_BASELINE` …… 行き方は あるが 基準画が 無い
- `SKIPPED` …… 撮れない（3回 撮り直して だめ）・環境が 違う（無効）・較正が 落ちた

記録は `reports/<年-月-日-時分>.md`。その 時の 記録 なので、後から 直しません。

## 画面の 行き方

- 見本と くらべる 画面 …… `tools/dom_personal_map.json`（こちらが 先）
- 基準画 だけ の 画面 …… `tools/baseline_map.json`
  - `bundle` ＋ `row` …… もっと の 束を 開いて 行を 押す
  - `row` だけ …… もっと の いちばん 上の 一覧で 押す
  - `tab` …… 下の 帯を 押す
  - `steps` …… 着いた 画面で さらに 押す 札の 字
- 外した 画面と その わけは `tools/baseline_map.json` の `★決め` に あります
  （揺れる 画面・押した 先が 違った 画面・`main` の 外に 中身が ある 画面）。

## 覆い（くらべない ところ）

- 「バージョン … 最終更新 …」の 字 …… `NEXT_PUBLIC_BUILD_AT` は 立ち上げ ごとに 変わります。
  覆いの 箱は `<名>.json` の `覆い` に あり、くらべる たびに 必ず 画面に 出します。

## 置き場

- `<名>.png` ＋ `<名>.json` …… 基準画と 名札（git に 入れます）
- `_now/` …… 今回 撮った 絵 ／ `_diff/` …… 差の 絵（git に 入れません）
