import { Ollama } from "npm:ollama";

const ollama = new Ollama({ host: "http://host.docker.internal:11434" });

export default ollama;
