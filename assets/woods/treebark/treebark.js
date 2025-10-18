// A key to use for storing and retrieving vote data in localStorage.
const localStorageKey = 'imageVotes';

// Load existing vote counts from localStorage, or initialize an empty object.
const getVotes = () => {
  const votes = localStorage.getItem(localStorageKey);
  return votes ? JSON.parse(votes) : {};
};

// Save the current votes object to localStorage.
const saveVotes = (votes) => {
  localStorage.setItem(localStorageKey, JSON.stringify(votes));
};

// Initialize the vote buttons and counters for all figures.
const initializeVoting = () => {
  const gallery = document.querySelector('.treebark-container');
  const figures = gallery.querySelectorAll('figure');
  const votes = getVotes();

  figures.forEach((figure) => {
    const imageId = figure.dataset.imageId;
    const voteCount = votes[imageId] || 0; // Get vote count or default to 0

    const voteSection = document.createElement('div');
    voteSection.classList.add('vote-section');

    const upvoteButton = document.createElement('button');
    upvoteButton.classList.add('upvote-btn');
    upvoteButton.textContent = "That's my tree!";

    const voteCounter = document.createElement('span');
    voteCounter.classList.add('vote-count');
    if (voteCount === 0) voteCounter.classList.add('hidden');
    voteCounter.textContent = voteCount;

    const downvoteButton = document.createElement('button');
    downvoteButton.classList.add('downvote-btn');
    if (voteCount === 0) downvoteButton.classList.add('hidden');
    downvoteButton.textContent = '-';

    voteSection.appendChild(upvoteButton);
    voteSection.appendChild(voteCounter);
    voteSection.appendChild(downvoteButton);
    figure.appendChild(voteSection);
  });

  // Use event delegation on the gallery to handle all button clicks.
  gallery.addEventListener('click', (event) => {
    if (event.target.classList.contains('upvote-btn')) {
      handleUpvoteClick(event);
    } else if (event.target.classList.contains('downvote-btn')) {
      handleDownvoteClick(event);
    }
  });
};

// Handle an upvote click event.
const handleUpvoteClick = (event) => {
  const upvoteBtn = event.target;
  const figure = upvoteBtn.closest('figure');
  const imageId = figure.dataset.imageId;

  const votes = getVotes();
  votes[imageId] = (votes[imageId] || 0) + 1;
  saveVotes(votes);

  // Update the displayed vote count.
  const voteCounter = figure.querySelector('.vote-count');
  voteCounter.textContent = votes[imageId];
  voteCounter.classList.remove('hidden');

  // Make sure downvote-button is visible
  const downvoteBtn = figure.querySelector('.downvote-btn');
  downvoteBtn.classList.remove('hidden');

  // Optionally, re-sort the images after a vote.
  const sortSelect = document.querySelector('#treebark-sort-select');
  if (sortSelect) {
    const selectedOption = sortSelect.value;
    sortFigures(selectedOption);
  }
};

// Handle a down-vote click event.
const handleDownvoteClick = (event) => {
  const downvoteBtn = event.target;
  const figure = downvoteBtn.closest('figure');
  const imageId = figure.dataset.imageId;

  const votes = getVotes();
  votes[imageId] = votes[imageId] - 1;
  saveVotes(votes);

  // Update the displayed vote count.
  const voteCounter = figure.querySelector('.vote-count');
  voteCounter.textContent = votes[imageId];

  // Update button visibility
  if (votes[imageId] === 0) {
    voteCounter.classList.add('hidden');
    downvoteBtn.classList.add('hidden');
  }

  // Optionally, re-sort the images after a vote.
  const sortSelect = document.querySelector('#treebark-sort-select');
  if (sortSelect) {
    const selectedOption = sortSelect.value;
    sortFigures(selectedOption);
  }
};

// Re-sort figures based on vote count or caption.

// Define compare functions

const compareByViewed = (votes, a, b) => {
  const votesA = votes[a.dataset.imageId] || 0;
  const votesB = votes[b.dataset.imageId] || 0;
  return votesB - votesA;
};

const compareByCaption = (a, b) => {
  const titleA = a.querySelector('figcaption').textContent.trim().toLowerCase();
  const titleB = b.querySelector('figcaption').textContent.trim().toLowerCase();
  return titleA.localeCompare(titleB);
};

// Sort

const sortFigures = (sortOption) => {
  const gallery = document.querySelector('.treebark-container');
  const figures = Array.from(gallery.querySelectorAll('figure'));
  const votes = getVotes();

  // Select comparison function
  let compareFn;
  switch (sortOption) {
    case 'treebark-viewed-desc':
      compareFn = (a, b) => compareByViewed(votes, a, b);
      break;
    case 'treebark-title-asc':
      compareFn = (a, b) => compareByCaption(a, b);
      break;
    case 'treebark-title-desc':
      compareFn = (a, b) => compareByCaption(b, a);
      break;
    default:
      compareFn = (_a, _b) => 0; // Default to no sort change
  }

  figures.sort(compareFn);
  figures.forEach((figure, index) => (figure.style.order = index));
};

// Filter figures
const filterFigures = (searchText) => {
  const gallery = document.querySelector('.treebark-container');
  const figures = gallery.querySelectorAll('figure');
  const searchTerm = searchText.trim().toLowerCase();

  figures.forEach((figure) => {
    const caption = figure
      .querySelector('figcaption')
      .textContent.trim()
      .toLowerCase();

    if (caption.includes(searchTerm)) {
      figure.classList.remove('hidden');
    } else {
      figure.classList.add('hidden');
    }
  });
};

// Reset counters for all images
const resetAllCounters = () => {
  // Clear the vote data from localStorage
  localStorage.removeItem(localStorageKey);

  // Update the UI to show all counters as 0
  const voteCounters = document.querySelectorAll('.vote-count');
  voteCounters.forEach((counter) => {
    counter.textContent = 0;
  });

  // Re-sort the images by their initial order (order 0)
  const figures = document.querySelectorAll('figure');
  figures.forEach((figure) => {
    figure.style.order = 0;
  });
};

// Run this function when the page loads to set everything up.
document.addEventListener('DOMContentLoaded', () => {
  initializeVoting();

  // Add sort and search event listeners
  const sortSelect = document.querySelector('#treebark-sort-select');
  const searchInput = document.querySelector('#treebark-search-input');
  const resetButton = document.querySelector('#treebark-reset-votes-button'); // New button

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const selectedOption = sortSelect.value;
      sortFigures(selectedOption);
    });
    // Sort figures when page loaded
    sortFigures(sortSelect.value);
  }

  if (searchInput) {
    // Listen for the 'input' event, which triggers on every keystroke
    searchInput.addEventListener('input', () => {
      filterFigures(searchInput.value);
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      resetAllCounters();
    });
  }
});
