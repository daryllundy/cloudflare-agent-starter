import type { ModelMessage } from "ai";

type SupportedOperator = "+" | "-" | "*" | "/" | "%";

export function inlineDataUrls(messages: ModelMessage[]): ModelMessage[] {
	return messages.map((msg) => {
		if (msg.role !== "user" || typeof msg.content === "string") return msg;

		return {
			...msg,
			content: msg.content.map((part) => {
				if (part.type !== "file" || typeof part.data !== "string")
					return part;

				const match = part.data.match(/^data:([^;]+);base64,(.+)$/);
				if (!match) return part;

				const bytes = Uint8Array.from(atob(match[2]), (c) =>
					c.charCodeAt(0)
				);
				return { ...part, data: bytes, mediaType: match[1] };
			})
		};
	});
}

export function calculateExpression(
	a: number,
	b: number,
	operator: SupportedOperator
) {
	const operations: Record<
		SupportedOperator,
		(x: number, y: number) => number
	> = {
		"+": (x, y) => x + y,
		"-": (x, y) => x - y,
		"*": (x, y) => x * y,
		"/": (x, y) => x / y,
		"%": (x, y) => x % y
	};

	if (operator === "/" && b === 0) {
		return { error: "Division by zero" } as const;
	}

	return {
		expression: `${a} ${operator} ${b}`,
		result: operations[operator](a, b)
	} as const;
}

type ScheduleWhen =
	| { type: "no-schedule" }
	| { type: "scheduled"; date: string }
	| { type: "delayed"; delayInSeconds: number }
	| { type: "cron"; cron: string };

export function getScheduleInput(when: ScheduleWhen) {
	if (when.type === "no-schedule") return null;
	if (when.type === "scheduled") return when.date;
	if (when.type === "delayed") return when.delayInSeconds;
	return when.cron;
}
