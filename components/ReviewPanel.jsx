/**
 * ReviewPanel.jsx（ふりかえる）
 * design_9.11-5に基づく実装
 */

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { C } from '@/lib/tokens';

export default function ReviewPanel({ data = [] }) {
  const [activeTab, setActiveTab] = useState('narabe');
  const [span, setSpan] = useState(14);
  const isResting = false;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          ['narabe', '並べる'],
          ['sakanobo', 'さかのぼる'],
          ['kuraberu', 'くらべる'],
          ['kazoeru', 'かぞえる']
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${activeTab === key ? 'font-bold' : ''}`}
            style={{
              background: activeTab === key ? C.curtain : C.paper,
              color: activeTab === key ? '#fff' : C.ink,
              border: `1px solid ${C.line}`
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {isResting && (activeTab === 'kuraberu' || activeTab === 'kazoeru') ? (
        <div className="rounded-2xl p-4 border" style={{ background: '#F6F1E4', borderColor: '#E8DFC8' }}>
          <div className="text-sm font-medium mb-2">いまは お休みです。</div>
          <div className="text-xs" style={{ color: C.inkSoft }}>本番の 翌々日から、また 出ます。</div>
        </div>
      ) : activeTab === 'narabe' ? (
        <div className="space-y-3">
          <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
            <p className="text-xs font-medium mb-3">こえの ちょうし</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.slice(-span > -1 ? -span : undefined)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" height={20} tick={{ fontSize: 10 }} />
                <YAxis width={30} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="voice" fill={C.curtain} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
          <p className="text-sm mb-3">{activeTab}機能は準備中です</p>
        </div>
      )}
    </div>
  );
}
