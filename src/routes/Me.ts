import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import { encrypt } from '../utils/Encryption';
import VerfiyToken from '../utils/VerfiyToken';

const Me = async (req: Request, res: Response, db: Pool) => {
	const bearerHeader = req.headers.authorization;
	const ip = req.ip;
	if (typeof bearerHeader !== 'undefined') {
		const bearer = bearerHeader.split(' ');
		const bearerToken = bearer[1];
		console.log('user');
		if (bearerToken) {
			console.log('user2');
			VerfiyToken(req)
				.then(async (user) => {
					if ('message' in user) {
						res.status(401).json(user);
						return;
					}
					const [[userInfo]]: any = await db.query(
						`SELECT email,name FROM all_users WHERE userid = '${user.userid}'`,
					);
					const [[{ downloads }]]: any = await db.query(
						`SELECT downloads FROM user_info WHERE userid = '${user.userid}'`,
					);
					const [[{ deviceID }]]: any = await db.query(`
						SELECT deviceID FROM user_devices WHERE userid = '${user.userid}'
					`);
					res.status(200).send({
						...userInfo,
						...user,
						downloads,
						deviceID,
						email: encrypt(userInfo.email),
					});
				})
				.catch((err) => {
					console.log(err);
					res.status(401).send(err);
				});
		}
	} else {
		const [results]: any = await db.query(
			`SELECT * FROM user_info WHERE ip = '${ip}'`,
		);
		if (results.length > 0) {
			if (results[0].userid) {
				const [[user]]: any = await db.query(
					`SELECT * FROM all_users WHERE userid = '${results[0].userid}'`,
				);
				res.json({
					name: user.name,
					email: user.email,
					userid: user.userid,
				});
			} else {
				res.json({
					userid: results[0].userid,
					downloads: results[0].downloads,
				});
			}
		} else {
			await db.query("INSERT INTO user_info (ip) VALUES ('" + ip + "')");
			res.json({
				userid: '',
				downloads: 0,
			});
		}
	}
};

export default Me;
