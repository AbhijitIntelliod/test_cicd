module.exports = function userContext(req, res, next) {
	const jwtUserId = req.user?.id;
	const headerUserId = req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : undefined;
	const userId = jwtUserId ?? headerUserId;
	if (!userId || Number.isNaN(Number(userId))) {
		return res.status(401).json({ error: 'User not identified' });
	}
	req.userId = Number(userId);
	next();
};
