// Package Imports
import { uid } from 'uid/secure';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
// Local Imports
import { SendEmail, templates } from '../utils/SendEmail';
import { decrypt, encrypt } from '../utils/Encryption';
import SignJWT from '../utils/SignJWT';
import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';

dotenv.config();

const SignUp = async (
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
	res: Response,
	db: Pool,
) => {
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
		SendEmail(email, {
			type: templates.newUser,
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
			error: err,
		});
	}
};

export default SignUp;
