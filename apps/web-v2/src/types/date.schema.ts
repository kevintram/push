import * as v from 'valibot'

import type { DateString } from './date'

/** Parses an API date string into the frontend's canonical `DateString`. */
export const DateStringSchema = v.pipe(
	v.string(),
	v.transform(value => value as DateString),
)
