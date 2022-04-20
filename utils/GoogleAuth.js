module.exports = () => {
	const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
	const options = {
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
	const qs = new URLSearchParams(options);
	const url = `${rootUrl}?${qs}`;
	return url;
};
