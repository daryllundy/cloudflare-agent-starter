import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Text } from "@cloudflare/kumo";
import { Toasty } from "@cloudflare/kumo/components/toast";
import { ImageIcon } from "@phosphor-icons/react";
import { ChatHeader } from "./components/chat-header";
import { ChatInput } from "./components/chat-input";
import { MessageList } from "./components/message-list";
import { useAttachments } from "./hooks/use-attachments";
import { useChatAgent } from "./hooks/use-chat-agent";

function Chat() {
	const [input, setInput] = useState("");
	const [showDebug, setShowDebug] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const {
		addToolApprovalResponse,
		agent,
		clearHistory,
		connected,
		isStreaming,
		mcpState,
		messages,
		sendMessage,
		stop
	} = useChatAgent();
	const {
		addFiles,
		attachments,
		buildMessageParts,
		handleDragLeave,
		handleDragOver,
		handleDrop,
		handlePaste,
		isDragging,
		removeAttachment
	} = useAttachments();

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const send = useCallback(async () => {
		const text = input.trim();
		if ((!text && attachments.length === 0) || isStreaming) return;

		setInput("");
		const parts = text ? [{ type: "text" as const, text }] : [];
		const fileParts = await buildMessageParts();
		sendMessage({
			role: "user",
			parts: [...parts, ...fileParts]
		});
	}, [
		attachments.length,
		buildMessageParts,
		input,
		isStreaming,
		sendMessage
	]);

	const sendStarterPrompt = useCallback(
		(prompt: string) => {
			sendMessage({
				role: "user",
				parts: [{ type: "text", text: prompt }]
			});
		},
		[sendMessage]
	);

	const handleAddServer = useCallback(
		async (name: string, url: string) => {
			try {
				await agent.stub.addServer(name, url);
			} catch (error) {
				console.error("Failed to add MCP server:", error);
			}
		},
		[agent.stub]
	);

	const handleRemoveServer = useCallback(
		async (serverId: string) => {
			try {
				await agent.stub.removeServer(serverId);
			} catch (error) {
				console.error("Failed to remove MCP server:", error);
			}
		},
		[agent.stub]
	);

	return (
		<div
			className="flex flex-col h-screen bg-kumo-elevated relative"
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{isDragging && (
				<div className="absolute inset-0 z-50 flex items-center justify-center bg-kumo-elevated/80 backdrop-blur-sm border-2 border-dashed border-kumo-brand rounded-xl m-2 pointer-events-none">
					<div className="flex flex-col items-center gap-2 text-kumo-brand">
						<ImageIcon size={40} />
						<Text variant="heading3">Drop images here</Text>
					</div>
				</div>
			)}

			<ChatHeader
				connected={connected}
				mcpState={mcpState}
				onAddServer={handleAddServer}
				onClearHistory={clearHistory}
				onRemoveServer={handleRemoveServer}
				setShowDebug={setShowDebug}
				showDebug={showDebug}
			/>

			<MessageList
				addToolApprovalResponse={addToolApprovalResponse}
				isStreaming={isStreaming}
				messages={messages}
				onStarterPrompt={sendStarterPrompt}
				showDebug={showDebug}
			/>

			<div ref={messagesEndRef} />

			<ChatInput
				attachments={attachments}
				connected={connected}
				input={input}
				isStreaming={isStreaming}
				onAddFiles={addFiles}
				onInputChange={setInput}
				onPaste={handlePaste}
				onRemoveAttachment={removeAttachment}
				onSend={() => void send()}
				onStop={stop}
			/>
		</div>
	);
}

export default function App() {
	return (
		<Toasty>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-screen text-kumo-inactive">
						Loading...
					</div>
				}
			>
				<Chat />
			</Suspense>
		</Toasty>
	);
}
