const WATCHLIST_STORAGE_KEY = 'movie_watchlist';
const PREFERENCES_STORAGE_KEY = 'user_preferences';
const THEME_STORAGE_KEY = 'site_theme';
const LAST_SEARCH_STORAGE_KEY = 'last_search_query';
const RECENTLY_VIEWED_STORAGE_KEY = 'recently_viewed_movies';

// Function to get watchlist from local storage
export function getWatchlist() {
  try {
    const watchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return watchlist ? JSON.parse(watchlist) : [];
  } catch (error) {
    console.error('Error getting watchlist from local storage:', error);
    return [];
  }
}

// Function to save watchlist to local storage
export function saveWatchlist(watchlist) {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    return true;
  } catch (error) {
    console.error('Error saving watchlist to local storage:', error);
    return false;
  }
}

// Function to get user preferences from local storage
export function getPreferences() {
  try {
    const preferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    return preferences ? JSON.parse(preferences) : { preferences: [] };
  } catch (error) {
    console.error('Error getting preferences from local storage:', error);
    return { preferences: [] };
  }
}

// Function to save user preferences to local storage
export function savePreferences(preferences) {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Error saving preferences to local storage:', error);
    return false;
  }
}

// Function to get theme preference from local storage
export function getTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'light'; // Default to 'light' theme
  } catch (error) {
    console.error('Error getting theme from local storage:', error);
    return 'light';
  }
}

// Function to save theme preference to local storage
export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch (error) {
    console.error('Error saving theme to local storage:', error);
    return false;
  }
}

// Function to get last search query from local storage
export function getLastSearchQuery() {
  try {
    return localStorage.getItem(LAST_SEARCH_STORAGE_KEY) || '';
  } catch (error) {
    console.error('Error getting last search query from local storage:', error);
    return '';
  }
}

// Function to save last search query to local storage
export function saveLastSearchQuery(query) {
  try {
    localStorage.setItem(LAST_SEARCH_STORAGE_KEY, query);
    return true;
  } catch (error) {
    console.error('Error saving last search query to local storage:', error);
    return false;
  }
}

// Function to get recently viewed movies from local storage
export function getRecentlyViewedMovies() {
  try {
    const recentlyViewed = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    return recentlyViewed ? JSON.parse(recentlyViewed) : [];
  } catch (error) {
    console.error('Error getting recently viewed movies from local storage:', error);
    return [];
  }
}

// Function to save recently viewed movies to local storage
export function saveRecentlyViewedMovies(movies) {
  try {
    localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(movies));
    return true;
  } catch (error) {
    console.error('Error saving recently viewed movies to local storage:', error);
    return false;
  }
}

// Function to add a movie to recently viewed
export function addToRecentlyViewed(movie) {
  try {
    const recentlyViewed = getRecentlyViewedMovies();
    // Remove the movie if it's already in the list
    const filtered = recentlyViewed.filter(item => item.id !== movie.id);
    // Add the movie to the beginning of the array
    filtered.unshift(movie);
    // Keep only the 10 most recent movies
    const trimmed = filtered.slice(0, 10);
    saveRecentlyViewedMovies(trimmed);
    return true;
  } catch (error) {
    console.error('Error adding movie to recently viewed:', error);
    return false;
  }
}

// Function to check if local storage is available
export function isLocalStorageAvailable() {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}