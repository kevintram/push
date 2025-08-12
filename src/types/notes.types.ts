import type { Tables } from './database.types'

export type Practice = Tables<'practice'>

export type Note = Tables<'notes'> & {
	practice: Array<Practice>
}
