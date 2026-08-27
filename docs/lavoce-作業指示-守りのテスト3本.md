# La Voce ／ 守りのテスト3本（自動実装を安全に回すための土台）

**Claude Sonnet 5 へ。実装を止めて、この3本のテストを先に入れてください。**

**理由：坂本さんはアプリの画面を見て確認していますが、
この製品の重要な要件の多くは画面に映りません。**

```
・教師向けのレスポンスに、周期や食事と就寝のデータが混ざっていないか
・書き出しが、無料のまま使えるか
・3ゲートを通っていないのに、分析の文章が出ていないか
```

**3つとも、画面を見ても分かりません。そして間違えたときの被害が最大級です。**
自動でどんどん実装を進めるほど、この3本が要ります。

作業量は**半日**です。

---

## 1. まず調べて報告してください（実装の前）

**私の書いたコードは、この製品のファイル構成を知らずに書いています。**
そのまま貼らず、まず次を報告してください。

```
□ テストの基盤は何か（vitest / jest / node:test）
□ テストファイルの置き場所と命名規則（例: __tests__/*.test.js）
□ npm scripts の一覧（test / lint / typecheck）
□ 表示ゲートの関数はどこにあるか（lib/displayGates.js の export 名）
□ 書き出しのエンドポイントのパス（例: app/api/export/route.js）
□ 教師が生徒を取得するエンドポイントと関数名
□ 共有カード（OG画像）の生成箇所
□ テスト用にユーザーを作る仕組みがあるか（なければ、どう作るのが自然か）
```

**報告のあと、下のコードを「この製品に合わせて書き直して」ください。**
そのまま貼るのではなく、**意図を保ったまま実装に合わせること。**

---

## 2. 共通のヘルパー

```js
// tests/helpers/forbidden.js

/** JSON のどの深さにあるキーでも、全部集める */
export function collectKeys(value, out = new Set()) {
  if (Array.isArray(value)) {
    for (const v of value) collectKeys(v, out)
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      out.add(k)
      collectKeys(v, out)
    }
  }
  return out
}

/** JSON の中の文字列を全部集める（値の中に混ざる事故を拾う） */
export function collectStrings(value, out = []) {
  if (Array.isArray(value)) {
    for (const v of value) collectStrings(v, out)
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectStrings(v, out)
  } else if (typeof value === 'string') {
    out.push(value)
  }
  return out
}

/**
 * ★他人に渡してはいけない領域のキー。
 * ここに足すことはあっても、消すことはありません。
 */
export const FORBIDDEN_KEYS = [
  // 周期（周期記録の設計.md §2）
  'cyclePeriod', 'cyclePeriods', 'cycleSetting', 'cycleSettings',
  'startDate', 'endDate', 'bleedingDays', 'cycleLength',
  'dayIndex', 'phase', 'cyclePhase', 'hormonalTreatment',
  'trackCycle', 'track_cycle',
  // 食事と就寝（食事と就寝の設計.md §2）
  'mealSleepLog', 'mealSleepLogs', 'refluxSetting', 'refluxMarker',
  'lastMealAt', 'bedAt', 'gapMinutes', 'refluxFlags',
  // 振り返り（レッスンモードの解体.md §5-5）
  'feel', 'reflectionFeel',
]

/** 値の中に紛れ込んだら困る語（日本語UIの文字列が混ざる事故を拾う） */
export const FORBIDDEN_SUBSTRINGS = [
  '生理', '月経', '周期日目', '逆流', '就寝時刻', '最後に食べた',
]
```

**★`startDate` `endDate` のような一般的な名前が入っているのは意図的です。**
周期のテーブルをそのまま join して返す事故が、いちばん起きやすい形だからです。
**もし他の用途で同じ名前を使っていて誤検知するなら、
「他の用途の名前を変える」ほうを選んでください。**

---

## 3. テスト①｜他人のレスポンスに混ざらない

