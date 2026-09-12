/**
 * NotePanel.jsx（ノート）
 * design_9.11-5に基づく実装
 * - 稽古（keiko）
 * - レパートリー（rep）
 * - 連絡（renraku）
 * - 1枚（ichimai）
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { C } from '@/lib/tokens';

export default function NotePanel() {
  const [activeTab, setActiveTab] = useState('keiko');
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotes([{ id: Date.now(), content: newNote, date: new Date().toLocaleDateString('ja-JP') }, ...notes]);
    setNewNote('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          ['keiko', '稽古'],
          ['rep', 'レパートリー'],
          ['renraku', '連絡'],
          ['ichimai', '1枚']
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

      <div>
        {activeTab === 'keiko' && (
          <div className="space-y-3">
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium"
              style={{ background: C.curtain, color: '#fff' }}
              onClick={() => {/* 新規作成 */}}
            >
              <Plus size={16} /> 稽古の メモを 書く
            </button>
            {notes.length === 0 ? (
              <div className="rounded-2xl p-4 text-center border" style={{ background: C.paper, borderColor: C.line }}>
                <p className="text-sm" style={{ color: C.inkSoft }}>まだ、稽古の メモが ありません。</p>
                <p className="text-xs" style={{ color: C.ink }}>右上の ＋ から、レッスンで 言われたことを 書けます。</p>
              </div>
            ) : (
              notes.map(note => (
                <div key={note.id} className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <p className="text-sm mb-2">{note.content}</p>
                  <p className="text-xs" style={{ color: C.inkSoft }}>{note.date}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'rep' && (
          <div className="space-y-3">
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium"
              style={{ background: C.curtain, color: '#fff' }}
            >
              <Plus size={16} /> 曲を 足す
            </button>
            <div className="rounded-2xl p-4 text-center border" style={{ background: C.paper, borderColor: C.line }}>
              <p className="text-sm" style={{ color: C.inkSoft }}>まだ、曲が ありません。</p>
            </div>
          </div>
        )}

        {activeTab === 'renraku' && (
          <div className="rounded-2xl p-4 border" style={{ background: C.paper, borderColor: C.line }}>
            <p className="text-sm" style={{ color: C.inkSoft }}>まだ、門下に 入っていません。</p>
            <p className="text-xs">学校や 教室から 招かれると、ここに 出ます。</p>
          </div>
        )}

        {activeTab === 'ichimai' && (
          <div className="rounded-2xl p-4 border" style={{ background: C.paper, borderColor: C.line }}>
            <p className="text-sm mb-3">受診用の 1枚</p>
            <p className="text-xs" style={{ color: C.inkSoft }}>医療機関へ 持っていく 紙を 作ります。</p>
          </div>
        )}
      </div>
    </div>
  );
}
