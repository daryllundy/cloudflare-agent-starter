import { createOpenAI } from "@ai-sdk/openai";
import { createWorkersAI } from "workers-ai-provider";

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";
export const DEFAULT_WORKERS_AI_MODEL = "@cf/moonshotai/kimi-k2.6";

export type ChatProvider = "openrouter" | "workers-ai";

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
	const apiKey = resolveEnvString(env.OPENROUTER_API_KEY);
	if (apiKey) {
		return {
			baseURL:
				resolveEnvString(env.OPENROUTER_BASE_URL) ??
				DEFAULT_OPENROUTER_BASE_URL,
			model:
				resolveEnvString(env.OPENROUTER_MODEL) ?? DEFAULT_OPENROUTER_MODEL,
			provider: "openrouter"
		};
	}

	return {
		baseURL: "",
		model:
			resolveEnvString(env.WORKERS_AI_MODEL) ?? DEFAULT_WORKERS_AI_MODEL,
		provider: "workers-ai"
	};
}

export function createChatModel(env: Env) {
	const runtimeConfig = getChatRuntimeConfig(env);

	if (runtimeConfig.provider === "openrouter") {
		const openrouter = createOpenAI({
			apiKey: env.OPENROUTER_API_KEY,
			baseURL: runtimeConfig.baseURL
		});
		return openrouter(runtimeConfig.model);
	}

	const workersai = createWorkersAI({ binding: env.AI });
	return workersai(runtimeConfig.model);
}
