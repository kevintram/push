import * as stylex from '@stylexjs/stylex'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { Copy } from 'lucide-react'

import { SidebarIconButton } from '~/components/sidebar'
import {
	Button,
	Kbd,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { hideModeButtonColors } from '~/styles/colors/components.stylex'
import { appSidebar, iconWeights } from '~/styles/tokens.stylex'

import { HIDE_MODE_HOTKEY } from '../hide-mode/hideModeHotkey'
import { useHideMode } from '../hide-mode/useHideMode'

type HideModeButtonProps = {
	tooltipSide?: 'top' | 'right' | 'bottom' | 'left'
	/** Shows "Hiding" next to the icon while hide mode is on. */
	showLabel?: boolean
}

const styles = stylex.create({
	hideModeOn: {
		backgroundColor: {
			default: hideModeButtonColors.backgroundActive,
			':hover': hideModeButtonColors.backgroundActiveHover,
		},
		color: hideModeButtonColors.foregroundActive,
	},
})

export function HideModeButton({
	tooltipSide = 'bottom',
	showLabel = false,
}: HideModeButtonProps) {
	const { hideMode, toggleHideMode } = useHideMode()
	const isOn = hideMode === 'on'

	// The accessible name stays "Hide mode" in both states; aria-pressed
	// carries the state.
	const triggerProps = {
		'aria-label': 'Hide mode',
		'aria-pressed': isOn,
		onClick: toggleHideMode,
		xstyle: isOn && styles.hideModeOn,
	}

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					showLabel && isOn ? (
						<Button
							{...triggerProps}
							shape='round'
							size='small'
							variant='ghost'
						>
							<Copy
								aria-hidden='true'
								size={appSidebar.iconSize}
								strokeWidth={iconWeights.medium}
							/>
							Hiding
						</Button>
					) : (
						<SidebarIconButton {...triggerProps} icon={Copy} />
					)
				}
			/>
			<TooltipContent side={tooltipSide}>
				{isOn ? 'Show answers and notes' : 'Hide answers and notes'}
				<Kbd>{formatForDisplay(HIDE_MODE_HOTKEY)}</Kbd>
			</TooltipContent>
		</Tooltip>
	)
}
