import { Button, type ButtonProps } from './Button'

export interface ButtonIconProps extends Omit<
	ButtonProps,
	'children' | 'iconOnly'
> {
	children?: React.ReactNode
}

export function ButtonIcon({ ...props }: ButtonIconProps) {
	return <Button {...props} iconOnly />
}
