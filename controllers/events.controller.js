const eventsService = require('../services/events.service');

// Always resolve userId from header (or middleware/JWT if set)
function getUserIdFromReq(req) {
	const fromMiddleware = req.userId;     // e.g. user_context.middleware
	const fromJwt = req.user?.id;          // e.g. if JWT middleware sets req.user
	const fromHeader = req.headers['x-user-id']
		? Number(req.headers['x-user-id'])
		: undefined;

	return fromMiddleware ?? fromJwt ?? fromHeader;
}

exports.createEvent = async (req, res) => {
	try {
		const userId = getUserIdFromReq(req);
		if (!userId || Number.isNaN(Number(userId))) {
			return res.status(401).json({ error: 'User not identified' });
		}
		const created = await eventsService.create(Number(userId), req.body);
		res.status(201).json(created);
	} catch (e) {
		res.status(400).json({ error: e.message });
	}
};

exports.listUserEvents = async (req, res) => {
	try {
	  const userId = getUserIdFromReq(req);
	  if (!userId || Number.isNaN(Number(userId))) {
		return res.status(401).json({ error: 'User not identified' });
	  }
  
	  const { from, to, limit, offset } = req.query;
	  const result = await eventsService.listForUser(Number(userId), {
		from,
		to,
		limit: Number(limit) || 50,
		offset: Number(offset) || 0
	  });
  
	  // Only return the array of events
	  res.json(result.rows);
	} catch (e) {
	  res.status(500).json({ error: e.message });
	}
  };

exports.getEvent = async (req, res) => {
	try {
		const userId = getUserIdFromReq(req);
		if (!userId || Number.isNaN(Number(userId))) {
			return res.status(401).json({ error: 'User not identified' });
		}
		const event = await eventsService.getById(Number(userId), req.params.id);
		if (!event) return res.status(404).json({ error: 'Event not found' });
		res.json(event);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
};

exports.updateEvent = async (req, res) => {
	try {
		const userId = getUserIdFromReq(req);
		if (!userId || Number.isNaN(Number(userId))) {
			return res.status(401).json({ error: 'User not identified' });
		}
		const updated = await eventsService.update(Number(userId), req.params.id, req.body);
		if (!updated) return res.status(404).json({ error: 'Event not found' });
		res.json(updated);
	} catch (e) {
		res.status(400).json({ error: e.message });
	}
};

exports.deleteEvent = async (req, res) => {
	try {
		const userId = getUserIdFromReq(req);
		if (!userId || Number.isNaN(Number(userId))) {
			return res.status(401).json({ error: 'User not identified' });
		}
		const removed = await eventsService.remove(Number(userId), req.params.id);
		if (!removed) return res.status(404).json({ error: 'Event not found' });
		res.json({ message: 'Event deleted' });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
};
