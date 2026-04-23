import { getSchedulePrompt } from "agents/schedule";

export const STARTER_PROMPTS = [
	"What's the weather in Paris?",
	"What timezone am I in?",
	"Calculate 5000 * 3",
	"Remind me in 5 minutes to take a break"
] as const;

const SYSTEM_PROMPT_INTRO =
	"You are a helpful assistant that can understand images. You can check the weather, get the user's timezone, run calculations, and schedule tasks. When users share images, describe what you see and answer questions about them.";

const SYSTEM_PROMPT_OUTRO =
	"If the user asks to schedule a task, use the schedule tool to schedule the task.";

export function buildSystemPrompt(date: Date): string {
	return `${SYSTEM_PROMPT_INTRO}

${getSchedulePrompt({ date })}

${SYSTEM_PROMPT_OUTRO}`;
}
