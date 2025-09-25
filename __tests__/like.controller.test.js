const express = require('express');
const request = require('supertest');

jest.mock('../services/like.service', () => ({
  likeDiscovery: jest.fn(),
  likeRecommendation: jest.fn(),
  unlikeDiscovery: jest.fn(),
  unlikeRecommendation: jest.fn(),
  getUserLikes: jest.fn(),
  hasLikedDiscovery: jest.fn(),
  hasLikedRecommendation: jest.fn(),
  getDiscoveryLikeCount: jest.fn(),
  getRecommendationLikeCount: jest.fn(),
  getMostLikedDiscoveries: jest.fn(),
  getMostLikedRecommendations: jest.fn(),
}));

const likeService = require('../services/like.service');
const likeRouter = require('../routes/like.routes');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.headers['x-user-id'] = '2'; next(); });
  app.use('/likes', likeRouter);
  return app;
}

describe('Like Controller', () => {
  const app = makeApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /likes', () => {
    test('should like a discovery', async () => {
      const likeData = { discoveryId: 11 };
      const mockResult = { success: true, message: 'Discovery liked successfully' };

      likeService.likeDiscovery.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/likes')
        .send(likeData);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Discovery liked successfully');
      expect(likeService.likeDiscovery).toHaveBeenCalledWith('2', 11);
    });

    test('should like a recommendation', async () => {
      const likeData = { recommendationId: 1 };
      const mockResult = { success: true, message: 'Recommendation liked successfully' };

      likeService.likeRecommendation.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/likes')
        .send(likeData);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Recommendation liked successfully');
      expect(likeService.likeRecommendation).toHaveBeenCalledWith('2', 1);
    });

    test('should return 400 when neither discoveryId nor recommendationId provided', async () => {
      const res = await request(app)
        .post('/likes')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Either discoveryId or recommendationId is required');
    });

  });

  describe('DELETE /likes/discovery/:discoveryId', () => {
    test('should unlike a discovery', async () => {
      const mockResult = { success: true, message: 'Discovery unliked successfully' };

      likeService.unlikeDiscovery.mockResolvedValue(mockResult);

      const res = await request(app).delete('/likes/discovery/11');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Discovery unliked successfully');
      expect(likeService.unlikeDiscovery).toHaveBeenCalledWith('2', '11');
    });

  });

  describe('DELETE /likes/recommendation/:recommendationId', () => {
    test('should unlike a recommendation', async () => {
      const mockResult = { success: true, message: 'Recommendation unliked successfully' };

      likeService.unlikeRecommendation.mockResolvedValue(mockResult);

      const res = await request(app).delete('/likes/recommendation/1');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Recommendation unliked successfully');
      expect(likeService.unlikeRecommendation).toHaveBeenCalledWith('2', '1');
    });

  });

  describe('GET /likes/my-likes', () => {
    test('should return user likes', async () => {
      const mockUserLikes = {
        likedDiscoveries: [1, 2, 3],
        likedRecommendations: [4, 5],
        totalLikes: 5
      };

      likeService.getUserLikes.mockResolvedValue(mockUserLikes);

      const res = await request(app).get('/likes/my-likes');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockUserLikes);
      expect(likeService.getUserLikes).toHaveBeenCalledWith('2');
    });

  });

  describe('GET /likes/status/discovery/:discoveryId', () => {
    test('should check like status for discovery', async () => {
      likeService.hasLikedDiscovery.mockResolvedValue(true);

      const res = await request(app).get('/likes/status/discovery/11');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasLiked).toBe(true);
      expect(res.body.data.discoveryId).toBe('11');
      expect(res.body.data.recommendationId).toBe(null);
      expect(likeService.hasLikedDiscovery).toHaveBeenCalledWith('2', '11');
    });

  });

  describe('GET /likes/status/recommendation/:recommendationId', () => {
    test('should check like status for recommendation', async () => {
      likeService.hasLikedRecommendation.mockResolvedValue(false);

      const res = await request(app).get('/likes/status/recommendation/11');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasLiked).toBe(false);
      expect(res.body.data.discoveryId).toBe(null);
      expect(res.body.data.recommendationId).toBe('11');
      expect(likeService.hasLikedRecommendation).toHaveBeenCalledWith('2', '11');
    });

  });

  describe('GET /likes/count/discovery/:discoveryId', () => {
    test('should get like count for discovery', async () => {
      likeService.getDiscoveryLikeCount.mockResolvedValue(25);

      const res = await request(app).get('/likes/count/discovery/11');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBe(25);
      expect(likeService.getDiscoveryLikeCount).toHaveBeenCalledWith('11');
    });

  });

  describe('GET /likes/count/recommendation/:recommendationId', () => {
    test('should get like count for recommendation', async () => {
      likeService.getRecommendationLikeCount.mockResolvedValue(15);

      const res = await request(app).get('/likes/count/recommendation/11');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBe(15);
      expect(likeService.getRecommendationLikeCount).toHaveBeenCalledWith('11');
    });

  });

  describe('GET /likes/most-liked/discoveries', () => {
    test('should get most liked discoveries with default limit', async () => {
      const mockDiscoveries = [
        { id: 11, title: 'Discovery 1', likeCount: 100 },
        { id: 1, title: 'Discovery 2', likeCount: 95 }
      ];

      likeService.getMostLikedDiscoveries.mockResolvedValue(mockDiscoveries);

      const res = await request(app).get('/likes/most-liked/discoveries');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockDiscoveries);
      expect(likeService.getMostLikedDiscoveries).toHaveBeenCalledWith(10);
    });

    test('should get most liked discoveries with custom limit', async () => {
      const mockDiscoveries = [
        { id: 11, title: 'Discovery 1', likeCount: 100 }
      ];

      likeService.getMostLikedDiscoveries.mockResolvedValue(mockDiscoveries);

      const res = await request(app).get('/likes/most-liked/discoveries?limit=5');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockDiscoveries);
      expect(likeService.getMostLikedDiscoveries).toHaveBeenCalledWith(5);
    });

  });

  describe('GET /likes/most-liked/recommendations', () => {
    test('should get most liked recommendations with default limit', async () => {
      const mockRecommendations = [
        { id: 11, title: 'Recommendation 1', likeCount: 80 },
        { id: 1, title: 'Recommendation 2', likeCount: 75 }
      ];

      likeService.getMostLikedRecommendations.mockResolvedValue(mockRecommendations);

      const res = await request(app).get('/likes/most-liked/recommendations');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockRecommendations);
      expect(likeService.getMostLikedRecommendations).toHaveBeenCalledWith(10);
    });

    test('should get most liked recommendations with custom limit', async () => {
      const mockRecommendations = [
        { id: 11, title: 'Recommendation 1', likeCount: 80 }
      ];

      likeService.getMostLikedRecommendations.mockResolvedValue(mockRecommendations);

      const res = await request(app).get('/likes/most-liked/recommendations?limit=3');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockRecommendations);
      expect(likeService.getMostLikedRecommendations).toHaveBeenCalledWith(3);
    });

  });
});
