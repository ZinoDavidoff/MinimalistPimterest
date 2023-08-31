// Constants
const GRID_ITEM_HEIGHTS = [250, 300, 350, 400];
const IMAGE_PER_PAGE = 30;
const IMAGE_SEARCH_DELAY = 1000;
const IMAGE_WIDTH = 400;

// DOM Elements
const grid = document.querySelector(".masonry-grid");
let masonry;
let divs = [];
let currentImageIndex;
let page = 1;
let isFiltering = false;
let isResultsEmpty = false;
let userSearchQuery;

const seasons = ["winter", "spring", "summer", "autumn"];

const getCurrentSeason = () => {
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;

  switch (month) {
    case 12: // December
    case 1: // January
    case 2: // February
      return "winter";
    case 3: // March
    case 4: // April
    case 5: // May
      return "spring";
    case 6: // June
    case 7: // July
    case 8: // August
      return "summer";
    case 9: // September
    case 10: // October
    case 11: // November
      return "autumn";
    default:
      return "random";
  }
};

// Function to fetch random images from a URL
const fetchRandomImages = async (page, query) => {
  const accessKey = "aa56xD0OIhaIDLxDNRbawHIj8NAZ6H6yzuN1OwEjGGs";
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${query}&client_id=${accessKey}&page=${page}&per_page=${IMAGE_PER_PAGE}`
  );
  const data = await response.json();
  isResultsEmpty = data.results.length === 0 ? true : false;
  console.log(data, isResultsEmpty);
  return data.results;
};

// Function to generate grid items asynchronously within a given index range
const generateGridItems = async (startIndex, endIndex, images) => {
  // Using Promise.all to create all the grid items asynchronously
  const newDivs = await Promise.all(
    Array.from(images, async (image, index) => {
      // Calculate the item index based on the current loop index
      const itemIndex = startIndex + index;

      // Randomly choose an image height from the imgHeights array
      const randomIndex = Math.floor(Math.random() * GRID_ITEM_HEIGHTS.length);
      const imgHeight = GRID_ITEM_HEIGHTS[randomIndex];

      const imageUrl = image.urls.regular;

      // Create the div element for the grid item
      const div = document.createElement("div");
      div.classList.add("grid-item");

      // Create and set the image element for the grid item
      const img = document.createElement("img");
      img.src = imageUrl;
      img.loading = "lazy";
      img.style.height = `${imgHeight}px`;
      img.style.width = `${IMAGE_WIDTH}px`;

      div.appendChild(img);

      // Create and set the h3 element for the grid item
      const h3 = document.createElement("h3");
      h3.textContent = `${itemIndex + 1} - ${image.alt_description}`;
      div.appendChild(h3);

      // Get the commentary and author data for the image
      const commentary = image.alt_description;
      const author = image.user.name;
      const tags = image.tags.map((tag) => tag.title);

      img.setAttribute("data-author", image.user.name);
      img.setAttribute("data-commentary", image.alt_description);
      div.setAttribute("data-tags", JSON.stringify(tags));

      // Add a click event listener to open the image modal on click
      div.addEventListener("click", () => {
        openImageModal({
          imageUrl,
          title: h3.textContent,
          commentary,
          author,
          itemIndex,
          tags,
        });
      });

      const favoriteButton = document.createElement("i");
      favoriteButton.classList.add("fa", "fa-heart", "favorite-button");
    
      div.appendChild(favoriteButton);

      const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

      if(favorites.length > 0) {
        goToFavoritesButton.style.display = "inline-block"; 
      }

      if (favorites.some((favImage) => favImage.id === image.id)) {
        favoriteButton.disabled = true;
        favoriteButton.classList.toggle("fav-icon")
      }

      favoriteButton.classList.contains("fav-icon")
      ? favoriteButton.setAttribute("title", "Remove from Favorites")
      : favoriteButton.setAttribute("title", "Add to Favorites");

      favoriteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!favoriteButton.classList.contains("fav-icon")) {
          addToFavorites(image);
          favoriteButton.classList.add("fav-icon");
          favoriteButton.setAttribute('title', 'Remove from Favorites')
        } else {
          removeFromFavorites(image);
          favoriteButton.classList.remove("fav-icon");
          favoriteButton.setAttribute('title', 'Add to Favorites')

        }      
      });

      return div;
    })
  );

  return newDivs;
};

const addToFavorites = (image) => {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if (!favorites.some((favImage) => favImage.id === image.id)) {
    favorites.push(image);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    goToFavoritesButton.style.display = "inline-block"; 
  }
};

const removeFromFavorites = (image) => {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const updatedFavorites = favorites.filter((favImage) => favImage.id !== image.id);
  localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  if (updatedFavorites.length === 0) {
    goToFavoritesButton.style.display = "none";
  }
};

const goToFavoritesButton = document.getElementById("goToFavoritesButton");
const homepageButton = document.getElementById("goToHomepageButton");

goToFavoritesButton.addEventListener("click", () => {
  displayFavoriteImages();
});

const displayFavoriteImages = async () => {
  grid.innerHTML = ""; // Clear the grid

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if (favorites.length === 0) {
    clearSearchResults();
    homepageButton.style.display = "none";
  } else {
    homepageButton.style.display = "inline-block";
  }

  const newDivs = await generateGridItems(0, favorites.length, favorites);

  newDivs.forEach((div) => {
    grid.appendChild(div);
    goToFavoritesButton.style.display = "none";
    const favoriteButton = div.querySelector(".favorite-button");
    favoriteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      displayFavoriteImages(); // Refresh the favorites grid
    });
  });

  initializeMasonryLayout();
};


homepageButton.addEventListener("click", () => {
  clearSearchResults();
  homepageButton.style.display = "none";
});


// Function to append the new grid items to the grid
const appendGridItems = (newDivs) => {
  newDivs.forEach((div) => {
    grid.appendChild(div);
  });
};

// Function to initialize the Masonry layout
const initializeMasonryLayout = () => {
  masonry = new Masonry(grid, {
    itemSelector: ".grid-item",
    columnWidth: ".grid-item",
    gutter: 20,
    fitWidth: true,
    horizontalOrder: false,
  });
};

// Function to generate and append grid items
const generateAndAppendGridItems = async () => {
  const searchQuery = isFiltering ? userSearchQuery : getCurrentSeason();
  const startIndex = divs.length;
  const endIndex = startIndex + IMAGE_PER_PAGE;
  const images = await fetchRandomImages(page, searchQuery);
  page++;

  const newDivs = await generateGridItems(startIndex, endIndex, images);

  newDivs.forEach((div) => {
    grid.appendChild(div);
  });

  divs = divs.concat(newDivs);
  appendGridItems(newDivs);
  initializeMasonryLayout();

  observer.disconnect();

  // Observe the newly added last grid child
  const lastGridChild = grid.lastElementChild;
  if (lastGridChild && !isResultsEmpty) {
    observer.observe(lastGridChild);
  }
};

// Modal-related DOM Elements
const modalOverlay = document.querySelector(".dark-overlay");
const modalImage = document.querySelector("#modal-image");
const modalContainer = document.querySelector(".modal-flex-container");
const modalImageContainer = document.querySelector(".modal-image-placeholder");
const searchContainer = document.querySelector(".search-container");

// Array to store image comments
const imageComments = [];

// Function to open the image modal and display image details
const openImageModal = (imageData) => {
  // Extracting image data from the parameter
  const { imageUrl, title, commentary, author, itemIndex, tags } = imageData;
  currentImageIndex = itemIndex;

  const formattedCommentary =
    commentary.charAt(0).toUpperCase() + commentary.slice(1);

  // Update the modal with the selected image and details
  modalImageContainer.style.display = "block";
  modalImage.style.display = "none";
  modalImage.setAttribute("src", imageUrl);
  modalImage.style.height = `${IMAGE_WIDTH}px`;
  modalImage.style.width = `${IMAGE_WIDTH}px`;

  document.querySelector(".modal-title").textContent = `Image ${itemIndex + 1}`;
  document.querySelector(".modal-commentary").textContent = formattedCommentary;
  document.querySelector(".modal-author").textContent = author;
  document.querySelector(".modal-tags").textContent = tags;
  modalOverlay.classList.add("open");
  modalContainer.classList.add("scaleImg");
  grid.style.filter = "blur(10px)";

  modalImage.addEventListener("load", () => {
    modalImageContainer.style.display = "none";
    modalImage.style.display = "block";
  });

  // Retrieve the comments for the current image
  const commentsForImage = imageComments[currentImageIndex] || [];
  displayComments(commentsForImage);

  // Get the tags for the current image
  displayTags(tags);
  addTagEventListeners();

  // Update the navigation buttons and other UI elements
  prevButton.style.display = currentImageIndex === 0 ? "none" : "block";

  checkIfNoComments();
  updateSendButtonState();
  checkModeClassInComments();
  searchContainer.style.display = "none";
};

// Function to display tags in the modal
const displayTags = (tags) => {
  const tagsContainer = document.querySelector(".modal-tags");
  tagsContainer.innerHTML = ""; // Clear previous tags

  tags.forEach((tag) => {
    const tagSpan = document.createElement("span");
    tagSpan.classList.add("tags");
    tagSpan.textContent = "#" + tag.toLowerCase().trim(); // Add '#' before each tag
    tagsContainer.appendChild(tagSpan);
  });
};

const addTagEventListeners = () => {
  // Select all tag elements within the modal
  const tagElements = document.querySelectorAll(".tags");

  // Add event listener to each tag
  tagElements.forEach((tagElement) => {
    tagElement.addEventListener("click", () => {
      // Extract the tag text (remove the "#" character)
      const selectedTag = tagElement.textContent.trim().substring(1);

      // Set the selected tag as the value of the search input
      searchInput.value = selectedTag;

      performSearch();
      closeImageModal();
    });
  });
};

// Function to close the image modal
const closeImageModal = () => {
  setTimeout(() => {
    modalImage.src = "";
  }, 300);
  modalOverlay.classList.remove("open");
  modalContainer.classList.remove("scaleImg");
  grid.style.filter = "blur(0)";
  currentImageIndex = undefined;
  commentaryField.value = ""; // Empty the commentary field when the modal is closed
  searchContainer.style.display = "flex";
};

// Event listener for the modal close button
const modalCloseButton = document.querySelector(".modal-close-button");
const modalCloseButton1 = document.querySelector(".modal-close-button-1");
modalCloseButton.addEventListener("click", closeImageModal);
modalCloseButton1.addEventListener("click", closeImageModal);

// Event listener to close the modal when clicking outside the modal image or info
modalOverlay.addEventListener("click", (event) => {
  const clickedElement = event.target;
  const isModalImage = clickedElement === modalImage;
  const isModalInfo = clickedElement.closest(".modal-info");

  if (!isModalImage && !isModalInfo) {
    closeImageModal();
  }
});

// Generate and append initial grid items
generateAndAppendGridItems();const isElementIntersectingViewport = (element) => {
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5, // Adjust this threshold as needed
  };

  const observer = new IntersectionObserver((entries) => {
    return entries[0].isIntersecting;
  }, options);

  observer.observe(element);
};


// Intersection Observer callback function for infinite scrolling
const intersectionCallback = (entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      generateAndAppendGridItems();
    }
  });
};

const options = {
  root: null,
  rootMargin: "0px",
  threshold: 1.0,
};

const observer = new IntersectionObserver(intersectionCallback, options);

// Share and Download buttons event listeners
const shareButtons = document.querySelectorAll(".share-button");
const downloadButtons = document.querySelectorAll(".download-button");

shareButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const modalImage = event.currentTarget.closest(".modal-flex-container");

    if (modalImage) {
      const img = modalImage.querySelector("img");
      if (img) {
        const imageUrl = img.getAttribute("src");
        const platform = event.currentTarget.classList[1];

        let sharingUrl;

        switch (platform) {
          case "facebook":
            sharingUrl = `https://www.facebook.com/sharer/sharer.php?u=${imageUrl}`;
            break;
          case "twitter":
            sharingUrl = `https://twitter.com/intent/tweet?url=${imageUrl}`;
            break;
          case "pinterest":
            sharingUrl = `https://pinterest.com/pin/create/button/?url=${imageUrl}`;
            break;
        }
        window.open(sharingUrl, "_blank");
      }
    }
  });
});

downloadButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const gridItem = event.currentTarget.closest(".modal-flex-container");
    const img = gridItem.querySelector("img");
    const imageUrl = img.getAttribute("src");

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "image.jpg";
    link.target = "_blank";
    document.body.appendChild(link);

    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  });
});

const prevButton = modalContainer.querySelector(".modal-arrow-button.prev");

modalContainer.addEventListener("click", (event) => {
  event.stopPropagation();
  const clickedElement = event.target;

  const navigateToIndex = (newIndex) => {
    if (newIndex !== -1) {
      const imageElement = divs[newIndex].querySelector("img");
      const tagsDataAttribute = divs[newIndex].getAttribute("data-tags");

      const newImageData = {
        imageUrl: divs[newIndex].querySelector("img").getAttribute("src"),
        title: divs[newIndex].querySelector("h3").textContent,
        commentary: imageElement.getAttribute("data-commentary"),
        author: imageElement.getAttribute("data-author"),
        itemIndex: newIndex,
        tags: JSON.parse(tagsDataAttribute),
        imgHeight: imageElement.height,
        imgWidth: imageElement.width,
      };
      openImageModal(newImageData);
    }
  };

  switch (true) {
    case clickedElement.classList.contains("prev"):
      if (isFiltering) {
        if (currentImageIndex > 0) {
          navigateToIndex(currentImageIndex - 1);
        }
      } else if (currentImageIndex > 0) {
        navigateToIndex(currentImageIndex - 1);
      }
      break;

    case clickedElement.classList.contains("next"):
      if (isFiltering) {
        if (currentImageIndex < divs.length - 1) {
          navigateToIndex(currentImageIndex + 1);
          if (currentImageIndex === divs.length - 1) {
            generateAndAppendGridItems();
          }
        }
      } else if (currentImageIndex < divs.length - 1) {
        navigateToIndex(currentImageIndex + 1);
        if (currentImageIndex === divs.length - 1) {
          generateAndAppendGridItems();
        }
      }
      break;

    default:
      break;
  }

  updateSendButtonState();
});

