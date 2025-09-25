const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");

router.post("/", bookingController.createBooking);
router.get("/", bookingController.getBookings);
router.get("/:id", bookingController.getBookingById);
router.put("/:id", bookingController.updateBooking);
router.delete("/:id", bookingController.deleteBooking);

module.exports = router;
