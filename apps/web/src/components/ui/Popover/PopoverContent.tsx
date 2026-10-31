import { Popover } from '@base-ui/react/popover'

import { PopoverPopup, type PopoverPopupProps } from './PopoverPopup'

export type PopoverContentProps = PopoverPopupProps

export function PopoverContent(props: PopoverContentProps) {
	return (
		<Popover.Portal>
			<PopoverPopup {...props} />
		</Popover.Portal>
	)
}