const commentaryField = document.getElementById("commentary-field");
const sendButton = document.getElementById("send-button");
const commentsList = document.getElementById("comments-list");

// Function to add a comment to the comments list
const addComment = () => {
  const comment = commentaryField.value.trim();

  if (comment !== "") {
    const commentItem = document.createElement("li");
    commentItem.textContent = comment;

    const removeButton = document.createElement("button");
    removeButton.innerHTML = '<i class="fas fa-trash"></i>';
    removeButton.classList.add("remove-button");
    commentItem.appendChild(removeButton);

    removeButton.addEventListener("click", () => {
      commentsList.removeChild(commentItem);
      checkIfNoComments();
    });

    commentsList.appendChild(commentItem);
    commentaryField.value = "";

    const commentsForImage = imageComments[currentImageIndex] || [];
    commentsForImage.push(comment);
    imageComments[currentImageIndex] = commentsForImage;

    if (commentsList.querySelector(".no-comments-message")) {
      commentsList.removeChild(
        commentsList.querySelector(".no-comments-message")
      );
    }
  }

  checkIfNoComments();
  updateSendButtonState();
  checkModeClassInComments();
};

// Function to update the state of the send button based on the comment field content
const updateSendButtonState = () => {
  const comment = commentaryField.value.trim();
  sendButton.style.cursor = comment === "" ? "not-allowed" : "pointer";
  sendButton.classList.toggle("disabled", comment === "");
};

