import { KeyboardShortcutHint } from '~/components/ui/keyboard-shortcut-hint'

export function SearchShortcutHint({ className }: { className?: string }) {
	return <KeyboardShortcutHint className={className} keyLabel='K' />
}
