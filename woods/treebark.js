// A key to use for storing and retrieving vote data in localStorage.
const localStorageKey = 'imageVotes';

// Load existing vote counts from localStorage, or initialize an empty object.
function getVotes() {
  const votes = localStorage.getItem(localStorageKey);
  return votes ? JSON.parse(votes) : {};
}

// Save the current votes object to localStorage.
function saveVotes(votes) {
  localStorage.setItem(localStorageKey, JSON.stringify(votes));
}

// Initialize the vote buttons and counters for all figures.
function initializeVoting() {
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
    voteCounter.textContent = voteCount;

    voteSection.appendChild(upvoteButton);
    voteSection.appendChild(voteCounter);
    figure.appendChild(voteSection);
  });

  // Use event delegation on the gallery to handle all button clicks.
  gallery.addEventListener('click', (event) => {
    if (event.target.classList.contains('upvote-btn')) {
      handleUpvoteClick(event);
    }
  });
}

// Handle an upvote click event.
function handleUpvoteClick(event) {
  const upvoteBtn = event.target;
  const figure = upvoteBtn.closest('figure');
  const imageId = figure.dataset.imageId;

  const votes = getVotes();
  votes[imageId] = (votes[imageId] || 0) + 1;
  saveVotes(votes);

  // Update the displayed vote count.
  const voteCounter = figure.querySelector('.vote-count');
  voteCounter.textContent = votes[imageId];
}

// Re-sort figures based on vote count or caption.
function sortFigures(sortOption) {
  const gallery = document.querySelector('.treebark-container');
  const figures = Array.from(gallery.querySelectorAll('figure'));
  const votes = getVotes();

  figures.sort((a, b) => {
    switch (sortOption) {
      case 'treebark-viewed-desc':
        const votesA = votes[a.dataset.imageId] || 0;
        const votesB = votes[b.dataset.imageId] || 0;
        return votesB - votesA;
      case 'treebark-title-asc':
        const titleA = a
          .querySelector('figcaption')
          .textContent.trim()
          .toLowerCase();
        const titleB = b
          .querySelector('figcaption')
          .textContent.trim()
          .toLowerCase();
        return titleA.localeCompare(titleB);
      case 'treebark-title-desc':
        const descTitleA = a
          .querySelector('figcaption')
          .textContent.trim()
          .toLowerCase();
        const descTitleB = b
          .querySelector('figcaption')
          .textContent.trim()
          .toLowerCase();
        return descTitleB.localeCompare(descTitleA);
      default:
        return 0; // Default to no sort change
    }
  });

  figures.forEach((figure, index) => {
    figure.style.order = index;
  });
}

// Filter figures
function filterFigures(searchText) {
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
}

// Reset counters for all images
function resetAllCounters() {
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
}

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
