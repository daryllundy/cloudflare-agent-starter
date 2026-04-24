import { createOpenAI } from "@ai-sdk/openai";

export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

export interface ChatRuntimeConfig {
	baseURL: string;
	model: string;
	provider: "openai";
}

function resolveEnvString(value: string | undefined) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

function requireEnvString(name: string, value: string | undefined) {
	const resolved = resolveEnvString(value);
	if (resolved) return resolved;

	throw new Error(
		`${name} is not configured. Set it as a Cloudflare secret or environment variable before chatting.`
	);
}

export function getChatRuntimeConfig(env: Env): ChatRuntimeConfig {
	return {
		baseURL:
			resolveEnvString(env.OPENAI_BASE_URL) ?? DEFAULT_OPENAI_BASE_URL,
		model: resolveEnvString(env.OPENAI_MODEL) ?? DEFAULT_OPENAI_MODEL,
		provider: "openai"
	};
}

export function createChatModel(env: Env) {
	const runtimeConfig = getChatRuntimeConfig(env);
	const openai = createOpenAI({
		apiKey: requireEnvString("OPENAI_API_KEY", env.OPENAI_API_KEY),
		baseURL: runtimeConfig.baseURL
	});

	return openai(runtimeConfig.model);
}
