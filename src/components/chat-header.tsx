import type { MCPServersState } from "agents";
import { Badge, Button, Switch, Text } from "@cloudflare/kumo";
import {
	BugIcon,
	ChatCircleDotsIcon,
	CircleIcon,
	TrashIcon
} from "@phosphor-icons/react";
import { McpPanel } from "./mcp-panel";
import { ThemeToggle } from "./theme-toggle";

interface ChatHeaderProps {
	connected: boolean;
	mcpState: MCPServersState;
	onAddServer: (name: string, url: string) => Promise<void>;
	onClearHistory: () => void;
	onRemoveServer: (serverId: string) => Promise<void>;
	runtimeConfig: {
		model: string;
		provider: "openai" | "workers-ai";
	} | null;
	setShowDebug: (showDebug: boolean) => void;
	showDebug: boolean;
}

export function ChatHeader({
	connected,
	mcpState,
	onAddServer,
	onClearHistory,
	onRemoveServer,
	runtimeConfig,
	setShowDebug,
	showDebug
}: ChatHeaderProps) {
	return (
		<header className="px-5 py-4 bg-kumo-base border-b border-kumo-line">
			<div className="max-w-3xl mx-auto flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h1 className="text-lg font-semibold text-kumo-default">
						<span className="mr-2">⛅</span>Agent Starter
					</h1>
					<Badge variant="secondary">
						<ChatCircleDotsIcon
							size={12}
							weight="bold"
							className="mr-1"
						/>
						AI Chat
					</Badge>
					{runtimeConfig && (
						<Badge variant="secondary" className="font-mono">
							{runtimeConfig.model}
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5">
						<CircleIcon
							size={8}
							weight="fill"
							className={
								connected
									? "text-kumo-success"
									: "text-kumo-danger"
							}
						/>
						<Text size="xs" variant="secondary">
							{connected ? "Connected" : "Disconnected"}
						</Text>
					</div>
					<div className="flex items-center gap-1.5">
						<BugIcon size={14} className="text-kumo-inactive" />
						<Switch
							checked={showDebug}
							onCheckedChange={setShowDebug}
							size="sm"
							aria-label="Toggle debug mode"
						/>
					</div>
					<ThemeToggle />
					<McpPanel
						mcpState={mcpState}
						onAddServer={onAddServer}
						onRemoveServer={onRemoveServer}
					/>
					<Button
						variant="secondary"
						icon={<TrashIcon size={16} />}
						onClick={onClearHistory}
					>
						Clear
					</Button>
				</div>
			</div>
		</header>
	);
}