// Event listener for the input event on the commentary field
commentaryField.addEventListener("input", updateSendButtonState);

// Function to display comments in the comments list
const displayComments = (comments) => {
  commentsList.innerHTML = "";

  comments.forEach((comment) => {
    const commentItem = document.createElement("li");
    commentItem.textContent = comment;

    const removeButton = document.createElement("button");
    removeButton.innerHTML = '<i class="fas fa-trash"></i>';
    removeButton.classList.add("remove-button");
    commentItem.appendChild(removeButton);

    removeButton.addEventListener("click", () => {
      commentsList.removeChild(commentItem);
      checkIfNoComments();
    });

    commentsList.appendChild(commentItem);
  });

  checkIfNoComments();
};

// Function to check if there are no comments and display a message
const checkIfNoComments = () => {
  if (commentsList.children.length === 0) {
    const noCommentsMessage = document.createElement("h3");
    noCommentsMessage.textContent = "No comments written";
    noCommentsMessage.classList.add("no-comments-message");
    commentsList.appendChild(noCommentsMessage);
  }
};

// Event listener for the send button click event
sendButton.addEventListener("click", addComment);

// Event listener for the Enter key press event on the commentary field
commentaryField.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    addComment();
  }
});

// Dark mode related elements
const darkModeToggle = document.getElementById("dark-mode-checkbox");
const body = document.body;
const elementsWithDarkModeClass = [body, grid, modalContainer];

