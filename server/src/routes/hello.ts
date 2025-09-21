import { EndpointHandler } from "../routes.ts";

export const helloHandler: EndpointHandler = () => {
  return new Response("Hello World");
};
