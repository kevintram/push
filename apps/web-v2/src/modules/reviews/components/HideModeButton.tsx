import * as stylex from '@stylexjs/stylex'
import { Copy } from 'lucide-react'

import { SidebarItem } from '~/components/sidebar-item'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
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
		<Tooltip>
			<TooltipTrigger
				render={
					<SidebarItem
						aria-pressed={hideMode === 'on'}
						icon={Copy}
						onClick={toggleHideMode}
						text='Hide Mode'
						variant='outline'
						xstyle={hideMode === 'on' && styles.hideModeOn}
					/>
				}
			/>
			<TooltipContent side='right'>
				{hideMode === 'on' ? 'Turn off hide mode' : 'Turn on hide mode'}
			</TooltipContent>
		</Tooltip>
	)
}
