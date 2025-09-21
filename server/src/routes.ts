import { chatHandler } from "./routes/chat.ts";
import { embedHandler } from "./routes/embed.ts";
import { helloHandler } from "./routes/hello.ts";

export type EndpointHandler = (
  req: Request,
  pattern: URLPatternResult,
) => Promise<Response> | Response;

type EndpointMethod = "get" | "post";
type Routes = Record<
  string,
  Partial<Record<EndpointMethod, EndpointHandler>>
>;

export const routes: Routes = {
  "/hello": {
    get: helloHandler,
  },
  "/chat": {
    post: chatHandler,
  },
  "/embed": {
    post: embedHandler,
  },
};
