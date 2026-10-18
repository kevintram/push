import * as stylex from '@stylexjs/stylex'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { Copy } from 'lucide-react'

import { SidebarIconButton } from '~/components/sidebar'
import { Kbd, Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { hideModeButtonColors } from '~/styles/colors/components.stylex'

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
	const isLabeled = showLabel && isOn

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<SidebarIconButton
						aria-label='Hide mode'
						aria-pressed={isOn}
						icon={Copy}
						label={isLabeled ? 'Hiding' : undefined}
						onClick={toggleHideMode}
						xstyle={isOn && styles.hideModeOn}
					/>
				}
			/>
			<TooltipContent side={tooltipSide}>
				{isOn ? 'Show answers and notes' : 'Hide answers and notes'}
				<Kbd>{formatForDisplay(HIDE_MODE_HOTKEY)}</Kbd>
			</TooltipContent>
		</Tooltip>
	)
}
