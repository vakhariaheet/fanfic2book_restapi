declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DB_HOST: string;
			DB_USER: string;
			DB_PASSWORD: string;
			DB_DATABASE: string;
			JWT_TOKEN: string;
			SENDGRID_API_KEY: string;
			FRONTEND_URL: string;
			GOOGLE_CLIENT_ID: string;
			GOOGLE_CLIENT_SECRET: string;
			GOOGLE_CALLBACK_URL: string;
			COOKIE_SECRET: string;
			ENCRYPTION_KEY: string;
		}
	}
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
