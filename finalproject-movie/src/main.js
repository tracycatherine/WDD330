import './styles.css';
import { getWatchlist, saveWatchlist, getPreferences, savePreferences, getLastSearchQuery, saveLastSearchQuery, addToRecentlyViewed, isLocalStorageAvailable } from './storage.js';

// TMDb API Key (replace with your actual API key)
const TMDB_API_KEY = '9577b0cc16796f9d4370d6882a4d160c';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'; // <-- FIXED
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// OMDb API Key (replace with your actual API key)
const OMDB_API_KEY = 'f8e4c7ee';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

// Make these functions available globally
window.addToWatchlist = function(movieId, title, posterPath, releaseDate, voteAverage, overview) {
  const movie = {
    id: movieId,
    title: title,
    poster_path: posterPath,
    release_date: releaseDate,
    vote_average: voteAverage,
    overview: overview
  };
  
  const watchlist = getWatchlist();
  if (watchlist.some(item => item.id === movie.id)) {
    alert('This movie is already in your watchlist.');
    return;
  }
  watchlist.push(movie);
  saveWatchlist(watchlist);
  alert(`"${movie.title}" has been added to your watchlist.`);
  loadWatchlistContent();
};

window.shareRecommendation = function(movieId, title, releaseDate, overview) {
  const shareText = `Check out this movie: ${title} (${releaseDate}) - ${overview}`;
  navigator.clipboard.writeText(shareText).then(() => {
    alert('Movie recommendation copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy recommendation:', err);
    alert('Failed to copy recommendation. Please try again.');
  });
};

// Function to handle mobile hamburger menu
function setupMobileMenu() {
  const hamburgerButton = document.getElementById('hamburger-button');
  const navLinks = document.getElementById('nav-links');
  
  if (hamburgerButton && navLinks) {
    hamburgerButton.addEventListener('click', () => {
      navLinks.classList.toggle('visible');
    });
  }
}

// Function to check if local storage is available
function checkLocalStorage() {
  if (!isLocalStorageAvailable()) {
    console.warn('Local storage is not available. Some features may not work properly.');
    // Display a message to the user
    const appElement = document.getElementById('app');
    if (appElement) {
      const storageWarning = document.createElement('div');
      storageWarning.style.backgroundColor = '#fff3cd';
      storageWarning.style.color = '#856404';
      storageWarning.style.padding = '10px';
      storageWarning.style.marginBottom = '20px';
      storageWarning.style.borderRadius = '5px';
      storageWarning.textContent = 'Warning: Local storage is not available. Your preferences and watchlist won\'t be saved between visits.';
      appElement.prepend(storageWarning);
    }
  }
}

// Function to handle setting user preferences
function setupPreferences() {
  const preferencesButton = document.querySelector('#set-preferences');
  if (!preferencesButton) return; // Safety check
  
  preferencesButton.addEventListener('click', () => {
    const currentPreferences = getPreferences().preferences || [];
    const prefString = currentPreferences.join(', ');
    const preferences = prompt('Enter your favorite genres, actors, or directors (comma-separated):', prefString);
    
    if (preferences !== null) { // Check if user clicked Cancel
      const preferencesArray = preferences.split(',').map(pref => pref.trim()).filter(pref => pref !== '');
      savePreferences({ preferences: preferencesArray });
      alert('Preferences saved successfully!');
      
      // Reload personalized suggestions immediately
      loadPersonalizedSuggestions();
    }
  });
}

// Function to handle search functionality
function setupSearch() {
  const searchButton = document.querySelector('#search-button');
  const searchInput = document.querySelector('#search-input');
  
  if (!searchButton || !searchInput) return; // Safety check
  
  // Restore last search query if available
  const lastQuery = getLastSearchQuery();
  if (lastQuery) {
    searchInput.value = lastQuery;
  }
  
  searchButton.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (!query) {
      alert('Please enter a search term.');
      return;
    }
    
    // Save the search query
    saveLastSearchQuery(query);
    
    const results = await searchMovies(query);
    displayMovies(results, '#trending-content');
  });
}

