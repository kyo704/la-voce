"use client";

import { useState } from "react";
import { BookOpen, AlertCircle, Wind, Dumbbell, Ruler, ChevronDown } from "lucide-react";
import { C } from "@/lib/tokens";

function Section({ title, icon: Icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.card }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left"
      >
        <span className="flex items-center gap-2">
          <Icon size={18} style={{ color: C.curtain }} />
          <span className="ff-display italic text-lg">{title}</span>
        </span>
        <ChevronDown
          size={18}
          style={{ color: C.inkSoft, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-5 text-sm leading-relaxed space-y-3" style={{ color: C.ink }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Note({ children }) {
  return (
    <p className="text-xs rounded-xl p-3" style={{ background: C.paper, color: C.inkSoft, lineHeight: 1.7 }}>
      {children}
    </p>
  );
}

export default function HealthInfo() {
  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed px-1" style={{ color: C.inkSoft }}>
        ここに書かれている内容は一般的な情報提供を目的としたものであり、医学的な診断や治療の代わりになるものではありません。
        症状が続く場合や不安がある場合は、必ず耳鼻咽喉科（できれば音声を専門とする医師）にご相談ください。
      </p>

      <Section title="逆流性食道炎・咽喉頭逆流症（LPR）と歌手への影響" icon={AlertCircle} defaultOpen>
        <p>
          逆流性食道炎（胃食道逆流症、GERD）は、胃酸が食道に逆流して炎症を起こす病気です。
          胃酸が食道を超えて喉頭・咽頭にまで達するものは咽喉頭逆流症（LPR：Laryngopharyngeal
          Reflux）と呼ばれ、典型的な胸焼けを伴わずに喉だけに症状が出ることも多く、
          「サイレントリフラックス」とも呼ばれます。
        </p>
        <p>歌手にとって特に注意したいのは、LPRが次のような形で発声に直接影響しうる点です。</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>慢性的な喉の違和感・詰まり感（グロブス感）</li>
          <li>声のかすれ、特に朝方に声が出づらい</li>
          <li>頻繁な喉払い、慢性的な咳</li>
          <li>声域の低下、高音の出しづらさ</li>
        </ul>
        <p>
          また、慢性的な喉頭の炎症や違和感は、体が無意識に喉を守ろうとする防御反応（筋緊張性発声障害の一種）を
          引き起こすことがあり、これが<strong>喉頭挙上</strong>（喉頭が本来より高い位置に上がってしまう状態）に
          つながることがあると言われています。喉頭が過度に上がった状態では声帯の自由な振動が妨げられ、
          声の伸びや響きが損なわれやすくなります。
        </p>
        <p>一般的に言われている対策です（診断や治療の代わりにはなりません）。</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>就寝の3時間前までに食事を済ませる。特に本番前後の食事タイミングに注意する</li>
          <li>就寝時に上体をやや高くする</li>
          <li>カフェイン・アルコール・炭酸飲料・脂っこい食事・チョコレート・柑橘類など、逆流を誘発しやすいとされる飲食物を把握しておく</li>
          <li>大量の食事を避け、少量に分けて摂る</li>
        </ul>
        <Note>症状が続く場合は自己判断で済ませず、耳鼻咽喉科を受診することを強くおすすめします。</Note>
      </Section>

      <Section title="その他、歌手が注意すべき症状" icon={AlertCircle}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>声帯結節・声帯ポリープ</strong>：声の使いすぎや発声方法によって声帯にできる良性の病変。声のかすれ、声域の低下が特徴です。</li>
          <li><strong>声帯出血</strong>：急激な発声（過度な高音や大声）の後に起こることがある、声帯の血管が破れる状態。即座の休声が必要とされます。</li>
          <li><strong>筋緊張性発声障害</strong>：発声時に喉や首まわりの筋肉が過剰に緊張することで起こる、器質的な異常がないのに生じる声の不調です。</li>
          <li><strong>アレルギー性鼻炎・後鼻漏</strong>：鼻水が喉に垂れることで違和感や咳払いの原因になり、発声にも影響することがあります。</li>
        </ul>
        <Note>これらはあくまで一般的な情報で、診断ではありません。声の不調が2週間以上続く場合は受診をおすすめします。</Note>
      </Section>

      <Section title="声の衛生（ボーカルハイジーン）の基本" icon={Wind}>
        <ul className="list-disc pl-5 space-y-1">
          <li>こまめな水分補給（全身の水分状態は声帯の潤いにも影響するとされています）</li>
          <li>十分な睡眠</li>
          <li>発声前のウォームアップ、発声後のクールダウン</li>
          <li>大声での会話や過度なささやき声を避ける（ささやき声も声帯に負担がかかるとされています）</li>
          <li>空気が乾燥した環境での加湿</li>
          <li>喫煙・受動喫煙を避ける</li>
        </ul>
      </Section>

      <Section title="歌手に役立つ運動 — 目的別に整理" icon={Dumbbell}>
        <div>
          <p className="font-medium mt-2">呼吸支持（ブレスサポート）のために</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>横隔膜呼吸（腹式呼吸）の練習</strong>：安定した息の流れを作る土台になります。
              息の流れが安定するほど、音程の安定やフレーズの持続がしやすくなるとされています。
            </li>
            <li>
              <strong>プランクなど体幹トレーニング</strong>：腹横筋を含む体幹の支持筋を鍛えることで、
              呼気を細かくコントロールしやすくなります。
            </li>
            <li>
              <strong>ピラティス</strong>：体幹の意識的なコントロールと呼吸法を組み合わせて練習できるため、
              ブレスサポートの感覚を養うのに向いています。
            </li>
          </ul>
        </div>
        <div>
          <p className="font-medium mt-2">姿勢・喉頭の安定のために</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>背中・肩甲骨まわりのストレッチ</strong>：猫背などの姿勢の崩れは胸郭の可動域を狭め、
              呼吸や共鳴に影響しうるため、ほぐしておくことが役立ちます。
            </li>
            <li>
              <strong>首・肩のストレッチ、緊張のリリース</strong>：首まわりの過剰な緊張は、喉頭を
              不必要に引き上げてしまう一因になりうるとされています。定期的にほぐすことが大切です。
            </li>
            <li>
              <strong>姿勢を意識したエクササイズ（壁を使った姿勢チェックなど）</strong>：喉頭が自由に
              動ける安定したアライメント（骨格の並び）を保つのに役立ちます。
            </li>
          </ul>
        </div>
        <div>
          <p className="font-medium mt-2">全身持久力のために</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>ウォーキングや軽いジョギングなどの有酸素運動</strong>：心肺機能の向上は、長時間の
              公演やオーケストラを通しての体力維持に役立つとされています。
            </li>
          </ul>
        </div>
      </Section>

      <Section title="筋トレ回数の一般的な目安" icon={Dumbbell}>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>初心者の場合：8〜12回を1セット、2〜3セット、週2〜3回程度</strong>：一般的な筋力・
            筋持久力の向上に広く使われている目安です。正しいフォームを習得しやすく、怪我のリスクも
            抑えやすい回数設定とされています。
          </li>
          <li>
            <strong>慣れてきたら、フォームを保てる範囲で徐々に負荷や回数を増やす</strong>：少しずつ負荷を
            上げていくことで体が適応していく、という「漸進的過負荷」の考え方に基づいています。
          </li>
        </ul>
        <Note>体調に不安がある場合や持病がある場合は、始める前に医師に相談してください。</Note>
      </Section>

      <Section title="身長からの参考体重レンジについて" icon={Ruler}>
        <p>
          「今日の記録」の身体データ欄に表示される体重レンジは、一般的な健康指標であるBMI（体格指数）の
          標準範囲（18.5〜24.9）をもとに算出した、あくまで一般的な健康の目安です。声楽家に特化した専用の
          計算式ではありません。体重と歌唱能力の関係には個人差が大きく、筋肉量や体組成、そして発声技術の
          影響のほうがはるかに大きいとされています。この数値だけにとらわれず、体調管理の参考情報の一つとして
          捉えてください。
        </p>
      </Section>
    </div>
  );
}
