import * as stylex from '@stylexjs/stylex'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { Copy } from 'lucide-react'

import { SidebarItem } from '~/components/sidebar'
import { Kbd, Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { blue, whiteAlpha } from '~/styles/colors/primitives.stylex'
import {
	appSidebar,
	fontWeights,
	iconWeights,
	radii,
} from '~/styles/tokens.stylex'

import { HIDE_MODE_HOTKEY } from '../hide-mode/hideModeHotkey'
import { useHideMode } from '../hide-mode/useHideMode'

type HideModeButtonProps = {
	tooltipSide?: React.ComponentProps<typeof TooltipContent>['side']
	/** Shows "Hiding" next to the icon while hide mode is on. */
	showLabel?: boolean
}

const styles = stylex.create({
	hideModeOn: {
		backgroundColor: {
			default: `light-dark(${blue.s500}, ${blue.s800})`,
			':hover': `light-dark(${blue.s600}, ${blue.s700})`,
		},
		color: `light-dark(${whiteAlpha.s95}, ${blue.s100})`,
	},
	labeled: {
		borderRadius: radii.full,
		fontWeight: fontWeights.medium,
	},
})

export function HideModeButton({
	tooltipSide = 'bottom',
	showLabel = false,
}: HideModeButtonProps) {
	const { hideMode, toggleHideMode } = useHideMode()
	const isOn = hideMode === 'on'
	const isLabeled = showLabel && isOn

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					// The glyph is a child, not `icon`, so it can follow the label.
					// Toggling the label keeps this one element, so focus stays.
					<SidebarItem
						aria-label='Hide mode'
						aria-pressed={isOn}
						iconOnly={!isLabeled}
						onClick={toggleHideMode}
						xstyle={[
							isOn && styles.hideModeOn,
							isLabeled && styles.labeled,
						]}
					>
						{isLabeled && 'Hiding'}
						<Copy
							aria-hidden='true'
							size={appSidebar.iconSize}
							strokeWidth={iconWeights.medium}
						/>
					</SidebarItem>
				}
			/>
			<TooltipContent side={tooltipSide}>
				{isOn ? 'Show answers and notes' : 'Hide answers and notes'}
				<Kbd>{formatForDisplay(HIDE_MODE_HOTKEY)}</Kbd>
			</TooltipContent>
		</Tooltip>
	)
}
