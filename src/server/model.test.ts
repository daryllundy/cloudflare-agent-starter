import { describe, expect, it } from "vitest";
import {
	DEFAULT_OPENROUTER_BASE_URL,
	DEFAULT_OPENROUTER_MODEL,
	DEFAULT_WORKERS_AI_MODEL,
	getChatRuntimeConfig
} from "./model";

function makeEnv(
	overrides: Partial<
		Pick<
			Env,
			| "OPENROUTER_API_KEY"
			| "OPENROUTER_BASE_URL"
			| "OPENROUTER_MODEL"
			| "WORKERS_AI_MODEL"
		>
	> = {}
) {
	return {
		AI: {} as Ai,
		ChatAgent: {} as DurableObjectNamespace<import("../server").ChatAgent>,
		OPENROUTER_API_KEY: "sk-or-test",
		OPENROUTER_BASE_URL: DEFAULT_OPENROUTER_BASE_URL,
		OPENROUTER_MODEL: DEFAULT_OPENROUTER_MODEL,
		...overrides
	} as Env;
}

describe("getChatRuntimeConfig", () => {
	it("falls back to defaults when optional values are blank", () => {
		expect(
			getChatRuntimeConfig(
				makeEnv({
					OPENROUTER_BASE_URL: "   ",
					OPENROUTER_MODEL: "   "
				})
			)
		).toEqual({
			baseURL: DEFAULT_OPENROUTER_BASE_URL,
			model: DEFAULT_OPENROUTER_MODEL,
			provider: "openrouter"
		});
	});

	it("uses explicit model and base URL overrides", () => {
		expect(
			getChatRuntimeConfig(
				makeEnv({
					OPENROUTER_BASE_URL:
						"https://gateway.ai.cloudflare.com/v1/account/gateway/openrouter",
					OPENROUTER_MODEL: "anthropic/claude-3.5-sonnet"
				})
			)
		).toEqual({
			baseURL:
				"https://gateway.ai.cloudflare.com/v1/account/gateway/openrouter",
			model: "anthropic/claude-3.5-sonnet",
			provider: "openrouter"
		});
	});

	it("falls back to Workers AI when no OpenRouter key is configured", () => {
		expect(
			getChatRuntimeConfig(
				makeEnv({
					OPENROUTER_API_KEY: ""
				})
			)
		).toEqual({
			baseURL: "",
			model: DEFAULT_WORKERS_AI_MODEL,
			provider: "workers-ai"
		});
	});

	it("ignores OPENROUTER_MODEL when falling back to Workers AI", () => {
		expect(
			getChatRuntimeConfig(
				makeEnv({
					OPENROUTER_API_KEY: "",
					OPENROUTER_MODEL: "openai/gpt-4o-mini"
				})
			)
		).toEqual({
			baseURL: "",
			model: DEFAULT_WORKERS_AI_MODEL,
			provider: "workers-ai"
		});
	});

	it("uses WORKERS_AI_MODEL override when provided", () => {
		expect(
			getChatRuntimeConfig(
				makeEnv({
					OPENROUTER_API_KEY: "   ",
					WORKERS_AI_MODEL: "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
				})
			)
		).toEqual({
			baseURL: "",
			model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
			provider: "workers-ai"
		});
	});
});
