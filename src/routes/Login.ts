import { decrypt, encrypt } from '../utils/Encryption';
import SignJWT from '../utils/SignJWT';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
dotenv.config();
const Login = async (
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
	res: Response,
	db: Pool,
) => {
	const { email: emailCipher, password: passwordCipher } = req.query;
	if (!emailCipher || !passwordCipher) {
		res.status(400).send('Missing email or password');
		return;
	}
	const email = decrypt(emailCipher);
	const password = decrypt(passwordCipher);
	const [result]: any = await db.query(
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
export default Login;
