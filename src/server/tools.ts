import { scheduleSchema } from "agents/schedule";
import { tool } from "ai";
import { z } from "zod";
import { calculateExpression, getScheduleInput } from "../chat-logic";
import type { ChatAgent } from "../server";

const WEATHER_CONDITIONS = ["sunny", "cloudy", "rainy", "snowy"] as const;

function buildWeatherTool() {
	return tool({
		description: "Get the current weather for a city",
		inputSchema: z.object({
			city: z.string().describe("City name")
		}),
		execute: async ({ city }) => {
			const temperature = Math.floor(Math.random() * 30) + 5;
			return {
				city,
				temperature,
				condition:
					WEATHER_CONDITIONS[
						Math.floor(Math.random() * WEATHER_CONDITIONS.length)
					],
				unit: "celsius"
			};
		}
	});
}

function buildTimezoneTool() {
	return tool({
		description:
			"Get the user's timezone from their browser. Use this when you need to know the user's local time.",
		inputSchema: z.object({})
	});
}

function buildCalculationTool() {
	return tool({
		description:
			"Perform a math calculation with two numbers. Requires user approval for large numbers.",
		inputSchema: z.object({
			a: z.number().describe("First number"),
			b: z.number().describe("Second number"),
			operator: z
				.enum(["+", "-", "*", "/", "%"])
				.describe("Arithmetic operator")
		}),
		needsApproval: async ({ a, b }) =>
			Math.abs(a) > 1000 || Math.abs(b) > 1000,
		execute: async ({ a, b, operator }) =>
			calculateExpression(a, b, operator)
	});
}

function buildScheduleTaskTool(agent: ChatAgent) {
	return tool({
		description:
			"Schedule a task to be executed at a later time. Use this when the user asks to be reminded or wants something done later.",
		inputSchema: scheduleSchema,
		execute: async ({ when, description }) => {
			const input = getScheduleInput(when);
			if (!input) return "Invalid schedule type";

			try {
				agent.schedule(input, "executeTask", description, {
					idempotent: true
				});
				return `Task scheduled: "${description}" (${when.type}: ${input})`;
			} catch (error) {
				return `Error scheduling task: ${error}`;
			}
		}
	});
}

function buildGetScheduledTasksTool(agent: ChatAgent) {
	return tool({
		description: "List all tasks that have been scheduled",
		inputSchema: z.object({}),
		execute: async () => {
			const tasks = agent.getSchedules();
			return tasks.length > 0 ? tasks : "No scheduled tasks found.";
		}
	});
}

function buildCancelScheduledTaskTool(agent: ChatAgent) {
	return tool({
		description: "Cancel a scheduled task by its ID",
		inputSchema: z.object({
			taskId: z.string().describe("The ID of the task to cancel")
		}),
		execute: async ({ taskId }) => {
			try {
				agent.cancelSchedule(taskId);
				return `Task ${taskId} cancelled.`;
			} catch (error) {
				return `Error cancelling task: ${error}`;
			}
		}
	});
}

export function buildChatTools<TMcpTools extends Record<string, unknown>>(
	agent: ChatAgent,
	mcpTools: TMcpTools
) {
	return {
		...mcpTools,
		getWeather: buildWeatherTool(),
		getUserTimezone: buildTimezoneTool(),
		calculate: buildCalculationTool(),
		scheduleTask: buildScheduleTaskTool(agent),
		getScheduledTasks: buildGetScheduledTasksTool(agent),
		cancelScheduledTask: buildCancelScheduledTaskTool(agent)
	};
}
