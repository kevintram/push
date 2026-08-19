import * as stylex from '@stylexjs/stylex'
import { Copy } from 'lucide-react'

import { SidebarItem } from '~/components/sidebar-item'
import { colors } from '~/styles/colors.stylex'

import { useHideMode } from '../hide-mode/useHideMode'

const styles = stylex.create({
	hideModeOn: {
		backgroundColor: {
			default: colors.bgSurfaceInfo,
			':hover': colors.bgSurfaceInfoHover,
		},
		color: colors.textInfo,
	},
})

export function HideModeButton() {
	const { hideMode, toggleHideMode } = useHideMode()

	return (
		<SidebarItem
			aria-pressed={hideMode === 'on'}
			icon={Copy}
			onClick={toggleHideMode}
			text='Hide Mode'
			xstyle={hideMode === 'on' && styles.hideModeOn}
		/>
	)
}
