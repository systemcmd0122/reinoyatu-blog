import { GoogleGenAI } from "@google/genai"

export const maxDuration = 120

interface Message {
  role: "system" | "user" | "model"
  content: string
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return Response.json({ error: "APIキーが設定されていません" }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })
    const systemMessage = messages.find(m => m.role === "system")
    const conversationMessages = messages.filter(m => m.role !== "system")
    const contents = conversationMessages.map(m => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }],
    }))

    const generateStream = ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemMessage
          ? { parts: [{ text: systemMessage.content }] }
          : undefined,
      },
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of await generateStream) {
            const text = chunk.text
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
        } catch (err) {
          console.error("[Gemini Stream]", err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  } catch (err: any) {
    console.error("[Gemini API]", err)
    return Response.json(
      { error: err.message || "Gemini API エラー" },
      { status: 500 }
    )
  }
}
