import { NextRequest, NextResponse } from "next/server";

const PALM_PROMPT = `Энэ бол таны алганы зураг. Чи зурхай шинжилгээний зориулалттай мэргэжилтэн байна.
Дараах дүрвэн алганы шугамыг ажиглаад монгол хэлээр тайлбарла:
ЗӨВХӨН доорх JSON форматаар хариулж, өөр юу ч бүү бич:
{"life":"амьдралын шугамын 2-3 өгүүлбэр тайлбар","head":"оюуны шугамын 2-3 өгүүлбэр","heart":"зүрхний шугамын 2-3 өгүүлбэр","fate":"хувь заяаны шугамын 2-3 өгүүлбэр","summary":"ерөнхий дүгнэлт 2-3 өгүүлбэр"}
Хэрвэв зураг алга биш бол {"error":"Алганы зураг танигдаагүй. Алгаа дэлгэрэн тод зураг оруулна уу."} гэж хариулна.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key тохиргоогүй байна. .env файлд ANTHROPIC_API_KEY нэм." }, { status: 500 });
  }

  const { base64, mediaType } = await req.json() as { base64: string; mediaType: string };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: PALM_PROMPT },
        ],
      }],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `API алдаа: ${res.status}` }, { status: res.status });
  }

  const data = await res.json() as { content: { type: string; text?: string }[] };
  const text = data.content.map((i) => (i.type === "text" ? i.text : "")).join("\n");
  try {
    return NextResponse.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch {
    return NextResponse.json({ error: "AI хариу буруу форматтай байна." }, { status: 500 });
  }
}
