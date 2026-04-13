import { render, screen } from "@testing-library/react"
import { ArrowLeftRight } from "lucide-react"
import { describe, expect, it } from "vitest"
import { InputGroupButton } from "../input-group"

describe("InputGroupButton", () => {
	it("forwards its size to Button so small input-group icons do not inherit the default button size", () => {
		render(
			<InputGroupButton size='xs' variant='ghost'>
				<ArrowLeftRight data-testid='arrow-icon' />
			</InputGroupButton>
		)

		const button = screen.getByRole("button")
		expect(button).toHaveClass("button-inherit-icon-xs")
		expect(button).not.toHaveClass("button-inherit-icon-default")
		expect(button).toHaveClass("!px-1.5")
	})

	it("keeps icon-sized input-group buttons aligned to their matching button size", () => {
		render(
			<InputGroupButton size='icon-sm' variant='ghost'>
				<ArrowLeftRight data-testid='arrow-icon' />
			</InputGroupButton>
		)

		const button = screen.getByRole("button")
		expect(button).toHaveClass("button-inherit-icon-sm")
		expect(button).not.toHaveClass("button-inherit-icon-default")
	})
})
