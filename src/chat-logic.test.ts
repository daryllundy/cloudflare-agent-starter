import { describe, expect, it } from "vitest";
import type { ModelMessage } from "ai";
import {
	calculateExpression,
	getScheduleInput,
	inlineDataUrls
} from "./chat-logic";

describe("inlineDataUrls", () => {
	it("converts file data URIs to byte arrays", () => {
		const messages: ModelMessage[] = [
			{
				role: "user",
				content: [
					{
						type: "file",
						data: "data:text/plain;base64,SGVsbG8=",
						filename: "hello.txt",
						mediaType: "text/plain"
					}
				]
			}
		];

		const [message] = inlineDataUrls(messages);
		if (typeof message.content === "string") {
			throw new Error("Expected multipart content");
		}

		const [part] = message.content;
		expect(part.type).toBe("file");
		if (part.type !== "file") {
			throw new Error("Expected file part");
		}
		expect(part.mediaType).toBe("text/plain");
		expect(part.data).toBeInstanceOf(Uint8Array);
		if (!(part.data instanceof Uint8Array)) {
			throw new Error("Expected Uint8Array data");
		}
		expect(new TextDecoder().decode(part.data)).toBe("Hello");
	});

	it("leaves non-data URIs unchanged", () => {
		const messages: ModelMessage[] = [
			{
				role: "user",
				content: [
					{
						type: "file",
						data: "https://example.com/image.png",
						filename: "image.png",
						mediaType: "image/png"
					}
				]
			}
		];

		const [message] = inlineDataUrls(messages);
		if (typeof message.content === "string") {
			throw new Error("Expected multipart content");
		}

		const [part] = message.content;
		expect(part.type).toBe("file");
		if (part.type !== "file") {
			throw new Error("Expected file part");
		}
		expect(part.data).toBe("https://example.com/image.png");
	});
});

describe("calculateExpression", () => {
	it("computes arithmetic results", () => {
		expect(calculateExpression(4, 5, "*")).toEqual({
			expression: "4 * 5",
			result: 20
		});
	});

	it("handles division by zero", () => {
		expect(calculateExpression(8, 0, "/")).toEqual({
			error: "Division by zero"
		});
	});
});

describe("getScheduleInput", () => {
	it("maps schedule variants to scheduler input", () => {
		expect(
			getScheduleInput({
				type: "scheduled",
				date: "2026-04-24T09:00:00Z"
			})
		).toBe("2026-04-24T09:00:00Z");
		expect(getScheduleInput({ type: "delayed", delayInSeconds: 300 })).toBe(
			300
		);
		expect(getScheduleInput({ type: "cron", cron: "0 9 * * *" })).toBe(
			"0 9 * * *"
		);
	});

	it("returns null for no-schedule", () => {
		expect(getScheduleInput({ type: "no-schedule" })).toBeNull();
	});
});
