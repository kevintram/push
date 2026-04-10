import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { TopicDetailReviewCardFilterControls } from "~/app/pages/topic-detail/TopicDetailReviewCardControls"
import { buttonVariants } from "../button"

describe("buttonVariants", () => {
	it("does not apply rounded-full globally to shared small button sizes", () => {
		expect(buttonVariants({ size: "xs" })).not.toContain("rounded-full")
		expect(buttonVariants({ size: "sm" })).not.toContain("rounded-full")
		expect(buttonVariants({ size: "icon-xs" })).not.toContain("rounded-full")
		expect(buttonVariants({ size: "icon-sm" })).not.toContain("rounded-full")
	})

	it("scales inherited button icons by shell size while preserving hardcoded icon sizing opt-outs", () => {
		expect(buttonVariants({ size: "xs" })).toContain(
			"[&_svg:not([class*='size-']):not([class*='h-']):not([class*='w-'])]:size-3.5"
		)
		expect(buttonVariants({ size: "sm" })).toContain(
			"[&_svg:not([class*='size-']):not([class*='h-']):not([class*='w-'])]:size-[1.125rem]"
		)
		expect(buttonVariants({ size: "default" })).toContain(
			"[&_svg:not([class*='size-']):not([class*='h-']):not([class*='w-'])]:size-[1.375rem]"
		)
		expect(buttonVariants({ size: "lg" })).toContain(
			"[&_svg:not([class*='size-']):not([class*='h-']):not([class*='w-'])]:size-[1.625rem]"
		)
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
