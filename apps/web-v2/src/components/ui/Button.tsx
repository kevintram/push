import { Button as BaseButton } from '@base-ui/react/button'
import clsx from 'clsx'
import type { ComponentPropsWithoutRef } from 'react'
import { type ButtonVariants, button } from './Button.css'

export type ButtonProps = ComponentPropsWithoutRef<typeof BaseButton> &
	ButtonVariants

export function Button({ className, size, variant, ...props }: ButtonProps) {
	return (
		<BaseButton
			className={clsx(button({ size, variant }), className)}
			{...props}
		/>
	)
}
