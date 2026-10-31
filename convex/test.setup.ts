/// <reference types="vite/client" />

/*
 * `convex-test` needs a module map of every function file to run the backend
 * in-process. `import.meta.glob` is Vite-only, so this file must never be
 * bundled for a real deploy.
 *
 * It is excluded only because the Convex bundler skips any filename containing
 * more than one dot. Keep the two dots in `test.setup.ts` — renaming this to
 * something like `testSetup.ts` would silently turn it into a deploy entry
 * point and break `convex deploy` on the unresolved `import.meta.glob`.
 */
export const modules = import.meta.glob('./**/*.ts')
