const express = require('express');
const request = require('supertest');

jest.mock('../services/recommendation.service', () => ({
  getAllRecommendations: jest.fn(),
  getRecommendationById: jest.fn(),
  createRecommendation: jest.fn(),
  updateRecommendation: jest.fn(),
  deleteRecommendation: jest.fn(),
}));

const recommendationService = require('../services/recommendation.service');
const recommendationRouter = require('../routes/recommendation.routes');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/recommendations', recommendationRouter);
  return app;
}

describe('Recommendation Controller', () => {
  const app = makeApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /recommendations', () => {
    test('should return all recommendations', async () => {
      const mockRecommendations = [
        {
          id: 1,
          title: 'Test Recommendation 1',
          description: 'Test description 1',
          category: 'adventure',
          location: 'Test Location 1',
          duration: '2 hours',
          rating: 4.5,
          reviews: 10,
          price: '$50',
          tags: ['outdoor', 'nature'],
          image: 'https://example.com/image1.jpg',
          difficulty: 'medium',
          bestTime: 'Morning',
          crowdLevel: 'Medium',
          instagrammable: true,
          trending: true,
          exclusive: false,
          localFavorite: false
        },
        {
          id: 2,
          title: 'Test Recommendation 2',
          description: 'Test description 2',
          category: 'culture',
          location: 'Test Location 2',
          duration: '3 hours',
          rating: 4.8,
          reviews: 15,
          price: '$75',
          tags: ['history', 'art'],
          image: 'https://example.com/image2.jpg',
          difficulty: 'easy',
          bestTime: 'Afternoon',
          crowdLevel: 'Low',
          instagrammable: false,
          trending: false,
          exclusive: true,
          localFavorite: true
        }
      ];

      recommendationService.getAllRecommendations.mockResolvedValue(mockRecommendations);

      const res = await request(app).get('/recommendations');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRecommendations);
      expect(recommendationService.getAllRecommendations).toHaveBeenCalledTimes(1);
    });

  });

  describe('GET /recommendations/:id', () => {
    test('should return recommendation by id', async () => {
      const mockRecommendation = {
        id: 1,
        title: 'Test Recommendation',
        description: 'Test description',
        category: 'adventure',
        location: 'Test Location',
        duration: '2 hours',
        rating: 4.5,
        reviews: 10,
        price: '$50',
        tags: ['outdoor'],
        image: 'https://example.com/image.jpg',
        difficulty: 'medium',
        bestTime: 'Morning',
        crowdLevel: 'Medium',
        instagrammable: true,
        trending: true,
        exclusive: false,
        localFavorite: false
      };

      recommendationService.getRecommendationById.mockResolvedValue(mockRecommendation);

      const res = await request(app).get('/recommendations/1');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRecommendation);
      expect(recommendationService.getRecommendationById).toHaveBeenCalledWith('1');
    });

    test('should return 404 when recommendation not found', async () => {
      recommendationService.getRecommendationById.mockResolvedValue(null);

      const res = await request(app).get('/recommendations/999');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Recommendation not found');
    });

  });

  describe('POST /recommendations', () => {
    test('should create new recommendation', async () => {
      const newRecommendationData = {
        title: 'New Recommendation',
        description: 'New description',
        category: 'adventure',
        location: 'New Location',
        duration: '2 hours',
        rating: 4.5,
        reviews: 0,
        price: '$50',
        tags: ['outdoor'],
        image: 'https://example.com/new-image.jpg',
        difficulty: 'medium',
        bestTime: 'Morning',
        crowdLevel: 'Medium',
        instagrammable: true,
        trending: true,
        exclusive: false,
        localFavorite: false
      };

      const createdRecommendation = { id: 3, ...newRecommendationData };
      recommendationService.createRecommendation.mockResolvedValue(createdRecommendation);

      const res = await request(app)
        .post('/recommendations')
        .send(newRecommendationData);
      
      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdRecommendation);
      expect(recommendationService.createRecommendation).toHaveBeenCalledWith(newRecommendationData);
    });

  });

  describe('PUT /recommendations/:id', () => {
    test('should update recommendation', async () => {
      const updateData = { title: 'Updated Title' };
      const updatedRecommendation = {
        id: 1,
        title: 'Updated Title',
        description: 'Test description',
        category: 'adventure',
        location: 'Test Location',
        duration: '2 hours',
        rating: 4.5,
        reviews: 10,
        price: '$50',
        tags: ['outdoor'],
        image: 'https://example.com/image.jpg',
        difficulty: 'medium',
        bestTime: 'Morning',
        crowdLevel: 'Medium',
        instagrammable: true,
        trending: true,
        exclusive: false,
        localFavorite: false
      };

      recommendationService.updateRecommendation.mockResolvedValue(updatedRecommendation);

      const res = await request(app)
        .put('/recommendations/1')
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedRecommendation);
      expect(recommendationService.updateRecommendation).toHaveBeenCalledWith('1', updateData);
    });

    test('should return 404 when recommendation not found', async () => {
      recommendationService.updateRecommendation.mockResolvedValue(null);

      const res = await request(app)
        .put('/recommendations/999')
        .send({ title: 'Updated Title' });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Recommendation not found');
    });

  });

  describe('DELETE /recommendations/:id', () => {
    test('should delete recommendation', async () => {
      recommendationService.deleteRecommendation.mockResolvedValue(true);

      const res = await request(app).delete('/recommendations/1');
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Recommendation deleted successfully');
      expect(recommendationService.deleteRecommendation).toHaveBeenCalledWith('1');
    });

    test('should return 404 when recommendation not found', async () => {
      recommendationService.deleteRecommendation.mockResolvedValue(false);

      const res = await request(app).delete('/recommendations/999');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Recommendation not found');
    });

  });
});