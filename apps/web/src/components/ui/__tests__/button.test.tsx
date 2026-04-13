import { render, screen } from "@testing-library/react"
import { ArrowLeftRight, Plus } from "lucide-react"
import { describe, expect, it } from "vitest"
import { TopicDetailReviewCardFilterControls } from "~/app/pages/topic-detail/TopicDetailReviewCardControls"
import { Button, buttonVariants } from "../button"

describe("buttonVariants", () => {
	it("does not apply rounded-full globally to shared small button sizes", () => {
		expect(buttonVariants({ size: "xs" })).not.toContain("rounded-full")
		expect(buttonVariants({ size: "sm" })).not.toContain("rounded-full")
		expect(buttonVariants({ size: "icon-xs" })).not.toContain("rounded-full")
		expect(buttonVariants({ size: "icon-sm" })).not.toContain("rounded-full")
	})

	it("scales inherited button icons by shell size while preserving hardcoded icon sizing opt-outs", () => {
		expect(buttonVariants({ size: "xs" })).toContain("button-inherit-icon-xs")
		expect(buttonVariants({ size: "sm" })).toContain("button-inherit-icon-sm")
		expect(buttonVariants({ size: "default" })).toContain(
			"button-inherit-icon-default"
		)
		expect(buttonVariants({ size: "lg" })).toContain("button-inherit-icon-lg")
	})

	it("keeps arrow-left-right icons eligible for inherited sizing despite the lucide class name", () => {
		render(
			<Button size='icon-xs' variant='ghost'>
				<ArrowLeftRight data-testid='arrow-icon' />
			</Button>
		)
		const icon = screen.getByTestId("arrow-icon")
		expect(icon.getAttribute("class")).toContain("lucide-arrow-left-right")
		expect(
			icon.matches(
				":not([class^='size-']):not([class*=' size-']):not([class^='h-']):not([class*=' h-']):not([class^='w-']):not([class*=' w-'])"
			)
		).toBe(true)
	})

	it("excludes svgs with explicit size classes from inherited sizing", () => {
		render(
			<Button size='icon-xs' variant='ghost'>
				<Plus className='size-4' data-testid='plus-icon' />
			</Button>
		)
		const icon = screen.getByTestId("plus-icon")
		expect(
			icon.matches(
				":not([class^='size-']):not([class*=' size-']):not([class^='h-']):not([class*=' h-']):not([class^='w-']):not([class*=' w-'])"
			)
		).toBe(false)
	})

	it("keeps topic detail review-card controls locally rounded", () => {
		render(
			<TopicDetailReviewCardFilterControls
				activeFilter='all'
				controlsVariant='medium'
				onFilterChange={() => {}}
			/>
		)

		expect(screen.getByRole("button", { name: "All" })).toHaveClass(
			"rounded-full"
		)
	})
})
