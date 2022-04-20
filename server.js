const express = require('express');
const app = express();
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const { encrypt, decrypt } = require('./utils/Encryption');
const SignJWT = require('./utils/SignJWT');
const VerfiyToken = require('./utils/VerfiyToken');
const SendEmail = require('./utils/SendEmail');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieSession = require('cookie-session');
// Routes Imports
const signUpRoute = require('./routes/SignUp.routes');
const logInRoute = require('./routes/Login.routes');

const { uid } = require('uid');

require('dotenv').config();

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
// fromA03('html', 'https://archiveofourown.org/works/24099316');

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
console.log(db.query);
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
app.get('/logout', (req, res) => {
	req.logout();
	delete req.user;

	res.send('logged out');
});
app.get('/', (req, res) => {
	res.send('Hello World!');
});
app.get('/fail', (req, res) => {
	res.send('Failed');
});
app.post('/signup', (req, res) => {
	signUpRoute(req, res, db);
});
console.log(encrypt('heet1476@gmail.com'));
console.log(encrypt('Heet Vakharia'));
console.log(encrypt('49.36.65.55'));
// console.log(encrypt(' 1234'));
const VerfiyTokenMiddleware = (req, res, next) => {
	VerfiyToken(req)
		.then((data) => {
			req.userid = data.userid;
			next();
		})
		.catch((err) => {
			res.status(401).send(err);
		});
};

app.get('/login', (req, res) => logInRoute(req, res, db));

const port = process.env.PORT || 5005;
app.listen(port, () => {
	console.log(`listening on *:${port}`);
});
