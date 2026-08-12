import * as stylex from '@stylexjs/stylex'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	type DialogHandle,
} from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import { iconSizes, radii, spacing } from '~/styles/tokens.stylex'

type FocusOverlayProps = {
	handle: DialogHandle
}

const styles = stylex.create({
	content: {
		gap: 0,
		display: 'flex',
		flexDirection: 'column',

		paddingBlockEnd: 0,
		paddingBlockStart: 0,
	},
	inner: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,

		borderRadius: radii.lg,
		backgroundColor: colors.bgFill,
	},
	header: {
		display: 'flex',
		justifyContent: 'end',

		paddingBlock: spacing.md,
	},
	footer: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',

		padding: spacing['3xl'],
	},
})

export function FocusOverlay({ handle }: FocusOverlayProps) {
	return (
		<Dialog handle={handle}>
			<DialogContent
				size='fullscreen'
				xstyle={styles.content}
				showCloseButton={false}
			>
				<div {...stylex.props(styles.header)}>
					<DialogClose
						render={
							<Button.Icon
								aria-label='Close'
								shape='round'
								variant='ghost'
								size='small'
							/>
						}
					>
						<X aria-hidden='true' size={iconSizes.md} />
					</DialogClose>
				</div>
				<div {...stylex.props(styles.inner)}>Hello</div>
				<div {...stylex.props(styles.footer)}>
					<Button.Icon shape='round' variant='secondary'>
						<ChevronLeft size={iconSizes.lg} />
					</Button.Icon>
					<Button.Icon shape='round' variant='secondary'>
						<ChevronRight size={iconSizes.lg} />
					</Button.Icon>
				</div>
			</DialogContent>
		</Dialog>
	)
}
