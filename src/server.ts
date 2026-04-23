import { callable, routeAgentRequest, type Schedule } from "agents";
import { AIChatAgent, type OnChatMessageOptions } from "@cloudflare/ai-chat";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { normalizeIncomingMessages } from "./server/messages";
import { createChatModel } from "./server/model";
import { buildSystemPrompt } from "./server/prompt";
import { buildChatTools } from "./server/tools";

export class ChatAgent extends AIChatAgent<Env> {
	maxPersistedMessages = 100;

	onStart() {
		// Configure OAuth popup behavior for MCP servers that require authentication
		this.mcp.configureOAuthCallback({
			customHandler: (result) => {
				if (result.authSuccess) {
					return new Response("<script>window.close();</script>", {
						headers: { "content-type": "text/html" },
						status: 200
					});
				}
				return new Response(
					`Authentication Failed: ${result.authError || "Unknown error"}`,
					{ headers: { "content-type": "text/plain" }, status: 400 }
				);
			}
		});
	}

	@callable()
	async addServer(name: string, url: string) {
		return await this.addMcpServer(name, url);
	}

	@callable()
	async removeServer(serverId: string) {
		await this.removeMcpServer(serverId);
	}

	async onChatMessage(_onFinish: unknown, options?: OnChatMessageOptions) {
		const result = streamText({
			model: createChatModel(this.env),
			system: buildSystemPrompt(new Date()),
			messages: normalizeIncomingMessages(
				await convertToModelMessages(this.messages)
			),
			tools: buildChatTools(this, this.mcp.getAITools()),
			stopWhen: stepCountIs(5),
			abortSignal: options?.abortSignal
		});

		return result.toUIMessageStreamResponse();
	}

	async executeTask(description: string, _task: Schedule<string>) {
		// Do the actual work here (send email, call API, etc.)
		console.log(`Executing scheduled task: ${description}`);

		// Notify connected clients via a broadcast event.
		// We use broadcast() instead of saveMessages() to avoid injecting
		// into chat history — that would cause the AI to see the notification
		// as new context and potentially loop.
		this.broadcast(
			JSON.stringify({
				type: "scheduled-task",
				description,
				timestamp: new Date().toISOString()
			})
		);
	}
}

export default {
	async fetch(request: Request, env: Env) {
		return (
			(await routeAgentRequest(request, env)) ||
			new Response("Not found", { status: 404 })
		);
	}
} satisfies ExportedHandler<Env>;
