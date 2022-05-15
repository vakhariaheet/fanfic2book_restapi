import { decrypt, encrypt } from '../utils/Encryption';
import { SendEmail, templates } from '../utils/SendEmail';
import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import SignJWT from '../utils/SignJWT';
import { uid } from 'uid';
const ResendVerifyEmail = async (
	req: Request<
		{},
		{},
		{},
		{
			userid: string;
		},
		Record<string, any>
	>,
	res: Response,
	db: Pool,
) => {
	const { userid: useridCipher } = req.query;
	const userid = decrypt(useridCipher);
	const [results]: any = await db.query(`
		SELECT * FROM all_users WHERE userid = '${userid}'
	`);
	if (results.length > 0) {
		if (results[0].verifytoken)
			return res.status(500).json({ message: 'Error' });
		const VerfiyToken = uid(20);
		const emailToken = SignJWT(
			{
				token: VerfiyToken,
				userid: encrypt(userid),
			},
			'1d',
		);
		SendEmail(results[0].email, {
			type: templates.resendToken,
			name: decrypt(results[0].name),
			verificationLink: `${process.env.FRONTEND_URL}/verify?token=${emailToken}`,
		});
		res.send('Email sent');
	}
};
export default ResendVerifyEmail;
