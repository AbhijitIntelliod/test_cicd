const { Booking } = require("../config/db.config");

// Helper to get userId from request
function getUserId(req) {
  const userId = req.user?.id || 
                 req.userId || 
                 req.headers['x-user-id'] || 
                 req.body.userId;
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  return userId;
}

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const userId = getUserId(req);
    const booking = await Booking.create({ ...req.body, userId: userId });
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ message: 'Authentication required' });
    }
    res.status(500).json({ message: "Error creating booking", error });
  }
};

// Get all bookings for user
exports.getBookings = async (req, res) => {
  try {
    const userId = getUserId(req);
    const bookings = await Booking.findAll({
      where: { userId: userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(bookings);
  } catch (error) {
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ message: 'Authentication required' });
    }
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const booking = await Booking.findOne({
      where: { id: req.params.id, userId: userId }
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (error) {
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ message: 'Authentication required' });
    }
    res.status(500).json({ message: "Error fetching booking" });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const userId = getUserId(req);
    const [updated] = await Booking.update(req.body, {
      where: { id: req.params.id, userId: userId }
    });
    if (!updated) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking updated" });
  } catch (error) {
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ message: 'Authentication required' });
    }
    res.status(500).json({ message: "Error updating booking" });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const userId = getUserId(req);
    const deleted = await Booking.destroy({
      where: { id: req.params.id, userId: userId }
    });
    if (!deleted) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking deleted" });
  } catch (error) {
    if (error.message === 'User not authenticated') {
      return res.status(401).json({ message: 'Authentication required' });
    }
    res.status(500).json({ message: "Error deleting booking" });
  }
};
