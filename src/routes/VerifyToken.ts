import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'mysql2/promise';
import { decrypt } from '../utils/Encryption';

const VerifyToken = async (
	req: Request<
		{},
		{},
		{},
		{
			token: string;
		},
		Record<string, any>
	>,
	res: Response,
	db: Pool,
) => {
	const { token: emailToken } = req.query;

	try {
		const { token, userid: useridCipher }: any = await jwt.verify(
			emailToken,
			process.env.JWT_TOKEN,
		);

		const userid = decrypt(useridCipher);

		const [results]: any = await db.query(
			`SELECT * FROM all_users WHERE userid = '${userid}'`,
		);
		if (results.length > 0) {
			if (results[0].verifytoken === token) {
				await db.query(`
					UPDATE all_users SET verifytoken = NULL  WHERE userid = '${userid}'`);
				res.status(200).send('verified');
			} else {
				res.status(400).send('not verified 1');
			}
		} else {
			res.status(400).send('not verified');
		}
	} catch (error) {
		res.status(500).send({ error });
	}
};
export default VerifyToken;
