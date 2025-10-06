import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://localhost:11434' });

export default ollama;
