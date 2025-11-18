'use client';

import React, { useState } from 'react';
import { Database, Send, Download, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function MockaIntegrationDemo() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [inputData, setInputData] = useState('');

  // MoCKA-KNOWLEDGE-GATEの統合エンドポイントをシミュレート
  const integrations = [
    { name: 'NotebookLM', status: 'active', color: 'bg-green-500' },
    { name: 'Mem.ai', status: 'active', color: 'bg-green-500' },
    { name: 'Notion', status: 'active', color: 'bg-green-500' },
    { name: 'GitHub', status: 'active', color: 'bg-green-500' },
    { name: 'Google Colab', status: 'active', color: 'bg-green-500' }
  ];

  const handleApiCall = async (endpoint) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/mocka-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: endpoint,
          data: inputData || 'initial data',
          timestamp: new Date().toISOString(),
          metadata: {
            issueId: `ISSUE-${Date.now()}`,
            rodNumber: `ROD-${Math.floor(Math.random() * 10000)}`
          }
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20">
          <div className="flex items-center gap-4 mb-4">
            <Database className="w-12 h-12 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">MoCKA-KNOWLEDGE-GATE</h1>
              <p className="text-blue-200">AI統合ナレッジゲートウェイ</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {integrations.map((int) => (
              <div key={int.name} className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                <div className={`w-2 h-2 rounded-full ${int.color}`} />
                <span className="text-sm text-white">{int.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="flex gap-2 mb-6">
          {['overview', 'api', 'sync'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {tab === 'overview' && '概要'}
              {tab === 'api' && 'API連携'}
              {tab === 'sync' && '同期ステータス'}
            </button>
          ))}
        </div>

        {/* コンテンツエリア */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">システム概要</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-2">双方向統合</h3>
                  <p className="text-blue-200 text-sm">
                    NotebookLM、Mem.ai、Notion、GitHub、Google Colabとのリアルタイム双方向同期
                  </p>
                </div>
                <div className="bg-white/5 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-2">AI シミュレーション</h3>
                  <p className="text-blue-200 text-sm">
                    GitHub Actionsによる自動実行ワークフロー
                  </p>
                </div>
                <div className="bg-white/5 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-2">Webhook サポート</h3>
                  <p className="text-blue-200 text-sm">
                    リアルタイムイベント処理とシステム間同期
                  </p>
                </div>
                <div className="bg-white/5 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-2">メタデータ管理</h3>
                  <p className="text-blue-200 text-sm">
                    包括的なデータトラッキングとコレクション管理
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">API連携テスト</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-medium">入力データ</label>
                  <textarea
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    placeholder="処理するデータを入力してください..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {integrations.map((int) => (
                    <button
                      key={int.name}
                      onClick={() => handleApiCall(int.name)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      {int.name}
                    </button>
                  ))}
                </div>

                {loading && (
                  <div className="flex items-center justify-center gap-3 p-6 bg-white/5 rounded-lg">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="text-white">処理中...</span>
                  </div>
                )}

                {result && !loading && (
                  <div className="p-6 bg-white/5 rounded-lg border border-white/20">
                    <div className="flex items-center gap-2 mb-4">
                      {result.status === 'success' ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      )}
                      <h3 className="text-lg font-semibold text-white">
                        {result.status === 'success' ? '成功' : 'エラー'}
                      </h3>
                    </div>
                    <pre className="text-sm text-blue-200 whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">同期ステータス</h2>
              <div className="space-y-3">
                {integrations.map((int) => (
                  <div key={int.name} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${int.color}`} />
                      <span className="text-white font-medium">{int.name}</span>
                    </div>
                    <span className="text-sm text-green-400">アクティブ</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  すべてのシステムが正常に同期されています。最終更新: {new Date().toLocaleString('ja-JP')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
