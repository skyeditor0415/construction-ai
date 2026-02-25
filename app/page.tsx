"use client";

import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("ここに回答が表示されます");
  const [loading, setLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const handleAsk = async () => {
    if (!question.trim()) {
      setAnswer("質問を入力してください。");
      return;
    }

    setLoading(true);
    setCopyMessage("");
    setAnswer("AIが回答を作成中です...");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAnswer(`エラー: ${data.error || "不明なエラー"}`);
        return;
      }

      setAnswer(data.answer);
    } catch {
      setAnswer("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopyMessage("コピーしました");
      setTimeout(() => setCopyMessage(""), 1500);
    } catch {
      setCopyMessage("コピーに失敗しました");
      setTimeout(() => setCopyMessage(""), 1500);
    }
  };

  const handleClear = () => {
    setQuestion("");
    setAnswer("ここに回答が表示されます");
    setCopyMessage("");
  };

  return (
    <main
      style={{
        maxWidth: 980,
        margin: "40px auto",
        padding: 16,
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 8 }}>
        施工管理AIチャット（試作）
      </h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        建築工事標準仕様書ベースの回答を目指すチャットbot
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例）鉄筋のかぶり厚さ確認で注意する点は？"
          rows={5}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #999",
            fontSize: 16,
            background: "#111",
            color: "#fff",
          }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleAsk}
            disabled={loading}
            style={{
              width: 160,
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: "#fff",
              color: "#111",
              fontWeight: "bold",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "回答中..." : "質問する"}
          </button>

          <button
            onClick={handleCopy}
            disabled={loading || answer === "ここに回答が表示されます"}
            style={{
              width: 120,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #999",
              background: "#222",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            コピー
          </button>

          <button
            onClick={handleClear}
            style={{
              width: 120,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #999",
              background: "#222",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            クリア
          </button>

          {copyMessage && (
            <span style={{ alignSelf: "center", color: "#aaa" }}>{copyMessage}</span>
          )}
        </div>

        <div
          style={{
            marginTop: 8,
            padding: 16,
            border: "1px solid #666",
            borderRadius: 8,
            minHeight: 220,
            maxHeight: 450,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            background: "#1a1a1a",
            lineHeight: 1.7,
          }}
        >
          {answer}
        </div>

        <div style={{ marginTop: 8 }}>
          <p style={{ color: "#888", marginBottom: 8, fontSize: 14 }}>
            よく使う質問（クリックで入力）
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              "型枠の確認項目を教えて",
              "コンクリート打設前の確認事項を教えて",
              "鉄筋のかぶり厚さ確認で注意する点は？",
              "配筋検査で見るポイントを教えて",
              "打設時の品質管理ポイントを教えて",
            ].map((sample) => (
              <button
                key={sample}
                onClick={() => setQuestion(sample)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: "1px solid #666",
                  background: "#111",
                  color: "#ddd",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}