// Function to handle input event for search bar
function setupSearchInputEvent() {
  const searchInput = document.querySelector('#search-input');
  if (!searchInput) return; // Safety check
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      searchInput.style.borderColor = '#3498db';
    } else {
      searchInput.style.borderColor = '#ddd';
    }
  });
}

// Function to handle keypress event for Enter key in search bar
function setupSearchKeypressEvent() {
  const searchInput = document.querySelector('#search-input');
  if (!searchInput) return; // Safety check
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const searchButton = document.querySelector('#search-button');
      if (searchButton) {
        searchButton.click(); // Trigger the search button click event
      }
    }
  });
}

// Function to search movies using TMDb API
async function searchMovies(query) {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching search results:', error);
    alert('Failed to load search results. Please try again later.');
    return [];
  }
}

// Function to load trending content using TMDb API
async function loadTrendingContent() {
  const trendingContent = document.querySelector('#trending-content');
  if (!trendingContent) return; // Safety check
  
  trendingContent.innerHTML = '<p>Loading trending content...</p>';
  try {
    const response = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    displayMovies(data.results, '#trending-content');
  } catch (error) {
    console.error('Error fetching trending content:', error);
    trendingContent.innerHTML = '<p>Failed to load trending content. Please try again later.</p>';
  }
}

// Function to display movies in a given container
function displayMovies(movies, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return; // Safety check

  if (!movies || !movies.length) {
    container.innerHTML = '<p>No movies found.</p>';
    return;
  }

  container.innerHTML = movies
    .map(movie => createMovieCard(movie))
    .join('');

  // Add event listeners for detailed view
  const movieCards = container.querySelectorAll('.movie-card');
  movieCards.forEach(card => {
    card.addEventListener('click', () => {
      const movieId = card.dataset.id;
      if (movieId) {
        loadMovieDetails(movieId);
      }
    });
  });

  setupCardHoverEffect();
  setupCardDoubleClickEvent();
}

// Function to create HTML for a movie card - FIXED TO PROPERLY ESCAPE VALUES
function createMovieCard(movie) {
  const posterPath = movie.poster_path
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Poster';
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown Year';
  
  // Escape special characters to prevent JS errors in onclick handlers
  const escapedTitle = movie.title ? movie.title.replace(/'/g, "\\'").replace(/"/g, '\\"') : '';
  const escapedOverview = movie.overview ? movie.overview.replace(/'/g, "\\'").replace(/"/g, '\\"').substring(0, 100) + '...' : '';

  return `
    <div class="movie-card" data-id="${movie.id}">
      <img src="${posterPath}" alt="${escapedTitle} poster" />
      <h3>${movie.title}</h3>
      <p>${releaseYear}</p>
      <p>⭐ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
      <button class="watchlist-btn" onclick="event.stopPropagation(); addToWatchlist(${movie.id}, '${escapedTitle}', '${movie.poster_path || ''}', '${movie.release_date || ''}', ${movie.vote_average || 0}, '${escapedOverview}')">Add to Watchlist</button>
      <button class="share-btn" onclick="event.stopPropagation(); shareRecommendation(${movie.id}, '${escapedTitle}', '${movie.release_date || ''}', '${escapedOverview}')">Share</button>
    </div>
  `;
}

// Function to load detailed movie information using OMDb API
async function loadMovieDetails(movieId) {
  try {
    // Fetch movie details from TMDb API
    const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
    if (!response.ok) {
      throw new Error(`TMDb API error! status: ${response.status}`);
    }
    const movieData = await response.json();
    
    // Add to recently viewed movies
    addToRecentlyViewed({
      id: movieData.id,
      title: movieData.title,
      poster_path: movieData.poster_path,
      release_date: movieData.release_date,
      vote_average: movieData.vote_average,
      overview: movieData.overview
    });

    // Check if imdb_id is available
    if (!movieData.imdb_id) {
      displayMovieDetails(movieData); // Show TMDb details only
      return;
    }

    // Fetch additional details from OMDb API using imdb_id
    console.log('OMDb fetch:', `${OMDB_BASE_URL}?i=${movieData.imdb_id}&apikey=${OMDB_API_KEY}`);
    console.log('imdb_id:', movieData.imdb_id);
    console.log('OMDb API key:', OMDB_API_KEY);
    const omdbResponse = await fetch(`${OMDB_BASE_URL}?i=${movieData.imdb_id}&apikey=${OMDB_API_KEY}`);
    if (!omdbResponse.ok) {
      throw new Error(`OMDb API error! status: ${omdbResponse.status}`);
    }
    const omdbData = await omdbResponse.json();

    // Fetch trailers from TMDb API
    const trailersResponse = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
    if (!trailersResponse.ok) {
      throw new Error(`Failed to fetch trailers. Status: ${trailersResponse.status}`);
    }
    const trailersData = await trailersResponse.json();
    const trailer = trailersData.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');

    // Display detailed movie information with trailer
    displayMovieDetails({ ...movieData, ...omdbData, trailer });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    alert(`Failed to load movie details. ${error.message}`);
  }
}

