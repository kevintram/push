import * as stylex from '@stylexjs/stylex'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { Copy } from 'lucide-react'

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
					<Button.Icon
						aria-label='Hide mode'
						aria-pressed={hideMode === 'on'}
						onClick={toggleHideMode}
						shape='round'
						size='small'
						variant='ghost'
						xstyle={hideMode === 'on' && styles.hideModeOn}
					>
						<Copy
							aria-hidden='true'
							size={appSidebar.iconSize}
							strokeWidth={iconWeights.medium}
						/>
					</Button.Icon>
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
