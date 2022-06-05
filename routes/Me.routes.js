const { encrypt } = require('../utils/Encryption');
const VerfiyToken = require('../utils/VerfiyToken');

const Me = async (req, res, db) => {
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
					console.log(user, 'user');
					const [[userInfo]] = await db.query(
						`SELECT email,name FROM all_users WHERE userid = '${user.userid}'`,
					);
					const [[{ downloads }]] = await db.query(
						`SELECT downloads FROM user_info WHERE userid = '${user.userid}'`,
					);
					const [[{ deviceID }]] = await db.query(`
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
		const [results] = await db.query(
			`SELECT * FROM user_info WHERE ip = '${ip}'`,
		);
		if (results.length > 0) {
			if (results[0].userid) {
				const [[user]] = await db.query(
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

module.exports = Me;