// Function to display detailed movie information
function displayMovieDetails(movie) {
  const app = document.querySelector('#app');
  if (!app) return; // Safety check
  
  const poster = movie.Poster || (movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster');
  
  app.innerHTML = `
    <div class="movie-details">
      <img src="${poster}" alt="${movie.Title || movie.title} poster" />
      <h2>${movie.Title || movie.title}</h2>
      <p><strong>Release Date:</strong> ${movie.Released || movie.release_date || 'N/A'}</p>
      <p><strong>Genre:</strong> ${movie.Genre || movie.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
      <p><strong>Director:</strong> ${movie.Director || 'N/A'}</p>
      <p><strong>Actors:</strong> ${movie.Actors || 'N/A'}</p>
      <p><strong>Plot:</strong> ${movie.Plot || movie.overview || 'N/A'}</p>
      <p><strong>IMDB Rating:</strong> ⭐ ${movie.imdbRating || 'N/A'}/10</p>
      ${movie.trailer ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${movie.trailer.key}" frameborder="0" allowfullscreen></iframe>` : ''}
      <div class="movie-actions">
        <button id="back-button">Back to Movies</button>
        <button id="add-to-watchlist-detail" onclick="addToWatchlist(${movie.id}, '${(movie.Title || movie.title).replace(/'/g, "\\'")}', '${movie.poster_path || ''}', '${movie.release_date || movie.Released || ''}', ${movie.vote_average || movie.imdbRating || 0}, '${(movie.overview || movie.Plot || '').replace(/'/g, "\\'")}')">Add to Watchlist</button>
      </div>
    </div>
  `;

  // Add event listener for back button
  const backButton = document.querySelector('#back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      initializeApp();
    });
  }
}

// Function to load watchlist content
function loadWatchlistContent() {
  const watchlistContent = document.querySelector('#watchlist-content');
  if (!watchlistContent) return; // Safety check
  
  const watchlist = getWatchlist();

  if (!watchlist || !watchlist.length) {
    watchlistContent.innerHTML = '<p>Your watchlist is empty.</p>';
    return;
  }

  watchlistContent.innerHTML = watchlist
    .map(movie => createMovieCard(movie))
    .join('');
    
  // Add event listeners for detailed view
  const movieCards = watchlistContent.querySelectorAll('.movie-card');
  movieCards.forEach(card => {
    card.addEventListener('click', () => {
      const movieId = card.dataset.id;
      if (movieId) {
        loadMovieDetails(movieId);
      }
    });
    
    // Change "Add to Watchlist" to "Remove from Watchlist"
    const watchlistBtn = card.querySelector('.watchlist-btn');
    if (watchlistBtn) {
      watchlistBtn.textContent = 'Remove from Watchlist';
      watchlistBtn.style.backgroundColor = '#e74c3c';
      
      // Replace the onclick handler
      watchlistBtn.outerHTML = watchlistBtn.outerHTML.replace(
        /onclick="[^"]*"/,
        `onclick="event.stopPropagation(); removeFromWatchlist(${movie.id})"`
      );
    }
  });

  setupCardHoverEffect();
}

// Function to handle click event for clearing the watchlist
function setupClearWatchlistEvent() {
  const watchlistSection = document.querySelector('#watchlist');
  if (!watchlistSection) return; // Safety check

  // Check if the button already exists
  if (watchlistSection.querySelector('#clear-watchlist-btn')) return;

  const clearButton = document.createElement('button');
  clearButton.id = 'clear-watchlist-btn';
  clearButton.textContent = 'Clear Watchlist';
  clearButton.style.marginTop = '20px';
  clearButton.style.backgroundColor = '#e74c3c';
  clearButton.style.color = '#fff';
  clearButton.style.border = 'none';
  clearButton.style.padding = '10px 20px';
  clearButton.style.borderRadius = '5px';
  clearButton.style.cursor = 'pointer';

  clearButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your watchlist?')) {
      saveWatchlist([]); // Clear the watchlist in local storage
      loadWatchlistContent(); // Refresh the watchlist display
      alert('Your watchlist has been cleared.');
    }
  });

  watchlistSection.appendChild(clearButton); // Append the button to the watchlist section
}

// Function to remove a movie from the watchlist
window.removeFromWatchlist = function(movieId) {
  const watchlist = getWatchlist();
  const updatedWatchlist = watchlist.filter(movie => movie.id !== movieId);
  saveWatchlist(updatedWatchlist);
  alert('Movie removed from watchlist.');
  loadWatchlistContent();
};

// Function to load personalized suggestions based on user preferences
async function loadPersonalizedSuggestions() {
  const suggestionsContent = document.querySelector('#suggestions-content');
  if (!suggestionsContent) return; // Safety check
  
  suggestionsContent.innerHTML = '<p>Loading personalized suggestions...</p>';
  
  const preferences = getPreferences();
  console.log('Retrieved preferences:', preferences); // Debug log
  
  const genres = preferences.preferences || [];
  
  if (!genres.length) {
    suggestionsContent.innerHTML = '<p>No preferences set. Please set your preferences to get personalized suggestions.</p>';
    return;
  }

  try {
    // For simplicity, let's just fetch popular movies
    // In a real implementation, you'd want to match against user preferences
    const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    displayMovies(data.results, '#suggestions-content');
  } catch (error) {
    console.error('Error fetching personalized suggestions:', error);
    suggestionsContent.innerHTML = '<p>Failed to load personalized suggestions. Please try again later.</p>';
  }
}

// Function to handle hover effect on movie cards
function setupCardHoverEffect() {
  const movieCards = document.querySelectorAll('.movie-card');
  movieCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.05)';
      card.style.transition = 'transform 0.3s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
    });
  });
}

// Function to handle double-click event for movie cards
function setupCardDoubleClickEvent() {
  const movieCards = document.querySelectorAll('.movie-card');
  movieCards.forEach(card => {
    card.addEventListener('dblclick', () => {
      const title = card.querySelector('h3')?.textContent || 'this movie';
      alert(`You double-clicked on "${title}"`);
    });
  });
}

// Initialize the app
function initializeApp() {
  const app = document.querySelector('#app');
  if (!app) {
    console.error('App container not found');
    return;
  }
  
  app.innerHTML = `
    <section id="preferences">
      <h1>Set Your Preferences</h1>
      <p>Select your favorite genres, actors, or directors to get personalized recommendations.</p>
      <button id="set-preferences">Set Preferences</button>
    </section>
    <section id="suggestions">
      <h2>Personalized Suggestions</h2>
      <div id="suggestions-content"></div>
    </section>
    <section id="search">
      <h2>Search for Movies and TV Shows</h2>
      <input type="text" placeholder="Search by title, genre, or actor" id="search-input" />
      <button id="search-button">Search</button>
    </section>
    <section id="trending">
      <h2>Trending Content</h2>
      <div id="trending-content"></div>
    </section>
    <section id="watchlist">
      <h2>Your Watchlist</h2>
      <div id="watchlist-content"></div>
    </section>
  `;

  checkLocalStorage();
  setupMobileMenu();
  setupPreferences();
  setupSearch();
  setupSearchInputEvent();
  setupSearchKeypressEvent();
  loadPersonalizedSuggestions();
  loadTrendingContent();
  loadWatchlistContent();
  setupClearWatchlistEvent(); // Ensure the clear watchlist button is added
  setupCardHoverEffect();
  setupCardDoubleClickEvent();
}

// Call the initialize function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Initialize the app
initializeApp();