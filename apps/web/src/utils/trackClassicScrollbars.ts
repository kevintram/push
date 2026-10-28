// Compiles the variables that `global.css` reads.
import '~/styles/scrollbars.stylex'

const PROBE_ATTRIBUTE = 'data-scrollbar-probe'

/**
 * Sets `data-classic-scrollbars` on `<html>` while scrollbars take up layout
 * space, such as on Windows or with macOS's "Show scroll bars: Always", and
 * `--scrollbar-width` to the space they take. `global.css` restyles only
 * those; overlay scrollbars stay native.
 *
 * A hidden probe that always scrolls is observed, so the attribute follows
 * system setting changes, like plugging in a mouse on macOS.
 */
export function trackClassicScrollbars() {
	if (document.querySelector(`[${PROBE_ATTRIBUTE}]`)) return

	const probe = document.createElement('div')
	probe.setAttribute(PROBE_ATTRIBUTE, '')
	probe.setAttribute('aria-hidden', 'true')
	probe.style.cssText =
		'position:fixed;top:0;left:0;width:100px;height:100px;overflow:scroll;visibility:hidden;pointer-events:none'
	document.body.append(probe)

	const update = () => {
		const width = probe.offsetWidth - probe.clientWidth
		const root = document.documentElement
		root.toggleAttribute('data-classic-scrollbars', width > 0)
		root.style.setProperty('--scrollbar-width', `${width}px`)
	}
	update()
	// The content box shrinks when scrollbars start taking space.
	new ResizeObserver(update).observe(probe)
}
