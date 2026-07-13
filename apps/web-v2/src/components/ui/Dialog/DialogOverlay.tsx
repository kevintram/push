import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import * as stylex from '@stylexjs/stylex'

export interface DialogOverlayProps extends Omit<
	DialogPrimitive.Backdrop.Props,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	overlay: {
		inset: 0,
		position: 'fixed',
		zIndex: 50,

		backdropFilter: 'blur(2px)',
		backgroundColor: 'rgb(0 0 0 / 0.32)',
		opacity: {
			default: 1,
			':is([data-starting-style], [data-ending-style])': 0,
		},
		transitionDuration: {
			default: '120ms',
			'@media (prefers-reduced-motion: reduce)': '0ms',
		},
		transitionProperty: 'opacity',
		transitionTimingFunction: 'ease-out',
	},
})

export function DialogOverlay({ xstyle, ...props }: DialogOverlayProps) {
	return (
		<DialogPrimitive.Backdrop
			{...stylex.props(styles.overlay, xstyle)}
			{...props}
		/>
	)
}
