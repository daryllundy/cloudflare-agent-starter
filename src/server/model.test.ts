import { describe, expect, it } from "vitest";
import {
	DEFAULT_OPENAI_BASE_URL,
	DEFAULT_OPENAI_MODEL,
	DEFAULT_WORKERS_AI_MODEL,
	getChatRuntimeConfig
} from "./model";

function makeEnv(
	overrides: Partial<
		Pick<
			Env,
			| "OPENAI_API_KEY"
			| "OPENAI_BASE_URL"
			| "OPENAI_MODEL"
			| "WORKERS_AI_MODEL"
		>
	> = {}
) {
	return {
		AI: {} as Ai,
		ChatAgent: {} as DurableObjectNamespace<import("../server").ChatAgent>,
		OPENAI_API_KEY: "sk-test",
		OPENAI_BASE_URL: DEFAULT_OPENAI_BASE_URL,
		OPENAI_MODEL: DEFAULT_OPENAI_MODEL,
		...overrides
	} as Env;
}

describe("getChatRuntimeConfig", () => {
	it("falls back to defaults when optional values are blank", () => {
		expect(
			getChatRuntimeConfig(
				makeEnv({
					OPENAI_BASE_URL: "   ",
					OPENAI_MODEL: "   "
				})
			)
		).toEqual({
			baseURL: DEFAULT_OPENAI_BASE_URL,
			model: DEFAULT_OPENAI_MODEL,
			provider: "openai"
		});
	});

	it("uses explicit model and base URL overrides", () => {
		expect(
			getChatRuntimeConfig(
				makeEnv({
					OPENAI_BASE_URL:
						"https://gateway.ai.cloudflare.com/v1/account/gateway/openai",
					OPENAI_MODEL: "openai/gpt-4.1-mini"
				})
			)
		).toEqual({
			baseURL:
				"https://gateway.ai.cloudflare.com/v1/account/gateway/openai",
			model: "openai/gpt-4.1-mini",
			provider: "openai"
		});
	});

	it("falls back to Workers AI when no OpenAI key is configured", () => {
		expect(
			getChatRuntimeConfig(
				makeEnv({
					OPENAI_API_KEY: ""
				})
			)
		).toEqual({
			baseURL: "",
			model: DEFAULT_WORKERS_AI_MODEL,
			provider: "workers-ai"
		});
	});

	it("ignores OPENAI_MODEL when falling back to Workers AI", () => {
		expect(
			getChatRuntimeConfig(
				makeEnv({
					OPENAI_API_KEY: "",
					OPENAI_MODEL: "gpt-4.1-mini"
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
					OPENAI_API_KEY: "   ",
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
