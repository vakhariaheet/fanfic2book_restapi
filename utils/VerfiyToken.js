// Verify JS TOKEN

const { decrypt, encrypt } = require('./Encryption');

module.exports = (req) => {
	return Promise((resolve, reject) => {
		const bearerHeader = req.headers.authorization;
		if (bearerHeader === undefined) return reject('No token provided');
		const token = decrypt(bearerHeader.split(' ')[1]);
		try {
			const { userid, ip: ipCipher } = jwt.verify(token, process.env.JWT_TOKEN);
			const ip = decrypt(ipCipher);
			if (ip === req.ip) {
				resolve({ userid, ip: encrypt(ip) });
			}
			reject('Invalid Token');
		} catch (err) {
			reject('Invalid Token');
		}
	});
};
