type Concat<T extends Array<string>> = T extends [
	infer F extends string,
	...infer R extends Array<string>
] ? `${F}${Concat<R>}` : '';

export function join<T extends Array<string>>(...strings: T): Concat<T> {
  return strings.join("") as Concat<T>;
}