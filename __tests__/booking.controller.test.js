const express = require('express');
const request = require('supertest');

jest.mock('../config/db.config', () => ({
  Booking: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  }
}));

const { Booking } = require('../config/db.config');
const bookingRouter = require('../routes/booking.routes');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.headers['x-user-id'] = '123'; next(); });
  app.use('/bookings', bookingRouter);
  return app;
}

describe('Booking Controller', () => {
  const app = makeApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /bookings', () => {
    test('should create new booking', async () => {
      const bookingData = {
        discoveryId: 1,
        eventId: 2,
        bookingDate: '2024-01-15',
        numberOfPeople: 2,
        specialRequests: 'Vegetarian meals',
        status: 'confirmed'
      };

      const createdBooking = {
        id: 1,
        userId: 123,
        ...bookingData,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      Booking.create.mockResolvedValue(createdBooking);

      const res = await request(app)
        .post('/bookings')
        .send(bookingData);
      
      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdBooking);
      expect(Booking.create).toHaveBeenCalledWith({
        ...bookingData,
        userId: "123"
      });
    });

  });

  describe('GET /bookings', () => {
    test('should return user bookings', async () => {
      const mockBookings = [
        {
          id: 1,
          userId: 123,
          discoveryId: 1,
          bookingDate: '2024-01-15',
          numberOfPeople: 2,
          status: 'confirmed',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          userId: 123,
          discoveryId: 2,
          bookingDate: '2024-01-20',
          numberOfPeople: 4,
          status: 'pending',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ];

      Booking.findAll.mockResolvedValue(mockBookings);

      const res = await request(app).get('/bookings');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockBookings);
      expect(Booking.findAll).toHaveBeenCalledWith({
        where: { userId: '123' },
        order: [['createdAt', 'DESC']]
      });
    });

  });

  describe('GET /bookings/:id', () => {
    test('should return booking by id', async () => {
      const mockBooking = {
        id: 1,
        userId: 123,
        discoveryId: 1,
        bookingDate: '2024-01-15',
        numberOfPeople: 2,
        status: 'confirmed',
        createdAt: '2024-01-01T00:00:00Z'
      };

      Booking.findOne.mockResolvedValue(mockBooking);

      const res = await request(app).get('/bookings/1');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockBooking);
      expect(Booking.findOne).toHaveBeenCalledWith({
        where: { id: '1', userId: '123' }
      });
    });

    test('should return 404 when booking not found', async () => {
      Booking.findOne.mockResolvedValue(null);

      const res = await request(app).get('/bookings/999');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Booking not found');
    });

  });

  describe('PUT /bookings/:id', () => {
    test('should update booking', async () => {
      const updateData = {
        numberOfPeople: 4,
        specialRequests: 'Updated requests',
        status: 'confirmed'
      };

      Booking.update.mockResolvedValue([1]); // Sequelize returns [affectedCount]

      const res = await request(app)
        .put('/bookings/1')
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Booking updated');
      expect(Booking.update).toHaveBeenCalledWith(updateData, {
        where: { id: '1', userId: '123' }
      });
    });

    test('should return 404 when booking not found', async () => {
      Booking.update.mockResolvedValue([0]); // No rows affected

      const res = await request(app)
        .put('/bookings/999')
        .send({ status: 'confirmed' });
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Booking not found');
    });

  });

  describe('DELETE /bookings/:id', () => {
    test('should delete booking', async () => {
      Booking.destroy.mockResolvedValue(1); // Sequelize returns affectedCount

      const res = await request(app).delete('/bookings/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Booking deleted');
      expect(Booking.destroy).toHaveBeenCalledWith({
        where: { id: '1', userId: '123' }
      });
    });

    test('should return 404 when booking not found', async () => {
      Booking.destroy.mockResolvedValue(0); // No rows affected

      const res = await request(app).delete('/bookings/999');
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Booking not found');
    });

  });
});
