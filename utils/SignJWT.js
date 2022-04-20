const jwt = require('jsonwebtoken');
module.exports = (obj, expireIn) => {
	return !expireIn
		? jwt.sign(obj, process.env.JWT_TOKEN)
		: jwt.sign(obj, process.env.JWT_TOKEN, { expiresIn: expireIn });
};
