const express = require('express');
const request = require('supertest');

// Mock the recommendation service
jest.mock('../services/recommendation.service', () => ({
  getAllRecommendations: jest.fn(),
  getRecommendationById: jest.fn(),
  createRecommendation: jest.fn(),
  updateRecommendation: jest.fn(),
  deleteRecommendation: jest.fn(),
  findSimilarUsers: jest.fn(),
  getCollaborativeRecommendations: jest.fn(),
  getDiscoveryBasedRecommendations: jest.fn(),
  getPersonalizedDiscoveries: jest.fn()
}));

// Mock the like service
jest.mock('../services/like.service', () => ({
  likeDiscovery: jest.fn(),
  likeRecommendation: jest.fn(),
  unlikeDiscovery: jest.fn(),
  unlikeRecommendation: jest.fn(),
  getUserLikes: jest.fn(),
  getLikeStatus: jest.fn(),
  getLikeCount: jest.fn(),
  getMostLikedDiscoveries: jest.fn(),
  getMostLikedRecommendations: jest.fn()
}));

// Mock the discovery service
jest.mock('../services/discovery.service', () => ({
  getAllDiscoveries: jest.fn(),
  getDiscoveryById: jest.fn(),
  createDiscovery: jest.fn(),
  updateDiscovery: jest.fn(),
  deleteDiscovery: jest.fn()
}));

const recommendationService = require('../services/recommendation.service');
const discoveryRoutes = require('../routes/discovery.route');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/discoveries', discoveryRoutes);
  return app;
}

