import { EndpointHandler } from "../routes.ts";
import ollama from "ollama";

export const chatHandler: EndpointHandler = (req) => {
  // Create a streaming HTTP response
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      const upstreamAC = new AbortController();
      const onAbort = () => {
        if (!upstreamAC.signal.aborted) upstreamAC.abort();
      };
      req.signal.addEventListener("abort", onAbort, { once: true });

      try {
        const parts = await ollama.chat({
          model: Deno.env.get("OLLAMA_MODEL") ?? "gemma3:12b",
          messages: [{ role: "user", content: (await req.json()).message }],
          stream: true,
        });

        for await (const p of parts) {
          controller.enqueue(enc.encode(p.message?.content ?? ""));
        }
      } catch (err) {
        controller.enqueue(enc.encode(`\n[stream error] ${err}\n`));
      } finally {
        req.signal.removeEventListener("abort", onAbort);
        try {
          controller.close();
        } catch {
          console.log("controller failed to close");
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      // For plain text tokens:
      "Content-Type": "text/plain; charset=utf-8",
      // For NDJSON, use:
      // "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
};
