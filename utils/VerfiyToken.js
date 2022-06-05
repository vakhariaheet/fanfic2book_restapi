// Verify JS TOKEN

const { decrypt, encrypt } = require('./Encryption');
const jwt = require('jsonwebtoken');
module.exports = (req) => {
	return new Promise((resolve, reject) => {
		const bearerHeader = req.headers.authorization;
		if (bearerHeader === undefined) return reject('No token provided');
		const token = decrypt(bearerHeader.split(' ')[1]);
		try {
			console.log(process.env.JWT_TOKEN);
			const {
				userid: useridCipher,
				ip: ipCipher,
				deviceID: deviceIDCipher,
			} = jwt.verify(token, process.env.JWT_TOKEN);
			const userid = decrypt(useridCipher);
			const ip = decrypt(ipCipher);
			const deviceID = decrypt(deviceIDCipher);
			if (ip === req.ip) {
				resolve({ userid, deviceID });
			}
			reject('Invalid Token ');
		} catch (err) {
			console.log(err);
			reject(err);
		}
	});
};
