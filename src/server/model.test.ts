import { describe, expect, it } from "vitest";
import {
	DEFAULT_OPENAI_BASE_URL,
	DEFAULT_OPENAI_MODEL,
	createChatModel,
	getChatRuntimeConfig
} from "./model";

function makeEnv(
	overrides: Partial<
		Pick<Env, "OPENAI_API_KEY" | "OPENAI_BASE_URL" | "OPENAI_MODEL">
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
});

describe("createChatModel", () => {
	it("throws a clear error when the OpenAI key is blank", () => {
		expect(() =>
			createChatModel(
				makeEnv({
					OPENAI_API_KEY: "   "
				})
			)
		).toThrow("OPENAI_API_KEY is not configured");
	});
});
