import { useCallback, useEffect, useState } from "react";
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

interface ChatRuntimeConfig {
	model: string;
	provider: "openai";
}

export function useChatAgent() {
	const [connected, setConnected] = useState(false);
	const [mcpState, setMcpState] =
		useState<MCPServersState>(INITIAL_MCP_STATE);
	const [runtimeConfig, setRuntimeConfig] =
		useState<ChatRuntimeConfig | null>(null);
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

	useEffect(() => {
		let cancelled = false;

		void agent.stub
			.getRuntimeConfig()
			.then((config: ChatRuntimeConfig) => {
				if (!cancelled) {
					setRuntimeConfig({
						model: config.model,
						provider: config.provider
					});
				}
			})
			.catch((error: unknown) => {
				console.error("Failed to load chat runtime config:", error);
			});

		return () => {
			cancelled = true;
		};
	}, [agent.stub]);

	return {
		agent,
		...chat,
		connected,
		isStreaming: chat.status === "streaming" || chat.status === "submitted",
		mcpState,
		runtimeConfig
	};
}