```js
// tests/guard-leak.test.js
import { describe, it, expect, beforeAll } from 'vitest'   // ← jest なら読み替え
import { collectKeys, collectStrings,
         FORBIDDEN_KEYS, FORBIDDEN_SUBSTRINGS } from './helpers/forbidden'

// ★このセットアップは、この製品の作り方に合わせて書き直してください。
//   ・生徒ユーザーを1人作る
//   ・その生徒に、周期と食事と就寝の記録を1件ずつ入れる（★入っていないと素通りする）
//   ・担当教師を1人作り、生徒に割り当てる
//   ・教室のオーナーを1人作る
let ctx
beforeAll(async () => { ctx = await seedStudentTeacherOrg() })

function assertClean(payload, label) {
  const keys = collectKeys(payload)
  const hitKeys = FORBIDDEN_KEYS.filter(k => keys.has(k))
  expect(hitKeys, `${label} に禁止キーが含まれています`).toEqual([])

  const text = collectStrings(payload).join('\n')
  const hitWords = FORBIDDEN_SUBSTRINGS.filter(w => text.includes(w))
  expect(hitWords, `${label} の値に禁止語が含まれています`).toEqual([])
}

describe('要配慮情報が本人以外に出ない', () => {
  it('担当教師が生徒を取得しても、周期と食事と就寝が含まれない', async () => {
    const res = await fetchAsTeacher(ctx.teacher, `/api/students/${ctx.student.id}`)
    expect(res.status).toBe(200)
    assertClean(await res.json(), '教師の生徒取得')
  })

  it('教師が生徒一覧を取得しても含まれない', async () => {
    const res = await fetchAsTeacher(ctx.teacher, '/api/students')
    assertClean(await res.json(), '教師の生徒一覧')
  })

  it('教室のオーナーが取得しても含まれない', async () => {
    const res = await fetchAsUser(ctx.owner, `/api/org/${ctx.org.id}/members`)
    assertClean(await res.json(), '教室オーナーの取得')
  })

  it('共有カードの生成に、要配慮情報が渡らない', async () => {
    const html = await renderShareCard(ctx.student.id)   // ★OG画像の元になるHTML
    for (const w of FORBIDDEN_SUBSTRINGS) {
      expect(html.includes(w), `共有カードに「${w}」が含まれています`).toBe(false)
    }
  })

  it('★本人は、自分の周期を取得できる（守りすぎていないことの確認）', async () => {
    const res = await fetchAsUser(ctx.student, '/api/me/cycle')
    expect(res.status).toBe(200)
    const keys = collectKeys(await res.json())
    expect(keys.has('startDate')).toBe(true)
  })
})
```

**★最後の1本を省略しないでください。**
「全部返さない」実装にしてしまうと、テストは通りますが製品が壊れます。

---

## 4. テスト②｜書き出しは無料のまま

```js
// tests/guard-export-free.test.js
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('データの書き出しは、支払いの有無にかかわらず使える', () => {
  it('無料プランのユーザーが書き出せる', async () => {
    const user = await createUser({ plan: 'free' })
    await seedSomeRecords(user)
    const res = await fetchAsUser(user, '/api/export')
    expect(res.status, '無料ユーザーの書き出しが拒否されています').toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.entries) || typeof body === 'object').toBe(true)
    expect(JSON.stringify(body).length).toBeGreaterThan(2)   // 空を返していない
  })

  it('無料プランのユーザーがアカウントを削除できる', async () => {
    const user = await createUser({ plan: 'free' })
    const res = await fetchAsUser(user, '/api/account/delete', { method: 'POST' })
    expect([200, 202]).toContain(res.status)
  })

  it('★書き出しの実装が、プラン判定を参照していない（静的検査）', () => {
    // ★実際のパスに直してください
    const file = path.join(process.cwd(), 'app/api/export/route.js')
    const src = fs.readFileSync(file, 'utf8')
    for (const forbidden of ['can(', 'requirePlan', 'requirePremium', 'isPremium']) {
      expect(
        src.includes(forbidden),
        `書き出しの実装に ${forbidden} が入っています。法定の権利なので、支払いで制限できません`
      ).toBe(false)
    }
  })
})
```

**3本目の静的検査が本体です。**
G3.2 で課金を実装したときに、**うっかり書き出しを囲む事故**を機械的に止めます。

---

## 5. テスト③｜ゲートを通っていないのに文章を出さない

