export type GetPracticesParams = {
	inboxed?: boolean
	archived?: boolean
	srsEnabled?: boolean
	hasStability?: boolean
	order?: 'desc' | 'asc'
	limit?: number
}

export type SearchPracticesParams = {
	query?: string
	limit?: number
}

export type CreatePracticeInput = {
	prompt?: string
	answer?: string
	archived?: boolean
	inboxed?: boolean
	srs_enabled?: boolean
}

export type UpdatePracticeInput = {
	id: number
	prompt?: string
	answer?: string
	archived?: boolean
	inboxed?: boolean
	srs_enabled?: boolean
}

export type AddPracticeTopicInput =
	| {
			practiceId: number
			topicId: number
	  }
	| {
			practiceId: number
			topic: {
				name: string
				notes: string
				archived: boolean
				inboxed: boolean
				srs_enabled?: boolean
				inherit_fsrs?: boolean
			}
	  }

export type RemovePracticeTopicInput = {
	practiceId: number
	topicId: number
}

export type AddPracticeSourceInput =
	| {
			practiceId: number
			sourceId: number
	  }
	| {
			practiceId: number
			source: {
				title: string
				notes: string
				archived: boolean
				inboxed: boolean
				srs_enabled?: boolean
				inherit_fsrs?: boolean
			}
	  }

export type RemovePracticeSourceInput = {
	practiceId: number
	sourceId: number
}
