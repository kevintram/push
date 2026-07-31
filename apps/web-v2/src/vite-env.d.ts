/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_CONVEX_URL: string
	readonly VITE_WORKOS_CLIENT_ID: string
	readonly VITE_WORKOS_REDIRECT_URI: string
	readonly VITE_WORKOS_SIGN_OUT_RETURN_TO: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

declare const __APP_BRANCH__: string
