// Verify JS TOKEN
import { decrypt, encrypt } from './Encryption';
import jwt from 'jsonwebtoken';
export default (
	req: any,
): Promise<
	| {
			message: string;
	  }
	| {
			userid: string;
			deviceID: string;
	  }
> => {
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
			} = jwt.verify(token, process.env.JWT_TOKEN) as any;
			const userid = decrypt(useridCipher);
			const ip = decrypt(ipCipher);
			const deviceID = decrypt(deviceIDCipher);
			if (ip === req.ip) {
				resolve({ userid, deviceID });
			}
			reject({
				message: 'Invalid token',
			});
		} catch (err) {
			console.log(err);
			reject({
				message: `Errr : ${err}`,
			});
		}
	});
};
