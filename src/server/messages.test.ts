import { describe, expect, it } from "vitest";
import type { ModelMessage } from "ai";
import { normalizeIncomingMessages } from "./messages";

describe("normalizeIncomingMessages", () => {
	it("preserves simple text messages", () => {
		const messages: ModelMessage[] = [
			{ role: "user", content: "Hello" },
			{ role: "assistant", content: "Hi there" }
		];

		expect(normalizeIncomingMessages(messages)).toEqual(messages);
	});

	it("normalizes inline file data URLs before pruning", () => {
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

		const [message] = normalizeIncomingMessages(messages);
		if (typeof message.content === "string") {
			throw new Error("Expected multipart content");
		}

		const [part] = message.content;
		expect(part.type).toBe("file");
		if (part.type !== "file") {
			throw new Error("Expected file part");
		}
		expect(part.data).toBeInstanceOf(Uint8Array);
	});
});
