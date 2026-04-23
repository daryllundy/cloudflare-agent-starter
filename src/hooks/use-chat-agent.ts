import { useCallback, useState } from "react";
import type { MCPServersState } from "agents";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { useKumoToastManager } from "@cloudflare/kumo/components/toast";
import type { ChatAgent } from "../server";

const INITIAL_MCP_STATE: MCPServersState = {
	prompts: [],
	resources: [],
	servers: {},
	tools: []
};

export function useChatAgent() {
	const [connected, setConnected] = useState(false);
	const [mcpState, setMcpState] =
		useState<MCPServersState>(INITIAL_MCP_STATE);
	const toasts = useKumoToastManager();

	const agent = useAgent<ChatAgent>({
		agent: "ChatAgent",
		onOpen: useCallback(() => setConnected(true), []),
		onClose: useCallback(() => setConnected(false), []),
		onError: useCallback(
			(error: Event) => console.error("WebSocket error:", error),
			[]
		),
		onMcpUpdate: useCallback((state: MCPServersState) => {
			setMcpState(state);
		}, []),
		onMessage: useCallback(
			(message: MessageEvent) => {
				try {
					const data = JSON.parse(String(message.data));
					if (data.type !== "scheduled-task") return;

					toasts.add({
						title: "Scheduled task completed",
						description: data.description,
						timeout: 0
					});
				} catch {
					// Ignore transport messages that are not our JSON payloads.
				}
			},
			[toasts]
		)
	});

	const chat = useAgentChat({
		agent,
		onToolCall: async (event) => {
			if (
				"addToolOutput" in event &&
				event.toolCall.toolName === "getUserTimezone"
			) {
				event.addToolOutput({
					toolCallId: event.toolCall.toolCallId,
					output: {
						timezone:
							Intl.DateTimeFormat().resolvedOptions().timeZone,
						localTime: new Date().toLocaleTimeString()
					}
				});
			}
		}
	});

	return {
		agent,
		...chat,
		connected,
		isStreaming: chat.status === "streaming" || chat.status === "submitted",
		mcpState
	};
}
