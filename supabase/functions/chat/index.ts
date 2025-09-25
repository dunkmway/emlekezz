import ollama from "../_shared/ollama.ts";

Deno.serve(async (req) => {
  const output = await ollama.chat({
    model: "gemma3:12b",
    messages: [{ role: "user", content: (await req.json()).message }],
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const chunk of output) {
          controller.enqueue(encoder.encode(chunk.message?.content ?? ""));
        }
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
    },
  });
});