// Function to apply styling to the comments list based on dark mode state
const applyStylingToCommentsList = (darkMode) => {
  const noCommentsWrittenItems = commentsList.querySelectorAll("li");
  noCommentsWrittenItems.forEach((li) => {
    if (li.textContent.trim() === "No comments written") {
      li.style.backgroundColor = darkMode ? "#1a1a1a" : "#ffffff";
      li.style.color = darkMode ? "#ffffff" : "#1a1a1a";
    }
    darkMode
      ? li.classList.add("light-mode")
      : li.classList.remove("light-mode");
  });
};

// Function to add the 'dark-mode' class to relevant elements
const addDarkModeClassToElements = () => {
  elementsWithDarkModeClass.forEach((element) =>
    element.classList.add("dark-mode")
  );
  applyStylingToCommentsList(true);
  commentaryField.style.boxShadow = "none";
  // Save dark mode preference in local storage
  localStorage.setItem("darkModePreference", "true");
};

// Function to remove the 'dark-mode' class from relevant elements
const removeDarkModeClassFromElements = () => {
  elementsWithDarkModeClass.forEach((element) =>
    element.classList.remove("dark-mode")
  );
  applyStylingToCommentsList(false);
  commentaryField.style.boxShadow = "3px 3px 3px 0px #d1d1d1";
  // Save dark mode preference in local storage
  localStorage.setItem("darkModePreference", "false");
};

// Function to check the current dark mode state and apply relevant class
const checkModeClassInComments = () => {
  darkModeToggle.checked
    ? addDarkModeClassToElements()
    : removeDarkModeClassFromElements()
};

// Load the user's dark mode preference from local storage and apply it
const darkModePreference = localStorage.getItem("darkModePreference");
darkModeToggle.checked = darkModePreference === "true";
darkModePreference === "true"
  ? addDarkModeClassToElements()
  : removeDarkModeClassFromElements()

const toggleSwitchLabel = document.querySelector(".toggle-switch");
const darkModeTitle = "Switch to Dark Mode";
const lightModeTitle = "Switch to Light Mode";

