const express = require('express');
const request = require('supertest');

jest.mock('../services/discovery.service', () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

const discoveryService = require('../services/discovery.service');
const discoveryRouter = require('../routes/discovery.route');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/discoveries', discoveryRouter);
  return app;
}

describe('Discovery Controller', () => {
  const app = makeApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /discoveries', () => {
    test('should return all discoveries', async () => {
      const mockDiscoveries = [
        {
          id: 1,
          title: 'Test Discovery 1',
          description: 'Test description 1',
          fullDescription: 'Full test description 1',
          category: 'trending',
          location: 'Test Location 1',
          duration: '2 hours',
          rating: 4.5,
          reviews: 10,
          price: '$50',
          tags: ['adventure', 'nature'],
          image: 'https://example.com/image1.jpg',
          trending: true,
          exclusive: false,
          localFavorite: false,
          bestTime: 'Morning',
          crowdLevel: 'Medium',
          instagrammable: true
        },
        {
          id: 2,
          title: 'Test Discovery 2',
          description: 'Test description 2',
          fullDescription: 'Full test description 2',
          category: 'hidden-gems',
          location: 'Test Location 2',
          duration: '3 hours',
          rating: 4.8,
          reviews: 15,
          price: '$75',
          tags: ['culture', 'history'],
          image: 'https://example.com/image2.jpg',
          trending: false,
          exclusive: true,
          localFavorite: true,
          bestTime: 'Evening',
          crowdLevel: 'Low',
          instagrammable: false
        }
      ];

      discoveryService.getAll.mockResolvedValue(mockDiscoveries);

      const res = await request(app).get('/discoveries');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockDiscoveries);
      expect(discoveryService.getAll).toHaveBeenCalledTimes(1);
    });

    test('should handle service errors', async () => {
      discoveryService.getAll.mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app).get('/discoveries');
      
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database connection failed');
    });
  });

  describe('GET /discoveries/:id', () => {
    test('should return discovery by id', async () => {
      const mockDiscovery = {
        id: 1,
        title: 'Test Discovery',
        description: 'Test description',
        fullDescription: 'Full test description',
        category: 'trending',
        location: 'Test Location',
        duration: '2 hours',
        rating: 4.5,
        reviews: 10,
        price: '$50',
        tags: ['adventure'],
        image: 'https://example.com/image.jpg',
        trending: true,
        exclusive: false,
        localFavorite: false,
        bestTime: 'Morning',
        crowdLevel: 'Medium',
        instagrammable: true
      };

      discoveryService.getById.mockResolvedValue(mockDiscovery);

      const res = await request(app).get('/discoveries/1');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockDiscovery);
      expect(discoveryService.getById).toHaveBeenCalledWith('1');
    });

    test('should return 404 when discovery not found', async () => {
      discoveryService.getById.mockResolvedValue(null);

      const res = await request(app).get('/discoveries/999');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Discovery not found');
    });

    test('should handle service errors', async () => {
      discoveryService.getById.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/discoveries/1');
      
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Database error');
    });
  });

  describe('POST /discoveries', () => {
    test('should create new discovery', async () => {
      const newDiscoveryData = {
        title: 'New Discovery',
        description: 'New description',
        fullDescription: 'Full new description',
        category: 'trending',
        location: 'New Location',
        duration: '2 hours',
        rating: 4.5,
        reviews: 0,
        price: '$50',
        tags: ['adventure'],
        image: 'https://example.com/new-image.jpg',
        trending: true,
        exclusive: false,
        localFavorite: false,
        bestTime: 'Morning',
        crowdLevel: 'Medium',
        instagrammable: true
      };

      const createdDiscovery = { id: 3, ...newDiscoveryData };
      discoveryService.create.mockResolvedValue(createdDiscovery);

      const res = await request(app)
        .post('/discoveries')
        .send(newDiscoveryData);
      
      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdDiscovery);
      expect(discoveryService.create).toHaveBeenCalledWith(newDiscoveryData);
    });

    test('should handle service errors', async () => {
      discoveryService.create.mockRejectedValue(new Error('Validation failed'));

      const res = await request(app)
        .post('/discoveries')
        .send({ title: 'Invalid Discovery' });
      
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /discoveries/:id', () => {
    test('should update discovery', async () => {
      const updateData = {
        title: 'Updated Discovery',
        description: 'Updated description',
        fullDescription: 'Updated full description'
      };

      const updatedDiscovery = {
        id: 1,
        title: 'Updated Discovery',
        description: 'Updated description',
        fullDescription: 'Updated full description',
        category: 'trending',
        location: 'Test Location',
        duration: '2 hours',
        rating: 4.5,
        reviews: 10,
        price: '$50',
        tags: ['adventure'],
        image: 'https://example.com/image.jpg',
        trending: true,
        exclusive: false,
        localFavorite: false,
        bestTime: 'Morning',
        crowdLevel: 'Medium',
        instagrammable: true
      };

      discoveryService.update.mockResolvedValue(updatedDiscovery);

      const res = await request(app)
        .put('/discoveries/1')
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedDiscovery);
      expect(discoveryService.update).toHaveBeenCalledWith('1', updateData);
    });

    test('should return 404 when discovery not found', async () => {
      discoveryService.update.mockResolvedValue(null);

      const res = await request(app)
        .put('/discoveries/999')
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Discovery not found');
    });

    test('should handle service errors', async () => {
      discoveryService.update.mockRejectedValue(new Error('Update failed'));

      const res = await request(app)
        .put('/discoveries/1')
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Update failed');
    });
  });

  describe('DELETE /discoveries/:id', () => {
    test('should delete discovery', async () => {
      const deletedDiscovery = {
        id: 1,
        title: 'Deleted Discovery',
        description: 'Deleted description'
      };

      discoveryService.remove.mockResolvedValue(deletedDiscovery);

      const res = await request(app).delete('/discoveries/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Discovery deleted successfully');
      expect(discoveryService.remove).toHaveBeenCalledWith('1');
    });

    test('should return 404 when discovery not found', async () => {
      discoveryService.remove.mockResolvedValue(null);

      const res = await request(app).delete('/discoveries/999');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Discovery not found');
    });

    test('should handle service errors', async () => {
      discoveryService.remove.mockRejectedValue(new Error('Delete failed'));

      const res = await request(app).delete('/discoveries/1');
      
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Delete failed');
    });
  });
});
