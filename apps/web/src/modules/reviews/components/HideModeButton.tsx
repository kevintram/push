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
}: HideModeButtonProps) {
	const { hideMode, toggleHideMode } = useHideMode()

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<SidebarIconButton
						aria-label='Hide mode'
						aria-pressed={hideMode === 'on'}
						icon={Copy}
						onClick={toggleHideMode}
						xstyle={hideMode === 'on' && styles.hideModeOn}
					/>
				}
			/>
			<TooltipContent side={tooltipSide}>
				{hideMode === 'on'
					? 'Show answers and notes'
					: 'Hide answers and notes'}
				<Kbd>{formatForDisplay(HIDE_MODE_HOTKEY)}</Kbd>
			</TooltipContent>
		</Tooltip>
	)
}
