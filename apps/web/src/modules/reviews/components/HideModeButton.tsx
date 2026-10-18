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
import {
	appSidebar,
	fontSizes,
	fontWeights,
	iconWeights,
} from '~/styles/tokens.stylex'

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
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
	},
})

// Styled like SidebarIconButton, but one Button element serves both the
// icon-only and labeled states so toggling keeps focus on it.
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
					<Button
						aria-label='Hide mode'
						aria-pressed={isOn}
						iconOnly={!isLabeled}
						onClick={toggleHideMode}
						shape='round'
						size='small'
						variant='ghost'
						xstyle={isOn && styles.hideModeOn}
					>
						{isLabeled && 'Hiding'}
						<Copy
							aria-hidden='true'
							size={appSidebar.iconSize}
							strokeWidth={iconWeights.medium}
						/>
					</Button>
				}
			/>
			<TooltipContent side={tooltipSide}>
				{isOn ? 'Show answers and notes' : 'Hide answers and notes'}
				<Kbd>{formatForDisplay(HIDE_MODE_HOTKEY)}</Kbd>
			</TooltipContent>
		</Tooltip>
	)
}
