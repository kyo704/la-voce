# 修正の記録 No.025 ── 「生徒を招待する」の入口を、もっとに置く
全152行 / 末尾は「実機でお確かめください。」

- 日付 … 2026-09-15
- 調べ … `docs/reports/2026-09-15-招待の入口が無い.md`
- 裁定 … Opus「★RULING: ㋒. add the row to もっと」

## 1. 何が起きていたか

★入口が1つもありませんでした。押せないのではなく、たどり着けません。

札は `activeTab === "lesson"` の中にしかありません。
そして門の中の帯（`TABS_V2_ORDER`）に `lesson` がありません。

「入口はホームに2つ残ります」と書いてありましたが、その2つは
レッスンが**1件でもある**ときだけ出ます
（`lib/todayBand.js`「該当がなければ その行は出ない」）。

```
生徒0人 → レッスン0件 → 行が出ない → タブへ行けない
       → 招待できない → 生徒0人のまま
```

★しくみは壊れていません。`handleGenerateTeacherInvite` も
`teacher_invitations` への insert も、前からあります。**道だけが無くなっていました。**

## 2. なぜ ㋒ なのか

| 印 | 何 | なぜ採らないか |
|---|---|---|
| ㋓ | 帯に `lesson` を戻す | 見本の帯は5つで固定（2026-09-09・§9） |
| ㋔ | レッスン0件でも札を出す | 「無いことを毎朝知らせない」に触れる |
| ㋒ | もっとに行を足す | ★どちらにも触れません |

★同じ形を、生徒の側で1度解いています（`lib/featureFlags.js:37-47`）──
「場所を移しただけで、鶏と卵は解けていなかった」。
前回の答えも「もっとへ移す」でした。同じ形です。

## 3. 「見本にない行を足す」ことについて

見本 `SC['もっと']` の9行に、この行はありません。

★裁定 ──

> the mock's もっと 9 rows were copied from the ★outside-the-gate screen,
> where `lesson` IS in the tab bar.
> the mock never modelled a state where lesson is absent from the bar.
> 「見本が正」means ★do not change what the mock shows.
> filling a state the mock does not cover is ★completion, not change

★そのうえで、**見本のほうにも同じ行を足しました**。
片方だけ直すと、次に見くらべた人がまた悩みます。

- `docs/design/pack-final/00-動く見本（さわれる・全画面）.html`
- `docs/design/pack-final/00-動く見本-iPhoneで開く用.html`

★見本には `teacher_beta_access` にあたる印がありません。
だから、いつも出る形で描き、その旨をその場に書きました。

★★はじめ、見本に `teach()` という判定を書きました。
見本にそんな関数はありません。私が作ったものです。
**取り消して、機構を作らない形に直しました。**

## 4. 入れたもの

`lib/moreMenu.js`

```js
{ key: "招待", label: "生徒を 招待する", right: null, group: "教室" }
```

```js
if (key === "招待") return !!opt.canInvite;
```

`components/VocalTracker.jsx`

```js
canInvite: canSeeBetaFeatures(profile)
```

```js
if (r.key === "招待") {
  setLessonRoleChoice("teach");
  setActiveTab("lesson");
  return;
}
```

### ★見ているのは1つだけ

`canSeeBetaFeatures(profile)`（= `is_admin || teacher_beta_access`）。

★`activeTab` も `lessonRole` も見ません。**あの2つが詰まりの元でした。**

### ★持っていない方には、出しません

押せない札を置きません（§8⑤）。
一覧そのものから消えます。見張りが両方を確かめます。

### ★「教える」側を立てます

既定は「教える」ですが（`resolveLessonRole`）、一度「習う」を選んだ方は
そのままです。招待を押したのに習う側が出るのはおかしいので、
行き先で `setLessonRoleChoice("teach")` を立てます。

## 5. ★混ぜなかったもの

「教室に招く」（`org_invitations`・㋑）は、**足していません**。

★裁定 ──「★DO NOT add ㋑ to もっと in this change。
one row, one problem。★report separately if it is also unreachable」

あちらは owner/admin の教室を持っていることが要ります。別の条件です。

★いまの見立て … ㋑ も同じ場所（`activeTab === "lesson"`）にあるので、
**同じように たどり着けません**。ただし条件が1つ多いため、
別の欠陥として別に報告します。

## 6. 見張り

`components/tests/invite-entry.test.js`（26本）。

★**札が在るか**ではなく、★**道が在るか**を見ます。

1. もっとに行があること
2. 出す・出さないが1つの条件で決まること（★押せない札にしないこと）
3. 画面が `canSeeBetaFeatures` だけで決めていること
4. 押した先があること（★しくみが生きていること）
5. ㋑ を混ぜていないこと
6. ★見本にも同じ行があること（2本とも）
7. ★詰まりの元が戻っていないこと（帯は5つのまま／「無いことを毎朝知らせない」）

### 較正（★わざと壊して、落ちることを確かめました）

| 壊しかた | 落ちた本数 |
|---|---|
| 行ごと消す（★詰まりの元の姿） | 4 |
| 押せない札にする | 3 |
| `activeTab` を条件に戻す | 1 |
| 押した先を消す | 3 |
| 見本だけ直さない | 1 |
| 帯に `lesson` を戻す | 1 |

## 7. たしかめ

- `npm run lint` … エラーなし
- `npm run build` … ✓ Compiled successfully
- 見張り … 通り307／落ち10（落ちた10本は、もとから落ちているものです）

コードに入れました。見張りは通りました。見た目は未確認です。
実機でお確かめください。
