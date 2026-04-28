import { createOpenAI } from "@ai-sdk/openai";
import { createWorkersAI } from "workers-ai-provider";

export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
export const DEFAULT_WORKERS_AI_MODEL = "@cf/moonshotai/kimi-k2.6";

export type ChatProvider = "openai" | "workers-ai";

export interface ChatRuntimeConfig {
	baseURL: string;
	model: string;
	provider: ChatProvider;
}

function resolveEnvString(value: string | undefined) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

export function getChatRuntimeConfig(env: Env): ChatRuntimeConfig {
	const apiKey = resolveEnvString(env.OPENAI_API_KEY);
	if (apiKey) {
		return {
			baseURL:
				resolveEnvString(env.OPENAI_BASE_URL) ?? DEFAULT_OPENAI_BASE_URL,
			model: resolveEnvString(env.OPENAI_MODEL) ?? DEFAULT_OPENAI_MODEL,
			provider: "openai"
		};
	}

	return {
		baseURL: "",
		model: resolveEnvString(env.OPENAI_MODEL) ?? DEFAULT_WORKERS_AI_MODEL,
		provider: "workers-ai"
	};
}

export function createChatModel(env: Env) {
	const runtimeConfig = getChatRuntimeConfig(env);

	if (runtimeConfig.provider === "openai") {
		const openai = createOpenAI({
			apiKey: env.OPENAI_API_KEY,
			baseURL: runtimeConfig.baseURL
		});
		return openai(runtimeConfig.model);
	}

	const workersai = createWorkersAI({ binding: env.AI });
	return workersai(runtimeConfig.model);
}
