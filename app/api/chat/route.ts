import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// response.output から本文をできるだけ安全に抽出
function extractAnswerText(response: any): string {
  // 1) まずは output_text（取れる時は最速）
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  // 2) output 配列をたどって text を拾う
  const outputs = Array.isArray(response?.output) ? response.output : [];

  const chunks: string[] = [];

  for (const item of outputs) {
    // 例: item.type === "message"
    if (Array.isArray(item?.content)) {
      for (const c of item.content) {
        // よくある形: { type: "output_text", text: "..." }
        if (typeof c?.text === "string" && c.text.trim()) {
          chunks.push(c.text.trim());
        }

        // 稀に nested
        if (typeof c?.content === "string" && c.content.trim()) {
          chunks.push(c.content.trim());
        }
      }
    }

    // 念のため
    if (typeof item?.text === "string" && item.text.trim()) {
      chunks.push(item.text.trim());
    }
  }

  return chunks.join("\n\n").trim();
}

export async function POST(req: NextRequest) {
  try {
    const { question, mode } = await req.json();

    if (!question || !String(question).trim()) {
      return NextResponse.json({ error: "質問がありません" }, { status: 400 });
    }

    const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
    if (!vectorStoreId) {
      return NextResponse.json(
        { error: "OPENAI_VECTOR_STORE_ID が未設定です" },
        { status: 500 }
      );
    }

    const isFast = mode === "fast";

    const systemPromptFast = `
あなたは建築施工管理のサポートAIです。
必ず検索された仕様書の内容を根拠に回答してください。
仕様書にない内容は断定せず「仕様書該当箇所未確認」と書いてください。

【絶対ルール】
- 数値・単位は勝手に変えない
- 曖昧な表現を避ける
- 初心者にも分かる日本語
- 結論優先で短く
- 最後に必ず「※特記仕様書・設計図書・監理者指示を優先」を入れる

【出力形式（高速モード）】
■結論
（1〜3行で簡潔に）

■確認ポイント（現場チェック）
- 2〜5個

■根拠（仕様書）
- 章・節・表（分かる範囲）

■補足
- 必要なら1〜2行、不要なら「なし」
`;

    const systemPromptDetail = `
あなたは建築施工管理のサポートAIです。
必ず、検索された仕様書の内容を根拠に回答してください。
仕様書にない内容は断定せず「仕様書該当箇所未確認」と書いてください。

【絶対ルール】
- 数値・単位は勝手に変えない
- 曖昧な表現を避ける
- 初心者にも分かる日本語
- できるだけ箇条書き
- 最後に必ず「※特記仕様書・設計図書・監理者指示を優先」を入れる

【出力形式（詳細モード）】
■結論
（最初に短く結論）

■確認ポイント（現場チェック）
- （箇条書き）
- （箇条書き）

■NG・注意点
- （やってはいけない/見落としやすい点）
- （箇条書き）

■根拠（仕様書）
- 章・節・表・ページ（分かる範囲で）
- 仕様書名（分かる範囲で）

■補足
- 仕様書に書かれていないが、質問に関連して補足が必要なら「仕様書該当箇所未確認」と明記して簡潔に書く
- 不要なら「なし」
`;

    const response = await client.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content: isFast ? systemPromptFast : systemPromptDetail,
        },
        {
          role: "user",
          content: String(question),
        },
      ],
      tools: [
        {
          type: "file_search",
          vector_store_ids: [vectorStoreId],
          max_num_results: isFast ? 3 : 6,
        } as any,
      ],
      tool_choice: "auto",
    });

    const answer = extractAnswerText(response);

    if (!answer) {
      // デバッグしやすいように中身を少しだけ返す（本番でも安全な範囲）
      console.log("Responses API raw output:", JSON.stringify(response?.output, null, 2));
      return NextResponse.json(
        { error: "回答本文を取得できませんでした（output_text空）" },
        { status: 500 }
      );
    }

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error?.message || "エラーが発生しました" },
      { status: 500 }
    );
  }
}