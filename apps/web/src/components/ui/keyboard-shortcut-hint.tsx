import { useState } from "react"

import { cn } from "~/lib/utils"

import { Kbd, KbdGroup } from "./kbd"

function isApplePlatform() {
	if (typeof navigator === "undefined") return true

	const userAgentData = navigator as Navigator & {
		userAgentData?: { platform?: string }
	}
	const platform =
		(typeof userAgentData.userAgentData?.platform === "string" &&
			userAgentData.userAgentData.platform) ||
		navigator.platform ||
		navigator.userAgent

	return /mac|iphone|ipad|ipod/iu.test(platform)
}

export function KeyboardShortcutHint({
	className,
	keyLabel,
}: {
	className?: string
	keyLabel: string
}) {
	const [modifierKey] = useState(() => (isApplePlatform() ? "⌘" : "Ctrl"))

	return (
		<KbdGroup className={cn("shrink-0", className)}>
			<Kbd>{modifierKey}</Kbd>
			<Kbd>{keyLabel}</Kbd>
		</KbdGroup>
	)
}
