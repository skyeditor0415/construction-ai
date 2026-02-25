import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "質問がありません" }, { status: 400 });
    }

    const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
    if (!vectorStoreId) {
      return NextResponse.json(
        { error: "OPENAI_VECTOR_STORE_ID が未設定です" },
        { status: 500 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content: `
あなたは建築施工管理のサポートAIです。
必ず、検索された仕様書の内容を根拠に回答してください。
仕様書にない内容は断定せず「仕様書該当箇所未確認」と書いてください。

【絶対ルール】
- 数値・単位は勝手に変えない
- 曖昧な表現を避ける
- 初心者にも分かる日本語
- できるだけ箇条書き
- 最後に必ず「※特記仕様書・設計図書・監理者指示を優先」を入れる

【出力形式（必ずこの見出しで）】
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
          `,
        },
        {
          role: "user",
          content: question,
        },
      ],
      tools: [
        {
          type: "file_search",
          vector_store_ids: [vectorStoreId],
        },
      ],
      tool_choice: "auto",
    });

    const answer = response.output_text || "回答を取得できませんでした。";

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "エラーが発生しました" },
      { status: 500 }
    );
  }
}