toggleSwitchLabel.title = darkModeToggle.checked ? lightModeTitle : darkModeTitle;

// Event listener for the dark mode toggle change event
darkModeToggle.addEventListener("change", () => {
  checkModeClassInComments()
  toggleSwitchLabel.title = darkModeToggle.checked ? lightModeTitle : darkModeTitle;
});

// Search related elements
const searchInput = document.getElementById("search-input");
let searchDelayTimer;

// Event listener for the input event on the search input field
searchInput.addEventListener("input", async () => {
  performDelayedSearch();
});

const performDelayedSearch = async () => {
  clearTimeout(searchDelayTimer); // Clear any existing timeout
  searchDelayTimer = setTimeout(async () => {
    performSearch();
  }, IMAGE_SEARCH_DELAY); // Adjust the delay time as needed
};

const performSearch = async () => {
  await scrollToTopSmoothly();

  const newSearchQuery = searchInput.value.trim();

  userSearchQuery = searchInput.value.trim();
  isFiltering = newSearchQuery !== ""; // Update the filtering state

  if (isFiltering) {
    userSearchQuery = newSearchQuery;
  } else {
    userSearchQuery = getCurrentSeason(); // Return to random query when search is cleared or empty
  }

  grid.innerHTML = "";
  try {
    const newImages = await fetchRandomImages(1, userSearchQuery);
    const newDivs = await generateGridItems(0, newImages.length, newImages);
    divs = newDivs;
    appendGridItems(newDivs);
    initializeMasonryLayout();
    observer.observe(grid.lastElementChild);
  } catch (error) {
    console.error("Error fetching images:", error);
  }

  updateClearButtonState(userSearchQuery);

  toggleNoContentMessage(divs.length === 0 && isFiltering);
};

const updateClearButtonState = (query) => {
  clearButton.disabled = query === "";
};

// Function to clear the search results and display all images
const clearSearchResults = async () => {
  grid.innerHTML = "";
  userSearchQuery = getCurrentSeason(); // Return to random query when search is cleared or empty

  try {
    page = 1;
    divs = [];
    await generateAndAppendGridItems();
  } catch (error) {
    console.error("Error fetching images:", error);
  }

  initializeMasonryLayout();
  isFiltering = false;
  observer.observe(grid.lastElementChild);
};

// Clear the search input field and perform a new search when the "Clear" button is clicked
const clearButton = document.getElementById("clear-button");

clearButton.addEventListener("click", async () => {
  if (searchInput.value.trim() !== "") {
    await scrollToTopSmoothly();
    searchInput.value = ""; // Clear the search input field
    clearSearchResults(); // Clear the search results and display all images
  }
});

// Function to scroll smoothly to the top of the page
const scrollToTopSmoothly = () => {
  return new Promise((resolve) => {
    if (window.scrollY === 0) {
      resolve();
    } else {
      const handleScroll = () => {
        if (window.scrollY === 0) {
          window.removeEventListener("scroll", handleScroll);
          resolve();
        }
      };

      scrollToTop();

      window.addEventListener("scroll", handleScroll);
    }
  });
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const showScrollToTopButton = () => {
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;

  // Show the button if the user has scrolled beyond the viewport height, otherwise hide it
  const scrollToTopButton = document.getElementById("scrollToTopButton");
  scrollToTopButton.classList.toggle("show", scrollY >= viewportHeight / 2);
};

// Add an event listener for the scroll event to show/hide the button
window.addEventListener("scroll", showScrollToTopButton);

// Add an event listener for the click event on the scrollToTopButton
const scrollToTopButton = document.getElementById("scrollToTopButton");
scrollToTopButton.addEventListener("click", scrollToTop);

const toggleNoContentMessage = (show) => {
  const noContentMessage = document.querySelector(".no-content-message");
  noContentMessage.style.display = show ? "block" : "none";
};
