const { decrypt, encrypt } = require('../utils/Encryption');
const SignJWT = require('../utils/SignJWT');
const bcrypt = require('bcrypt');
require('dotenv').config();
const Login = async (req, res, db) => {
	const { email: emailCipher, password: passwordCipher } = req.query;
	const email = decrypt(emailCipher);
	const password = decrypt(passwordCipher);
	const [result] = await db.query(
		`SELECT * FROM all_users WHERE email = '${email}'`,
	);
	if (result.length === 0) {
		res.status(401).json({
			message: 'User not found',
		});
	}
	const user = result[0];
	const isPasswordValid = bcrypt.compareSync(password, user.password);
	if (!isPasswordValid) {
		res.status(401).json({
			message: 'Invalid password',
		});
	}
	const token = SignJWT({
		userid: encrypt(user.userid),
		ip: encrypt(req.ip),
	});
	res.json({
		message: 'User logged in successfully',
		email: emailCipher,
		name: user.name,
		token: encrypt(token),
	});
};
module.exports = Login;
