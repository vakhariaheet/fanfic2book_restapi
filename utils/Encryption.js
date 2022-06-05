const CryptoJS = require('crypto-js');
module.exports = {
	encrypt: (data) => {
		return CryptoJS.AES.encrypt(data, process.env.ENCRYPTION_KEY).toString();
	},
	decrypt: (data) => {
		return CryptoJS.AES.decrypt(data, process.env.ENCRYPTION_KEY).toString(
			CryptoJS.enc.Utf8,
		);
	},
};
