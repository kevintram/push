import dayjs from "dayjs";

export interface DueDateDisplayInfo {
	dueDate: string;
	isUpcoming: boolean;
	displayText: string;
}

/**
 * Calculates the display text and metadata for a due date.
 * Returns null if no due date is provided.
 */
export function getRelativeDateDisplay(
	due: string | null,
): DueDateDisplayInfo | null {
	if (!due) return null;

	const now = dayjs().startOf("day");
	const dueDayjs = dayjs(due).startOf("day");
	const diffDays = dueDayjs.diff(now, "day");
	const isUpcoming = dueDayjs.isAfter(now);

	let displayText: string;
	if (diffDays === 0) {
		displayText = "Today";
	} else if (diffDays === 1) {
		displayText = "Tomorrow";
	} else if (diffDays === -1) {
		displayText = "Yesterday";
	} else if (isUpcoming) {
		displayText = `in ${diffDays}d`;
	} else {
		displayText = `${Math.abs(diffDays)}d ago`;
	}

	return {
		dueDate: due,
		isUpcoming,
		displayText,
	};
}

/**
 * Returns the appropriate Tailwind color class for a due date display.
 * When SRS is disabled, always returns muted-foreground.
 * When SRS is enabled: Today = blue, Overdue = red, otherwise muted-foreground.
 */
export function getDateColor(
	displayText: string | null,
	srsEnabled = true,
): string {
	if (!srsEnabled) return "text-muted-foreground";

	if (displayText === "Today") {
		return "text-blue-600 dark:text-blue-400";
	}

	if (displayText === "Yesterday" || displayText?.includes("ago")) {
		return "text-red-600 dark:text-red-400";
	}

	return "text-muted-foreground";
}
