// Imports
const SendEmail = require('./../utils/SendEmail');
const { uid } = require('uid/secure');
const { decrypt, encrypt } = require('../utils/Encryption');
const SignJWT = require('../utils/SignJWT');
const bcrypt = require('bcrypt');
require('dotenv').config();

const SignUp = async (req, res, db) => {
	const { nameCipher, emailCipher, passwordCipher, ip } = req.body;

	//  Decrypting data
	const email = decrypt(emailCipher);
	const userid = `T-${uid(10)}`;
	const ipAddress = ip || req.ip;
	const password = decrypt(passwordCipher);

	// Hash password
	const salt = bcrypt.genSaltSync(10);
	const hash = bcrypt.hashSync(password, salt);
	const VerfiyToken = uid(20);
	const deviceID = uid(10);

	// Verify email token
	const emailToken = SignJWT(
		{
			token: VerfiyToken,
			userid: encrypt(userid),
		},
		'1d',
	);

	try {
		//  Insert user into database
		await db.query(
			`INSERT INTO all_users (name, email, password,userid,verifytoken) VALUES ('${nameCipher}', '${email}', '${hash}','${userid}','${VerfiyToken}')`,
		);

		//  Storing IP address
		await db.query(
			`INSERT INTO user_info (ip,userid) VALUES ('${ipAddress}','${userid}')`,
		);

		//  Storing device ID
		await db.query(
			`INSERT INTO user_devices (userid,deviceid) VALUES ('${userid}','${deviceID}')`,
		);

		// Signing User Token
		const token = SignJWT({
			userid: encrypt(userid),
			deviceID: encrypt(deviceID),
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
			userid: encrypt(userid),
			name: nameCipher,
			token: encrypt(token),
		});
	} catch (err) {
		res.status(400).json({
			message: 'Error creating user',
			error: err.message,
		});
	}
};

module.exports = SignUp;
