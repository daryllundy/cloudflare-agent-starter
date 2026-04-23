import { Button, Empty } from "@cloudflare/kumo";
import type { UIMessage } from "ai";
import { ChatCircleDotsIcon } from "@phosphor-icons/react";
import { STARTER_PROMPTS } from "../chat-config";
import {
	ImagePartView,
	ReasoningPartView,
	TextPartView,
	ToolPartView
} from "./message-parts";

interface MessageListProps {
	addToolApprovalResponse: (response: {
		id: string;
		approved: boolean;
	}) => void;
	isStreaming: boolean;
	messages: UIMessage[];
	onStarterPrompt: (prompt: string) => void;
	showDebug: boolean;
}

export function MessageList({
	addToolApprovalResponse,
	isStreaming,
	messages,
	onStarterPrompt,
	showDebug
}: MessageListProps) {
	return (
		<div className="flex-1 overflow-y-auto">
			<div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
				{messages.length === 0 && (
					<Empty
						icon={<ChatCircleDotsIcon size={32} />}
						title="Start a conversation"
						contents={
							<div className="flex flex-wrap justify-center gap-2">
								{STARTER_PROMPTS.map((prompt) => (
									<Button
										key={prompt}
										variant="outline"
										size="sm"
										disabled={isStreaming}
										onClick={() => onStarterPrompt(prompt)}
									>
										{prompt}
									</Button>
								))}
							</div>
						}
					/>
				)}

				{messages.map((message, index) => {
					const isUser = message.role === "user";
					const isLastAssistant =
						message.role === "assistant" &&
						index === messages.length - 1;

					return (
						<div key={message.id} className="space-y-2">
							{showDebug && (
								<pre className="text-[11px] text-kumo-subtle bg-kumo-control rounded-lg p-3 overflow-auto max-h-64">
									{JSON.stringify(message, null, 2)}
								</pre>
							)}

							{message.parts.map((part, partIndex) => {
								const key =
									("toolCallId" in part && part.toolCallId) ||
									`${message.id}-${part.type}-${partIndex}`;

								return (
									<div key={key}>
										<ToolPartView
											part={part}
											addToolApprovalResponse={
												addToolApprovalResponse
											}
										/>
										<ReasoningPartView
											part={part}
											isStreaming={isStreaming}
										/>
										<ImagePartView
											part={part}
											isUser={isUser}
										/>
										<TextPartView
											part={part}
											isLastAssistant={isLastAssistant}
											isStreaming={isStreaming}
											isUser={isUser}
										/>
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
		</div>
	);
}
