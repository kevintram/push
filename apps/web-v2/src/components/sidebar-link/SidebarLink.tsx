import { FatSidebarLink } from './FatSidebarLink'
import {
	type BaseSidebarLinkProps,
	type SidebarLinkVariant,
} from './SidebarLink.types'
import { SkinnySidebarLink } from './SkinnySidebarLink'

type SidebarLinkProps = BaseSidebarLinkProps & {
	variant?: SidebarLinkVariant
}

export function SidebarLink({ variant = 'fat', ...props }: SidebarLinkProps) {
	if (variant === 'skinny') {
		return <SkinnySidebarLink {...props} />
	}

	return <FatSidebarLink {...props} />
}
