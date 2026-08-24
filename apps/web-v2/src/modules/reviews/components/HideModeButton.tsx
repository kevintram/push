import * as stylex from '@stylexjs/stylex'
import { Copy } from 'lucide-react'

import { AppRailItem } from '~/components/app-rail-item'
import { hideModeButtonColors } from '~/styles/colors/components.stylex'

import { useHideMode } from '../hide-mode/useHideMode'

const styles = stylex.create({
	hideModeOn: {
		backgroundColor: {
			default: hideModeButtonColors.backgroundActive,
			':hover': hideModeButtonColors.backgroundActiveHover,
		},
		color: hideModeButtonColors.foregroundActive,
	},
})

export function HideModeButton() {
	const { hideMode, toggleHideMode } = useHideMode()

	return (
		<AppRailItem
			aria-pressed={hideMode === 'on'}
			icon={Copy}
			onClick={toggleHideMode}
			text='Hide Mode'
			variant='outline'
			xstyle={hideMode === 'on' && styles.hideModeOn}
		/>
	)
}
