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
