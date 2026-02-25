"use client";

import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"fast" | "detail">("fast");
  const [statusText, setStatusText] = useState("");

  const quickQuestions = [
    "型枠の確認項目を教えて",
    "コンクリート打設前の確認事項を教えて",
    "鉄筋のかぶり厚さ確認で注意する点は？",
    "配筋検査で見るポイントを教えて",
    "打設時の品質管理ポイントを教えて",
  ];

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");
    setStatusText("質問を送信しています…");

    let statusTimer1: ReturnType<typeof setTimeout> | null = null;
    let statusTimer2: ReturnType<typeof setTimeout> | null = null;

    try {
      // 進行状況の見せ方（体感改善）
      statusTimer1 = setTimeout(() => {
        setStatusText("仕様書を検索しています…");
      }, 500);

      statusTimer2 = setTimeout(() => {
        setStatusText("回答を作成しています…");
      }, 1800);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          mode,
        }),
      });

      if (statusTimer1) clearTimeout(statusTimer1);
      if (statusTimer2) clearTimeout(statusTimer2);

      const data = await res.json();

      if (!res.ok) {
        setAnswer(`エラー: ${data.error || "不明なエラー"}`);
      } else {
        setAnswer(data.answer || "回答なし");
      }
    } catch (e: any) {
      setAnswer(`通信エラー: ${e?.message || "不明なエラー"}`);
    } finally {
      if (statusTimer1) clearTimeout(statusTimer1);
      if (statusTimer2) clearTimeout(statusTimer2);
      setLoading(false);
      setStatusText("");
    }
  };

  const handleCopy = async () => {
    if (!answer) return;
    try {
      await navigator.clipboard.writeText(answer);
      alert("回答をコピーしました");
    } catch {
      alert("コピーに失敗しました");
    }
  };

  const handleClear = () => {
    setQuestion("");
    setAnswer("");
    setStatusText("");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        padding: "24px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 56, fontWeight: 800, marginBottom: 8 }}>
          施工管理AIチャット（試作）
        </h1>
        <p style={{ color: "#aaa", fontSize: 20, marginBottom: 24 }}>
          建築工事標準仕様書ベースの回答を目指すチャットbot
        </p>

        {/* モード切替 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => setMode("fast")}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #666",
              background: mode === "fast" ? "#e5e5e5" : "#222",
              color: mode === "fast" ? "#111" : "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            高速モード
          </button>

          <button
            onClick={() => setMode("detail")}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #666",
              background: mode === "detail" ? "#e5e5e5" : "#222",
              color: mode === "detail" ? "#111" : "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            詳細モード
          </button>

          <div style={{ alignSelf: "center", color: "#bbb", fontSize: 14 }}>
            {mode === "fast"
              ? "結論優先・短く返答（速い）"
              : "現場チェック向けに詳しく返答"}
          </div>
        </div>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例）鉄筋のかぶり厚さ確認で注意する点は？"
          style={{
            width: "100%",
            minHeight: 180,
            borderRadius: 12,
            border: "1px solid #666",
            background: "#1d1f22",
            color: "#fff",
            padding: 16,
            fontSize: 18,
            outline: "none",
            resize: "vertical",
          }}
        />

        <div style={{ display: "flex", gap: 12, marginTop: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <button
            onClick={handleAsk}
            disabled={loading}
            style={{
              minWidth: 160,
              padding: "14px 20px",
              borderRadius: 12,
              border: "1px solid #777",
              background: "#e5e5e5",
              color: "#111",
              fontWeight: 700,
              fontSize: 18,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "回答中..." : "質問する"}
          </button>

          <button
            onClick={handleCopy}
            style={{
              minWidth: 120,
              padding: "14px 20px",
              borderRadius: 12,
              border: "1px solid #777",
              background: "#222",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            コピー
          </button>

          <button
            onClick={handleClear}
            style={{
              minWidth: 120,
              padding: "14px 20px",
              borderRadius: 12,
              border: "1px solid #777",
              background: "#222",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            クリア
          </button>
        </div>

        {/* 進行表示 */}
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
              color: "#bbb",
              fontSize: 14,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#fff",
                display: "inline-block",
                animation: "pulse 1s infinite",
              }}
            />
            <span>{statusText || "処理中…"}</span>
          </div>
        )}

        <div
          style={{
            width: "100%",
            minHeight: 360,
            maxHeight: 560,
            overflowY: "auto",
            borderRadius: 12,
            border: "1px solid #666",
            background: "#222429",
            padding: 16,
            whiteSpace: "pre-wrap",
            lineHeight: 1.8,
            fontSize: 16,
          }}
        >
          {answer || "ここに回答が表示されます"}
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ color: "#bbb", marginBottom: 10 }}>
            よく使う質問（クリックで入力）
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                style={{
                  borderRadius: 999,
                  border: "1px solid #666",
                  background: "#1a1a1a",
                  color: "#fff",
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 0.2;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0.2;
            transform: scale(0.9);
          }
        }
      `}</style>
    </main>
  );
}
