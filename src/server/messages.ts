import { pruneMessages, type ModelMessage } from "ai";
import { inlineDataUrls } from "../chat-logic";

export function normalizeIncomingMessages(messages: ModelMessage[]) {
	return pruneMessages({
		messages: inlineDataUrls(messages),
		toolCalls: "before-last-2-messages"
	});
}