describe('Discovery-Based Collaborative Filtering API', () => {
  const app = makeApp();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /discoveries/recommendations/similar-users', () => {
    test('should return similar users for authenticated user', async () => {
      const mockSimilarUsers = [2, 3, 5, 8];
      recommendationService.findSimilarUsers.mockResolvedValue(mockSimilarUsers);

      const res = await request(app)
        .get('/discoveries/recommendations/similar-users')
        .set('x-user-id', '123')
        .query({ limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockSimilarUsers);
      expect(res.body.count).toBe(4);
      expect(recommendationService.findSimilarUsers).toHaveBeenCalledWith('123', 5);
    });


    test('should use default limit when not provided', async () => {
      const mockSimilarUsers = [2, 3];
      recommendationService.findSimilarUsers.mockResolvedValue(mockSimilarUsers);

      const res = await request(app)
        .get('/discoveries/recommendations/similar-users')
        .set('x-user-id', '123');

      expect(res.status).toBe(200);
      expect(recommendationService.findSimilarUsers).toHaveBeenCalledWith('123', 10);
    });
  });

  describe('GET /discoveries/recommendations/collaborative', () => {
    test('should return collaborative recommendations', async () => {
      const mockRecommendations = [
        {
          id: 1,
          title: 'Hidden Beach Paradise',
          description: 'A secluded beach with crystal clear waters',
          rating: 4.8,
          location: 'Maldives',
          tags: ['beach', 'paradise', 'secluded'],
          category: 'hidden-gems',
          price: '$$$',
          trending: true
        },
        {
          id: 2,
          title: 'Mountain Adventure Trail',
          description: 'Challenging hiking trail with amazing views',
          rating: 4.6,
          location: 'Switzerland',
          tags: ['hiking', 'mountains', 'adventure'],
          category: 'trending',
          price: '$$',
          trending: true
        }
      ];
      recommendationService.getCollaborativeRecommendations.mockResolvedValue(mockRecommendations);

      const res = await request(app)
        .get('/discoveries/recommendations/collaborative')
        .set('x-user-id', '123')
        .query({ limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockRecommendations);
      expect(res.body.count).toBe(2);
      expect(res.body.type).toBe('collaborative_filtering');
      expect(recommendationService.getCollaborativeRecommendations).toHaveBeenCalledWith('123', 5);
    });


    test('should return trending recommendations when no similar users found', async () => {
      const mockTrendingRecommendations = [
        {
          id: 3,
          title: 'Trending City Tour',
          description: 'Popular city walking tour',
          rating: 4.9,
          trending: true,
          category: 'trending',
          location: 'Paris',
          tags: ['city', 'walking', 'culture']
        }
      ];
      recommendationService.getCollaborativeRecommendations.mockResolvedValue(mockTrendingRecommendations);

      const res = await request(app)
        .get('/discoveries/recommendations/collaborative')
        .set('x-user-id', '123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTrendingRecommendations);
    });
  });

  describe('GET /discoveries/recommendations/discovery-based', () => {
    test('should return discovery-based recommendations', async () => {
      const mockRecommendations = [
        {
          id: 4,
          title: 'Cultural Heritage Site',
          description: 'Ancient temple with rich history',
          rating: 4.7,
          location: 'Japan',
          tags: ['culture', 'history', 'temple'],
          category: 'local-favorites',
          price: '$$'
        }
      ];
      recommendationService.getDiscoveryBasedRecommendations.mockResolvedValue(mockRecommendations);

      const res = await request(app)
        .get('/discoveries/recommendations/discovery-based')
        .set('x-user-id', '123')
        .query({ limit: 3 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockRecommendations);
      expect(res.body.count).toBe(1);
      expect(res.body.type).toBe('discovery_based');
      expect(recommendationService.getDiscoveryBasedRecommendations).toHaveBeenCalledWith('123', 3);
    });


    test('should return trending recommendations when user has no likes', async () => {
      const mockTrendingRecommendations = [
        {
          id: 5,
          title: 'Popular Restaurant',
          description: 'Highly rated local restaurant',
          rating: 4.8,
          trending: true,
          category: 'trending',
          location: 'Tokyo',
          tags: ['food', 'restaurant', 'local']
        }
      ];
      recommendationService.getDiscoveryBasedRecommendations.mockResolvedValue(mockTrendingRecommendations);

      const res = await request(app)
        .get('/discoveries/recommendations/discovery-based')
        .set('x-user-id', '456');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockTrendingRecommendations);
    });
  });

  describe('GET /discoveries/recommendations/personalized', () => {
    test('should return personalized discovery recommendations', async () => {
      const mockRecommendations = [
        {
          id: 6,
          title: 'Art Gallery Tour',
          description: 'Contemporary art exhibition',
          rating: 4.5,
          location: 'New York',
          tags: ['art', 'culture', 'exhibition'],
          category: 'cultural',
          price: '$$'
        }
      ];
      recommendationService.getPersonalizedDiscoveries.mockResolvedValue(mockRecommendations);

      const res = await request(app)
        .get('/discoveries/recommendations/personalized')
        .set('x-user-id', '123')
        .query({ limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockRecommendations);
      expect(res.body.count).toBe(1);
      expect(res.body.type).toBe('personalized_discoveries');
      expect(recommendationService.getPersonalizedDiscoveries).toHaveBeenCalledWith('123', 5);
    });

  });

  describe('Integration Tests', () => {
    test('should work with different user preferences', async () => {
      // Mock different scenarios for different users
      const user123SimilarUsers = [2, 3, 5];
      const user123Recommendations = [
        { id: 1, title: 'Beach Resort', rating: 4.8, category: 'trending' },
        { id: 2, title: 'Mountain Lodge', rating: 4.6, category: 'hidden-gems' }
      ];

      recommendationService.findSimilarUsers.mockResolvedValue(user123SimilarUsers);
      recommendationService.getCollaborativeRecommendations.mockResolvedValue(user123Recommendations);

      const res = await request(app)
        .get('/discoveries/recommendations/collaborative')
        .set('x-user-id', '123');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.type).toBe('collaborative_filtering');
    });

    test('should handle edge case with no recommendations', async () => {
      recommendationService.getCollaborativeRecommendations.mockResolvedValue([]);

      const res = await request(app)
        .get('/discoveries/recommendations/collaborative')
        .set('x-user-id', '999');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.count).toBe(0);
    });
  });
});
