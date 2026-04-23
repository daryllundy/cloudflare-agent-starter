import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "./prompt";

describe("buildSystemPrompt", () => {
	it("includes the assistant capabilities and scheduling guidance", () => {
		const prompt = buildSystemPrompt(new Date("2026-04-23T12:00:00Z"));

		expect(prompt).toContain("understand images");
		expect(prompt).toContain("schedule tool");
		expect(prompt).toContain("2026");
	});
});
