const { decrypt, encrypt } = require('../utils/Encryption');
const SendEmail = require('../utils/SendEmail');

const ResendVerifyEmail = async (req, res, db) => {
	const { userid: useridCipher } = req.query;
	const userid = decrypt(useridCipher);
	const [results] = await db.query(`
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
		SendEmail(email, 'resendToken', {
			name: decrypt(results[0].name),
			verificationLink: `${process.env.FRONTEND_URL}/verify?token=${emailToken}`,
		});
		res.send('Email sent');
	}
};
module.exports = ResendVerifyEmail;
