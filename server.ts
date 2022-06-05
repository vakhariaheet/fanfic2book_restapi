// Imports
const express = require('express');
const app = express();
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const { encrypt, decrypt } = require('./utils/Encryption');
const SignJWT = require('./utils/SignJWT');
const VerfiyToken = require('./utils/VerfiyToken');
const SendEmail = require('./utils/SendEmail');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieSession = require('cookie-session');
const { uid } = require('uid');
require('dotenv').config();

// Routes Imports
const signUpRoute = require('./routes/SignUp.routes');
const logInRoute = require('./routes/Login.routes');
const MeRoute = require('./routes/Me.routes');
const ResendVerifyEmailRoute = require('./routes/ResendVerifyEmail.routes');
const VerfiyTokenRoute = require('./routes/VerifyToken.routes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	cookieSession({
		maxAge: 24 * 60 * 60 * 1000,
		keys: [process.env.COOKIE_KEY],
	}),
);
app.use(passport.initialize());
app.use(passport.session());

// Passport
passport.serializeUser((user, done) => {
	done(null, user.userid);
});

passport.deserializeUser((user, done) => {
	db.query(
		`SELECT * FROM all_users WHERE userid = '${user.userid}'`,
		(err, results) => {
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
			const [results] = await db.query(
				`SELECT * FROM all_users WHERE email = '${profile.emails[0].value}'`,
			);
			if (results.length > 0) {
				done(null, results[0]);
			} else {
				const userid = uid(10);
				const email = profile.emails[0].value;
				const nameCipher = encrypt(profile.displayName);

				const [results] = await db.query(
					`INSERT INTO all_users (userid, email, name, password) VALUES ('G-${userid}', '${email}', '${nameCipher}', null)`,
				);
				SendEmail(email, 'newBookViaGoogle', {
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
app.post('/signup', (req, res) => {
	signUpRoute(req, res, db);
});
app.get('/login', (req, res) => logInRoute(req, res, db));
app.get('/me', async (req, res) => MeRoute(req, res, db));
app.get('/verify/resend', async (req, res) =>
	ResendVerifyEmailRoute(req, res, db),
);
app.get('/verify', async (req, res) => VerfiyTokenRoute(req, res, db));
app.post('/logout', async (req, res) => {
	const bearerHeader = req.headers.authorization;
	const ip = req.ip;
	if (!bearerHeader) return;
	const user = await VerfiyToken(req);
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
