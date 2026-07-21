import * as v from 'valibot'

/** Converts numeric API identifiers to the frontend's canonical string form. */
export const IdSchema = v.pipe(v.number(), v.transform(String))