```js
// tests/guard-display-gate.test.js
import { describe, it, expect } from 'vitest'
import { evaluateGate } from '../lib/displayGates'   // ★実際の export 名に合わせる

// ★戻り値の形は実装に合わせて読み替えてください。
//   ここでは { pass: boolean, sentence: string|null } を想定しています。
const base = { nA: 20, nB: 20, effectSize: 0.6, q: 0.02 }

describe('表示ゲート', () => {
  it('件数・効果量・多重比較を全部満たせば通る', () => {
    const r = evaluateGate(base)
    expect(r.pass).toBe(true)
  })

  it('★件数が9なら通らない（10未満）', () => {
    const r = evaluateGate({ ...base, nA: 9 })
    expect(r.pass).toBe(false)
    expect(r.sentence ?? null).toBeNull()
  })

  it('★片方の群が空でも通らない', () => {
    const r = evaluateGate({ ...base, nB: 0 })
    expect(r.pass).toBe(false)
  })

  it('★効果量が 0.39 なら通らない（0.4 未満）', () => {
    const r = evaluateGate({ ...base, effectSize: 0.39 })
    expect(r.pass).toBe(false)
    expect(r.sentence ?? null).toBeNull()
  })

  it('★q が 0.11 なら通らない（0.10 以上）', () => {
    const r = evaluateGate({ ...base, q: 0.11 })
    expect(r.pass).toBe(false)
    expect(r.sentence ?? null).toBeNull()
  })

  it('★通らないとき、数値も返さない', () => {
    const r = evaluateGate({ ...base, nA: 9 })
    expect(r.effectSizeText ?? null).toBeNull()
    expect(r.qText ?? null).toBeNull()
  })

  it('★境界：n=10 / |g|=0.40 / q=0.099 は通る', () => {
    expect(evaluateGate({ nA: 10, nB: 10, effectSize: 0.40, q: 0.099 }).pass).toBe(true)
  })

  it('効果量は絶対値で判定する（負の値でも通る）', () => {
    expect(evaluateGate({ ...base, effectSize: -0.6 }).pass).toBe(true)
  })
})
```

**「通らないとき、数値も返さない」を省略しないでください。**
文章を止めても数字が出ていれば、読む人は同じ結論に至ります。

---

## 6. CI に入れる

```json
// package.json（例）
{
  "scripts": {
    "test": "vitest run",
    "test:guard": "vitest run tests/guard-*.test.js",
    "verify": "npm run lint && npm run test"
  }
}
```

```yml
# .github/workflows/verify.yml（例）
name: verify
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run test
```

**★`guard-*` を skip / only で飛ばせないようにしてください。**
急いでいるときに、いちばん飛ばしたくなるのがここです。

---

## 7. ★禁止事項

```
1. ★スナップショットテストにしない
   （中身が変わってもスナップショットを更新して通してしまう）
2. ★禁止キーの一覧から項目を消さない（増やすのはよい）
3. ★誤検知が出たとき、テストを緩めない。実装側の名前を変える
4. guard-*.test.js を skip / only にしない
5. 「本人は取得できる」テスト（§3 の最後）を消さない
6. 書き出しの静的検査を、コメントアウトで回避しない
7. ゲートの閾値をテスト側で変えない（n≥10 / |g|≥0.4 / q<0.10）
```

---

## 8. 確認

```
□ わざと壊すと、3本ともちゃんと落ちる
   ・教師のクエリに周期の列を1つ足す → ①が落ちる
   ・書き出しに requirePremium を足す → ②が落ちる
   ・ゲートの n の閾値を 5 に下げる → ③が落ちる
□ 直すと、3本とも通る
□ npm run verify で全部走る
□ CI で走っている
```

**★「わざと壊して落ちること」を必ず確認してください。**
通っているだけのテストは、何も守っていないことがあります。

---

## 9. Sonnet への依頼のコツ

**このテストは、坂本さんの目の代わりです。**

自動で実装を進めるほど、**画面に映らない要件が壊れていないか**を
人が確認できなくなります。この3本があれば、そこだけは機械が見ています。

**実装のあと、報告に次を含めてください。**

```
・3本のテストが通っていること
・わざと壊したときに落ちることを確認したこと（★どう壊したかも書く）
・禁止キーの一覧に足したものがあれば、その理由
```
