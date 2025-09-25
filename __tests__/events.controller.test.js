const express = require('express');
const request = require('supertest');

jest.mock('../services/events.service', () => ({
  create: jest.fn(),
  listForUser: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

const eventsService = require('../services/events.service');
const eventsRouter = require('../routes/events.route');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.headers['x-user-id'] = '123'; next(); });
  app.use('/events', eventsRouter);
  return app;
}

describe('Events Controller', () => {
  const app = makeApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /events', () => {
    test('should create new event', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test event description',
        startDate: '2024-01-15T10:00:00Z',
        endDate: '2024-01-15T18:00:00Z',
        location: 'Test Location',
        maxAttendees: 50,
        category: 'conference',
        price: 100,
        isPublic: true
      };

      const createdEvent = {
        id: 1,
        userId: 123,
        ...eventData,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      eventsService.create.mockResolvedValue(createdEvent);

      const res = await request(app)
        .post('/events')
        .send(eventData);
      
      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdEvent);
      expect(eventsService.create).toHaveBeenCalledWith(123, eventData);
    });

    test('should return 401 when user not identified', async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.use('/events', eventsRouter);

      const res = await request(appWithoutAuth)
        .post('/events')
        .send({ title: 'Test Event' });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('User not identified');
    });

    test('should return 401 when user id is invalid', async () => {
      const appWithInvalidAuth = express();
      appWithInvalidAuth.use(express.json());
      appWithInvalidAuth.use((req, _res, next) => { req.headers['x-user-id'] = 'invalid'; next(); });
      appWithInvalidAuth.use('/events', eventsRouter);

      const res = await request(appWithInvalidAuth)
        .post('/events')
        .send({ title: 'Test Event' });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('User not identified');
    });

    test('should handle service errors', async () => {
      eventsService.create.mockRejectedValue(new Error('Validation failed'));

      const res = await request(app)
        .post('/events')
        .send({ title: 'Test Event' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('GET /events', () => {
    test('should return user events with default pagination', async () => {
      const mockEvents = [
        {
          id: 1,
          userId: 123,
          title: 'Event 1',
          startDate: '2024-01-15T10:00:00Z',
          endDate: '2024-01-15T18:00:00Z',
          location: 'Location 1',
          category: 'conference'
        },
        {
          id: 2,
          userId: 123,
          title: 'Event 2',
          startDate: '2024-01-20T10:00:00Z',
          endDate: '2024-01-20T18:00:00Z',
          location: 'Location 2',
          category: 'workshop'
        }
      ];

      eventsService.listForUser.mockResolvedValue({
        rows: mockEvents,
        count: 2
      });

      const res = await request(app).get('/events');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockEvents);
      expect(eventsService.listForUser).toHaveBeenCalledWith(123, {
        from: undefined,
        to: undefined,
        limit: 50,
        offset: 0
      });
    });

    test('should return user events with custom pagination and filters', async () => {
      const mockEvents = [
        {
          id: 1,
          userId: 123,
          title: 'Event 1',
          startDate: '2024-01-15T10:00:00Z',
          endDate: '2024-01-15T18:00:00Z',
          location: 'Location 1',
          category: 'conference'
        }
      ];

      eventsService.listForUser.mockResolvedValue({
        rows: mockEvents,
        count: 1
      });

      const res = await request(app)
        .get('/events?from=2024-01-01&to=2024-01-31&limit=10&offset=5');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockEvents);
      expect(eventsService.listForUser).toHaveBeenCalledWith(123, {
        from: '2024-01-01',
        to: '2024-01-31',
        limit: 10,
        offset: 5
      });
    });

    test('should return 401 when user not identified', async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.use('/events', eventsRouter);

      const res = await request(appWithoutAuth).get('/events');
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('User not identified');
    });

    test('should handle service errors', async () => {
      eventsService.listForUser.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/events');
      
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database error');
    });
  });

  describe('GET /events/:id', () => {
    test('should return event by id', async () => {
      const mockEvent = {
        id: 1,
        userId: 123,
        title: 'Test Event',
        description: 'Test event description',
        startDate: '2024-01-15T10:00:00Z',
        endDate: '2024-01-15T18:00:00Z',
        location: 'Test Location',
        maxAttendees: 50,
        category: 'conference',
        price: 100,
        isPublic: true,
        createdAt: '2024-01-01T00:00:00Z'
      };

      eventsService.getById.mockResolvedValue(mockEvent);

      const res = await request(app).get('/events/1');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockEvent);
      expect(eventsService.getById).toHaveBeenCalledWith(123, '1');
    });

    test('should return 404 when event not found', async () => {
      eventsService.getById.mockResolvedValue(null);

      const res = await request(app).get('/events/999');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Event not found');
    });

    test('should return 401 when user not identified', async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.use('/events', eventsRouter);

      const res = await request(appWithoutAuth).get('/events/1');
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('User not identified');
    });

    test('should handle service errors', async () => {
      eventsService.getById.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/events/1');
      
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database error');
    });
  });

  describe('PUT /events/:id', () => {
    test('should update event', async () => {
      const updateData = {
        title: 'Updated Event',
        description: 'Updated description',
        maxAttendees: 75
      };

      const updatedEvent = {
        id: 1,
        userId: 123,
        title: 'Updated Event',
        description: 'Updated description',
        startDate: '2024-01-15T10:00:00Z',
        endDate: '2024-01-15T18:00:00Z',
        location: 'Test Location',
        maxAttendees: 75,
        category: 'conference',
        price: 100,
        isPublic: true,
        updatedAt: '2024-01-02T00:00:00Z'
      };

      eventsService.update.mockResolvedValue(updatedEvent);

      const res = await request(app)
        .put('/events/1')
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedEvent);
      expect(eventsService.update).toHaveBeenCalledWith(123, '1', updateData);
    });

    test('should return 404 when event not found', async () => {
      eventsService.update.mockResolvedValue(null);

      const res = await request(app)
        .put('/events/999')
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Event not found');
    });

    test('should return 401 when user not identified', async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.use('/events', eventsRouter);

      const res = await request(appWithoutAuth)
        .put('/events/1')
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('User not identified');
    });

    test('should handle service errors', async () => {
      eventsService.update.mockRejectedValue(new Error('Update failed'));

      const res = await request(app)
        .put('/events/1')
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Update failed');
    });
  });

  describe('DELETE /events/:id', () => {
    test('should delete event', async () => {
      const deletedEvent = {
        id: 1,
        userId: 123,
        title: 'Deleted Event',
        createdAt: '2024-01-01T00:00:00Z'
      };

      eventsService.remove.mockResolvedValue(deletedEvent);

      const res = await request(app).delete('/events/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Event deleted');
      expect(eventsService.remove).toHaveBeenCalledWith(123, '1');
    });

    test('should return 404 when event not found', async () => {
      eventsService.remove.mockResolvedValue(null);

      const res = await request(app).delete('/events/999');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Event not found');
    });

    test('should return 401 when user not identified', async () => {
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.use('/events', eventsRouter);

      const res = await request(appWithoutAuth).delete('/events/1');
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('User not identified');
    });

    test('should handle service errors', async () => {
      eventsService.remove.mockRejectedValue(new Error('Delete failed'));

      const res = await request(app).delete('/events/1');
      
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Delete failed');
    });
  });
});
