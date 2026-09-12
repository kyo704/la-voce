/**
 * MorePanel.jsx（もっと）
 * design_9.11-5に基づく実装
 * アプリ全体の設定・データ書き出し・同意撤回など
 */

import React, { useState } from 'react';
import { C } from '@/lib/tokens';

export default function MorePanel() {
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    { id: 'settings', label: '設定', icon: '⚙' },
    { id: 'account', label: 'アカウント', icon: '👤' },
    { id: 'data', label: 'データ', icon: '📊' },
    { id: 'consent', label: '同意', icon: '✓' },
    { id: 'plan', label: 'プラン', icon: '💳' },
    { id: 'learn', label: '学ぶ', icon: '📚' }
  ];

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
          className="w-full rounded-2xl p-4 border text-left hover:opacity-80 transition"
          style={{
            background: expandedSection === section.id ? C.curtain : C.card,
            borderColor: C.line,
            color: expandedSection === section.id ? '#fff' : C.ink
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{section.icon}</span>
              <span className="font-medium text-sm">{section.label}</span>
            </div>
            <span className="text-lg">{expandedSection === section.id ? '−' : '+'}</span>
          </div>

          {expandedSection === section.id && (
            <div className="mt-4 pt-4 border-t space-y-3" style={{ 
              borderColor: expandedSection === section.id ? 'rgba(255,255,255,0.2)' : C.line 
            }}>
              {section.id === 'settings' && (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">言語</p>
                    <select className="w-full rounded-lg border p-2 text-sm" 
                      style={{ borderColor: C.line, background: C.paper }}>
                      <option>日本語</option>
                      <option>English</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">プッシュ通知を受け取る</span>
                    </label>
                  </div>
                </>
              )}

              {section.id === 'account' && (
                <>
                  <button className="w-full py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: C.line, background: C.paper, color: C.ink }}>
                    メールアドレスを変える
                  </button>
                  <button className="w-full py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: C.line, background: C.paper, color: C.ink }}>
                    パスワードを変える
                  </button>
                  <button className="w-full py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: C.curtain, background: C.curtain, color: '#fff' }}>
                    ログアウト
                  </button>
                </>
              )}

              {section.id === 'data' && (
                <>
                  <button className="w-full py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: C.line, background: C.paper, color: C.ink }}>
                    記録をCSVで 書き出す
                  </button>
                  <button className="w-full py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: C.line, background: C.paper, color: C.ink }}>
                    データを 削除する
                  </button>
                  <p className="text-xs" style={{ color: C.inkSoft }}>
                    一度削除すると、戻せません。よく考えてから進んでください。
                  </p>
                </>
              )}

              {section.id === 'consent' && (
                <>
                  <button className="w-full py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: C.line, background: C.paper, color: C.ink }}>
                    要配慮個人情報の同意を 撤回する
                  </button>
                  <p className="text-xs" style={{ color: C.inkSoft }}>
                    音声診断機能が使えなくなります。
                  </p>
                </>
              )}

              {section.id === 'plan' && (
                <>
                  <div className="rounded-lg p-3" style={{ background: C.paper }}>
                    <p className="text-sm font-medium mb-1">現在のプラン</p>
                    <p className="text-xs mb-2" style={{ color: C.ink }}>無料プラン</p>
                    <button className="w-full py-2 rounded-lg text-sm font-medium"
                      style={{ borderColor: C.line, background: C.paper, color: C.ink, border: `1px solid ${C.line}` }}>
                      詳しく 見る
                    </button>
                  </div>
                </>
              )}

              {section.id === 'learn' && (
                <>
                  <button className="w-full py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: C.line, background: C.paper, color: C.ink }}>
                    使い方 ガイド
                  </button>
                  <button className="w-full py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: C.line, background: C.paper, color: C.ink }}>
                    よくある 質問
                  </button>
                  <button className="w-full py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: C.line, background: C.paper, color: C.ink }}>
                    プライバシーポリシー
                  </button>
                </>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
