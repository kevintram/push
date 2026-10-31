import type { AppHotkey } from '@tanstack/react-hotkeys'
import type { ReactElement, Ref } from 'react'

import {
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { ShortcutKeys } from '~/modules/shortcuts/components/ShortcutKeys'

import type { CardTab } from './CardDetail'

type CardTabTriggerProps = {
	value: CardTab
	label: string
	hotkey: AppHotkey
	/** Renders the tab as this link, on the card page. */
	link?: ReactElement
	ref?: Ref<HTMLElement>
}

/** A card tab, with its key in a tooltip. */
export function CardTabTrigger({
	value,
	label,
	hotkey,
	link,
	ref,
}: CardTabTriggerProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<TabsTrigger
						ref={ref}
						value={value}
						nativeButton={link ? false : undefined}
						render={link}
					>
						{label}
					</TabsTrigger>
				}
			/>
			<TooltipContent>
				{label}
				<ShortcutKeys hotkey={hotkey} />
			</TooltipContent>
		</Tooltip>
	)
}
