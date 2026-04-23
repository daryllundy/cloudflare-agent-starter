import { createOpenAI } from "@ai-sdk/openai";

export function createChatModel(env: Env) {
	const openai = createOpenAI({
		apiKey: env.OPENAI_API_KEY,
		baseURL: env.OPENAI_BASE_URL
	});

	return openai("gpt-4.1-mini");
}
