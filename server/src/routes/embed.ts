import { EndpointHandler } from "../routes.ts";
import ollama from "ollama";

export const embedHandler: EndpointHandler = async (req) => {
  const response = await ollama.embed({
    model: Deno.env.get("OLLAMA_EMBED") ?? "nomic-embed-text:latest",
    input: (await req.json()).message,
  });

  return new Response(JSON.stringify(response.embeddings));
};
