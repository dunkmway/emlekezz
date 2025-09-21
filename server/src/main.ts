import { routes } from "./routes.ts";

async function handler(req: Request): Promise<Response> {
  console.log(`${req.method}: ${req.url}`);

  for (const route in routes) {
    const pattern = new URLPattern({ pathname: "/api" + route }).exec(req.url);

    if (pattern) {
      const method = req.method.toLowerCase();

      if (method === "get" || method === "post") {
        return await routes[route][method]?.(req, pattern) ??
          new Response("Internal Server Error", {
            status: 500,
          });
      }
    }
  }

  return new Response("Not found", {
    status: 404,
  });
}

Deno.serve(handler);
