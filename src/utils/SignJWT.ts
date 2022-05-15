import jwt from 'jsonwebtoken';
export default (obj: {}, expireIn?: string) => {
	return !expireIn
		? jwt.sign(obj, process.env.JWT_TOKEN)
		: jwt.sign(obj, process.env.JWT_TOKEN, { expiresIn: expireIn });
};
