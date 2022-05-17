// Imports
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import passport from 'passport';
import cookieSession from 'cookie-session';
import { uid } from 'uid';
import dotenv from 'dotenv';
import GoogleOAuth from 'passport-google-oauth20';
import { Request } from 'express';
// Utils
import { encrypt } from './utils/Encryption';
import VerfiyToken from './utils/VerfiyToken';
import { SendEmail, templates } from './utils/SendEmail';

const GoogleStrategy = GoogleOAuth.Strategy;
dotenv.config();
const app = express();
// Routes Imports
import SignUpRoute from './routes/SignUp';
import LogInRoute from './routes/Login';
import MeRoute from './routes/Me';
import ResendVerifyEmailRoute from './routes/ResendVerifyEmail';
import VerfiyTokenRoute from './routes/VerifyToken';
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	cookieSession({
		maxAge: 24 * 60 * 60 * 1000,
		keys: [process.env.COOKIE_SECRET as string],
	}),
);
app.use(passport.initialize());
app.use(passport.session());

// Passport
passport.serializeUser((user: any, done) => {
	done(null, user.userid);
});

passport.deserializeUser((user: any, done) => {
	db.query(
		`SELECT * FROM all_users WHERE userid = '${user.userid}'`,
		(err: any, results: any) => {
			if (err) {
				console.log(err);
			} else {
				done(null, results[0]);
			}
		},
	);
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: process.env.GOOGLE_CALLBACK_URL,
		},
		async (accessToken, refreshToken, profile, done) => {
			if (!profile.emails) {
				return done(null, false);
			}
			const [results]: any = await db.query(
				`SELECT * FROM all_users WHERE email = '${profile.emails[0].value}'`,
			);

			if (results.length > 0) {
				done(null, results[0]);
			} else {
				const userid = uid(10);
				const email = profile.emails[0].value;
				const nameCipher = encrypt(profile.displayName);

				const [results]: any = await db.query(
					`INSERT INTO all_users (userid, email, name, password) VALUES ('G-${userid}', '${email}', '${nameCipher}', null)`,
				);
				SendEmail(email, {
					type: templates.newUserViaGoogle,
					name: profile.displayName,
				});
				done(null, results[0]);
			}
		},
	),
);

// Connect to database
const pool = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
});

const db = pool.promise();
// Routes
app.get(
	'/auth/google',
	passport.authenticate('google', { scope: ['profile', 'email'] }),
);
app.get(
	'/auth/google/callback',
	passport.authenticate('google', { failureRedirect: '/fail' }),
	(req, res) => {
		res.send(req.user);
	},
);
app.get('/', (req, res) => {
	res.send('Welcome to FanFic2Book API');
});
app.get('/fail', (req, res) => {
	res.send('Failed');
});
app.post(
	'/signup',
	(
		req: Request<
			{},
			{},
			{
				nameCipher: string;
				emailCipher: string;
				passwordCipher: string;
				ip?: string;
			},
			{},
			Record<string, any>
		>,
		res,
	) => {
		SignUpRoute(req, res, db);
	},
);
app.get(
	'/login',
	(
		req: Request<
			{},
			{},
			{},
			{
				email: string;
				password: string;
			},
			Record<string, any>
		>,
		res,
	) => LogInRoute(req, res, db),
);
app.get('/me', async (req, res) => MeRoute(req, res, db));
app.get(
	'/verify/resend',
	async (
		req: Request<
			{},
			{},
			{},
			{
				userid: string;
			},
			Record<string, any>
		>,
		res,
	) => ResendVerifyEmailRoute(req, res, db),
);
app.get(
	'/verify',
	async (
		req: Request<
			{},
			{},
			{},
			{
				token: string;
			},
			Record<string, any>
		>,
		res,
	) => VerfiyTokenRoute(req, res, db),
);
app.post('/logout', async (req, res) => {
	const bearerHeader = req.headers.authorization;
	const ip = req.ip;
	if (!bearerHeader) return;
	const user = await VerfiyToken(req);
	if ('message' in user) return res.status(500).send(user);
	if (user.userid.startsWith('G-')) {
		req.logout();
		delete req.user;
		return res.status(200).send('logged out');
	}
	if (user.userid.startsWith('T-')) {
		return res.status(200).send('logged out');
	}
});
const port = process.env.PORT || 5005;
app.listen(port, () => {
	console.log(`listening on *:${port}`);
});
