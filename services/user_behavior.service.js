/**
 * User Behavior Service
 * - Automatically learns user preferences from their behavior
 * - Updates user preferences based on interactions
 */
const { UserPreferences } = require('../config/db.config');

// Track user view behavior and update preferences
exports.trackView = async (userId, behaviorData) => {
  try {
    const userIdNumber = Number(userId);
    let preferences = await UserPreferences.findOne({ where: { userId: userIdNumber } });
    
    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: userIdNumber,
        preferredLocations: [],
        preferredCategories: [],
        instagrammable: false,
        trending: false,
        exclusive: false,
        likedDiscoveries: [],
        likedRecommendations: []
      });
    }
    
    // Analyze behavior and update preferences
    const updatedPreferences = await analyzeAndUpdatePreferences(preferences, behaviorData);
    
    return updatedPreferences;
  } catch (error) {
    throw new Error(`Error tracking user behavior: ${error.message}`);
  }
};

// Analyze behavior data and update preferences
async function analyzeAndUpdatePreferences(preferences, behaviorData) {
  const updates = {};
  
  // Learn from category
  if (behaviorData.category) {
    const currentCategories = preferences.preferredCategories || [];
    if (!currentCategories.includes(behaviorData.category)) {
      updates.preferredCategories = [...currentCategories, behaviorData.category];
    }
  }
  
  // Learn from location
  if (behaviorData.location) {
    const currentLocations = preferences.preferredLocations || [];
    if (!currentLocations.includes(behaviorData.location)) {
      updates.preferredLocations = [...currentLocations, behaviorData.location];
    }
  }
  
  // Learn from budget (if user views $$ content, they prefer $$)
  if (behaviorData.budget) {
    updates.preferredBudget = behaviorData.budget;
  }
  
  // Learn from time of day
  if (behaviorData.timeOfDay) {
    updates.preferredTimeOfDay = behaviorData.timeOfDay;
  }
  
  // Learn from rating (if they view high-rated content, they prefer high ratings)
  if (behaviorData.rating && behaviorData.rating > 4.0) {
    updates.minRating = Math.max(preferences.minRating || 3.0, behaviorData.rating - 0.5);
  }
  
  // Learn from special attributes
  if (behaviorData.instagrammable) {
    updates.instagrammable = true;
  }
  
  if (behaviorData.trending) {
    updates.trending = true;
  }
  
  if (behaviorData.exclusive) {
    updates.exclusive = true;
  }
  
  // Learn from view duration (longer views = more interest)
  if (behaviorData.viewDuration > 10) {
    // User spent time reading, they're interested in this type of content
    if (behaviorData.category) {
      const currentCategories = updates.preferredCategories || preferences.preferredCategories || [];
      if (!currentCategories.includes(behaviorData.category)) {
        updates.preferredCategories = [...currentCategories, behaviorData.category];
      }
    }
  }
  
  // Learn from scroll depth (high scroll = high interest)
  if (behaviorData.scrollDepth > 70) {
    // User scrolled through most of the content
    if (behaviorData.location) {
      const currentLocations = updates.preferredLocations || preferences.preferredLocations || [];
      if (!currentLocations.includes(behaviorData.location)) {
        updates.preferredLocations = [...currentLocations, behaviorData.location];
      }
    }
  }
  
  // Apply updates if any
  if (Object.keys(updates).length > 0) {
    await preferences.update(updates);
    await preferences.reload();
  }
  
  return preferences;
}

// Track user like behavior
exports.trackLike = async (userId, likeData) => {
  try {
    const userIdNumber = Number(userId);
    let preferences = await UserPreferences.findOne({ where: { userId: userIdNumber } });
    
    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: userIdNumber,
        preferredLocations: [],
        preferredCategories: [],
        instagrammable: false,
        trending: false,
        exclusive: false,
        likedDiscoveries: [],
        likedRecommendations: []
      });
    }
    
    // Strong signal - user liked this content
    const updates = {};
    
    if (likeData.category) {
      const currentCategories = preferences.preferredCategories || [];
      if (!currentCategories.includes(likeData.category)) {
        updates.preferredCategories = [...currentCategories, likeData.category];
      }
    }
    
    if (likeData.location) {
      const currentLocations = preferences.preferredLocations || [];
      if (!currentLocations.includes(likeData.location)) {
        updates.preferredLocations = [...currentLocations, likeData.location];
      }
    }
    
    if (likeData.budget) {
      updates.preferredBudget = likeData.budget;
    }
    
    if (likeData.instagrammable) {
      updates.instagrammable = true;
    }
    
    if (likeData.trending) {
      updates.trending = true;
    }
    
    if (likeData.exclusive) {
      updates.exclusive = true;
    }
    
    if (Object.keys(updates).length > 0) {
      await preferences.update(updates);
      await preferences.reload();
    }
    
    return preferences;
  } catch (error) {
    throw new Error(`Error tracking like behavior: ${error.message}`);
  }
};

// Track user search behavior
exports.trackSearch = async (userId, searchData) => {
  try {
    const userIdNumber = Number(userId);
    let preferences = await UserPreferences.findOne({ where: { userId: userIdNumber } });
    
    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: userIdNumber,
        preferredLocations: [],
        preferredCategories: [],
        instagrammable: false,
        trending: false,
        exclusive: false,
        likedDiscoveries: [],
        likedRecommendations: []
      });
    }
    
    const updates = {};
    
    // Learn from search terms
    if (searchData.searchTerm) {
      const searchTerm = searchData.searchTerm.toLowerCase();
      
      // Check if search term matches any categories
      const categories = ['adventure', 'relaxation', 'culture', 'food', 'nature', 'nightlife', 'shopping', 'history'];
      const matchedCategory = categories.find(cat => searchTerm.includes(cat));
      
      if (matchedCategory) {
        const currentCategories = preferences.preferredCategories || [];
        if (!currentCategories.includes(matchedCategory)) {
          updates.preferredCategories = [...currentCategories, matchedCategory];
        }
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await preferences.update(updates);
      await preferences.reload();
    }
    
    return preferences;
  } catch (error) {
    throw new Error(`Error tracking search behavior: ${error.message}`);
  }
};

// Get user preferences (for frontend to display current preferences)
exports.getUserPreferences = async (userId) => {
  try {
    const userIdNumber = Number(userId);
    let preferences = await UserPreferences.findOne({ where: { userId: userIdNumber } });
    
    if (!preferences) {
      // Create default preferences if none exist
      preferences = await UserPreferences.create({
        userId: userIdNumber,
        preferredLocations: [],
        preferredCategories: [],
        instagrammable: false,
        trending: false,
        exclusive: false,
        likedDiscoveries: [],
        likedRecommendations: []
      });
    }
    
    return preferences;
  } catch (error) {
    throw new Error(`Error fetching user preferences: ${error.message}`);
  }
};
