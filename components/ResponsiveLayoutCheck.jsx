/**
 * ResponsiveLayoutCheck.jsx
 * 
 * iPad対応のレスポンシブ確認用コンポーネント
 * 各ブレークポイントでの表示を確認
 */

import React, { useState } from 'react';

export default function ResponsiveLayoutCheck() {
  const [viewport, setViewport] = useState('mobile');

  const viewports = {
    mobile: { width: '320px', label: 'iPhone (320px)', breakpoint: 'sm' },
    tablet: { width: '768px', label: 'iPad (768px)', breakpoint: 'md' },
    laptop: { width: '1024px', label: 'iPad Pro (1024px)', breakpoint: 'lg' },
    desktop: { width: '1280px', label: 'Desktop (1280px)', breakpoint: 'xl' }
  };

  const current = viewports[viewport];

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">レスポンシブ確認</h1>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(viewports).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setViewport(key)}
              className={`px-4 py-2 rounded ${
                viewport === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto bg-white shadow-lg" style={{ width: current.width }}>
        <div className="p-4 border-b text-sm text-gray-600">
          {current.label} - Breakpoint: {current.breakpoint}
        </div>

        <div className="p-6 space-y-6">
          {/* グリッドレイアウトテスト */}
          <section>
            <h2 className="text-lg font-bold mb-3">グリッドレイアウト</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-100 p-4 rounded text-center">1</div>
              <div className="bg-blue-100 p-4 rounded text-center">2</div>
              <div className="bg-blue-100 p-4 rounded text-center">3</div>
              <div className="bg-blue-100 p-4 rounded text-center">4</div>
              <div className="bg-blue-100 p-4 rounded text-center">5</div>
              <div className="bg-blue-100 p-4 rounded text-center">6</div>
            </div>
          </section>

          {/* タブメニュー */}
          <section>
            <h2 className="text-lg font-bold mb-3">タブメニュー</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['Tab 1', 'Tab 2', 'Tab 3', 'Tab 4'].map((tab) => (
                <button
                  key={tab}
                  className="px-4 py-2 rounded-full text-sm whitespace-nowrap border border-gray-300"
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          {/* フォーム要素 */}
          <section>
            <h2 className="text-lg font-bold mb-3">フォーム要素</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="テキスト入力"
                className="w-full border rounded p-2"
              />
              <button className="w-full bg-blue-600 text-white py-2.5 rounded font-medium">
                ボタン
              </button>
            </div>
          </section>

          {/* モーダル */}
          <section>
            <h2 className="text-lg font-bold mb-3">モーダルサイズ</h2>
            <div className="bg-gray-50 p-4 rounded border-2 border-dashed text-center text-sm text-gray-600">
              max-w-2xl / max-w-4xl での表示確認
            </div>
          </section>

          {/* タッチターゲット */}
          <section>
            <h2 className="text-lg font-bold mb-3">タッチターゲット (44×44px)</h2>
            <div className="flex gap-2">
              <button className="min-h-[44px] min-w-[44px] bg-green-100 rounded border border-green-300">
                44px
              </button>
              <button className="min-h-[44px] flex items-center px-4 bg-green-100 rounded border border-green-300">
                44px+
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
