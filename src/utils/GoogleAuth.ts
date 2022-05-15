import dotenv from 'dotenv';
dotenv.config();
export default () => {
	const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
	const options: any = {
		client_id: process.env.GOOGLE_CLIENT_ID,
		redirect_uri: process.env.GOOGLE_REDIRECT_URI,
		response_type: 'code',
		scope: [
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/userinfo.profile',
		],
		access_type: 'offline',
		prompt: 'consent',
	};
	const qs = Object.keys(options)
		.map((key) => key + '=' + options[key])
		.join('&');

	const url = `${rootUrl}?${qs}`;
	return url;
};
