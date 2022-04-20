const SendEmail = require('./../utils/SendEmail');
const { uid } = require('uid/secure');
const { decrypt, encrypt } = require('../utils/Encryption');
const SignJWT = require('../utils/SignJWT');
const bcrypt = require('bcrypt');
require('dotenv').config();
const SignUp = async (req, res, db) => {
	console.log(req.body, db.query);
	const { nameCipher, emailCipher, passwordCipher } = req.body;
	//  Decrypting data
	const email = decrypt(emailCipher);
	const userid = uid(10);
	const ipAddress = req.ip;
	const password = decrypt(passwordCipher);
	// Hash password
	const salt = bcrypt.genSaltSync(10);
	const hash = bcrypt.hashSync(password, salt);
	console.log(ipAddress);
	const VerfiyToken = uid(20);
	// Verify email token
	const emailToken = SignJWT(
		{
			token: VerfiyToken,
			userid: encrypt(userid),
		},
		'5m',
	);

	try {
		//  Insert user into database
		await db.query(
			`INSERT INTO all_users (name, email, password,userid,verifytoken) VALUES ('${nameCipher}', '${email}', '${hash}','T-${userid}','${VerfiyToken}')`,
		);
		//  Storing IP address
		await db.query(
			`INSERT INTO user_info (ip_address,userid) VALUES ('${ipAddress}','${userid}')`,
		);
		const token = SignJWT({
			userid: encrypt(userid),
			ip: encrypt(ipAddress),
		});
		// Send Email
		SendEmail(email, 'newUser', {
			name: decrypt(nameCipher),
			verificationLink: `${process.env.FRONTEND_URL}/verify?token=${emailToken}`,
		});
		res.json({
			message: 'User created successfully',
			email: emailCipher,
			name: nameCipher,
			token: encrypt(token),
		});
	} catch (err) {
		res.status(500).json({
			message: 'Error creating user',
			error: err.message,
		});
	}
};

module.exports = SignUp;
