import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key тохиргоогүй байна." }, { status: 500 });
  }

  const { profile } = await req.json() as { profile: string };

  const prompt = `Чи монгол зурхайн зориулалттай гүнзгий тайлбар бичдэг мэргэжилтэн байна.
Дараах дөрвөн зурхайн мэдээллийг НЭГТГЭН гүнзгий тайлбар болон арга зарал бич.
Мэдээлэл: ${profile}
ЗӨВХӨН доорх JSON форматаар монголоор хариулж, өөр юу ч бүү бич:
{"summary":"нэгдсэн тайлбар 4-5 өгүүлбэр","remedies":["зарал 1","зарал 2","зарал 3","зарал 4"]}
Зарал нь монгол уламжлалт өнгө ашиглах, бүтэн үйлдэл хийх, мод тарих гэх мэт биелүүлж болохуйц зөвлөмж байх. Эмнэлэг, санхүүгийн мэргэжлийн зөвлөмж биш.`;

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
      messages: [{ role: "user", content: prompt }],
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
