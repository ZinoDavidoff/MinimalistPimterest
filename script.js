// Importing modules (commentaries.js and authors.js) to get data
import { Commentaries } from "./commentaries.js";
import { Authors } from "./authors.js";
import { Tags } from "./tags.js";

// Constants
const GRID_ITEM_HEIGHTS = [200, 250, 300, 350, 400];
const RANDOM_ARRAY_MIN_LENGTH = 50;
const RANDOM_ARRAY_MAX_LENGTH = 100;
const IMAGE_SEARCH_DELAY = 500;

// DOM Elements
const grid = document.querySelector(".masonry-grid");
let masonry;
let divs = [];
let currentImageIndex;

// Function to generate a random number within a range (min, max)
const generateRandomArrayLength = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generating a random array length within the range [50, 100]
const randomArrayLength = generateRandomArrayLength(  RANDOM_ARRAY_MIN_LENGTH,
  RANDOM_ARRAY_MAX_LENGTH);

// Function to generate grid items asynchronously within a given index range
const generateGridItems = async (startIndex, endIndex) => {
  // Predefined image heights for variety
  const imgHeights = GRID_ITEM_HEIGHTS;

  // Using Promise.all to create all the grid items asynchronously
  const newDivs = await Promise.all(
    Array.from({ length: endIndex - startIndex }, (_, index) => {
      // Calculate the item index based on the current loop index
      const itemIndex = startIndex + index;

      // const imageUrl =
      // Math.random() < 0.5
      //   ? `https://source.unsplash.com/random/400x${imgHeight}?sig=${randomImgID}`
      //   : `https://picsum.photos/400/${imgHeight}?random=${randomImgID}?grayscale`;

       //const imageUrl = `https://picsum.photos/400/${imgHeight}?random=${randomImgID}?grayscale`;

      // Randomly choose an image height from the imgHeights array
      const randomIndex = Math.floor(Math.random() * imgHeights.length);
      const imgHeight = imgHeights[randomIndex];

      // Generate a random image ID to avoid caching issues
      const randomImgID = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER ** Math.random());

      // Generate the image URL using Unsplash with random signature for uniqueness
      const imageUrl = `https://source.unsplash.com/400x${imgHeight}?sig=${randomImgID}`;

      // Generate a random number of tags for the current image (minimum 3)
      const numberOfTags = Math.floor(Math.random() * 3) + 3;

      // Get random tags from the Tags array
      const randomTags = getRandomTags(numberOfTags);

      // Create the div element for the grid item
      const div = document.createElement("div");
      div.classList.add("grid-item");
      div.randomTags = randomTags;

      // Create and set the image element for the grid item
      const img = document.createElement("img");
      img.src = imageUrl;
      img.loading = "lazy";
      img.style.height = `${imgHeight}px`;

      div.appendChild(img);

      // Create and set the h3 element for the grid item
      const h3 = document.createElement("h3");
      h3.textContent = `Image ${itemIndex + 1}`;
      div.appendChild(h3);

      // Get the commentary and author data for the image
      const commentary = Commentaries[itemIndex % Commentaries.length];
      const author = Authors[itemIndex % Authors.length];

      // Add a click event listener to open the image modal on click
      div.addEventListener("click", () => {
        openImageModal({
          imageUrl,
          title: h3.textContent,
          commentary,
          author,
          itemIndex,
          randomTags
        });
      });

      return div;
    })
  );

  return newDivs;
};


// Function to get random tags from the Tags array
const getRandomTags = (numberOfTags) => {
  const availableTags = Tags.slice(); // Create a copy of the Tags array
  const randomTags = [];

  for (let i = 0; i < numberOfTags; i++) {
    if (availableTags.length === 0) {
      // If all available tags have been used, break the loop
      break;
    }

    // Generate a random index to select a tag
    const randomIndex = Math.floor(Math.random() * availableTags.length);
    // Remove the selected tag from the availableTags array to avoid duplicates
    const selectedTag = availableTags.splice(randomIndex, 1)[0];
    // Push the selected tag to the randomTags array
    randomTags.push(selectedTag);
  }

  return randomTags;
};

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
  const startIndex = divs.length;
  const endIndex = startIndex + randomArrayLength;
  const newDivs = await generateGridItems(startIndex, endIndex);

  newDivs.forEach((div) => {
    // Store the randomTags property in the div element
    div.randomTags = div.randomTags || getRandomTags(3); // If randomTags is undefined, assign new tags
    grid.appendChild(div);
  });

  divs = divs.concat(newDivs);
  appendGridItems(newDivs);
  initializeMasonryLayout();

  observer.disconnect();

  // Observe the newly added last grid child
  const lastGridChild = grid.lastElementChild;
  if (lastGridChild) {
    observer.observe(lastGridChild);
  }
};

// Modal-related DOM Elements
const modalOverlay = document.querySelector(".dark-overlay");
const modalImage = document.querySelector("#modal-image");
const modalContainer = document.querySelector(".modal-flex-container");
const modalImageContainer = document.querySelector(".modal-image-placeholder");
const searchContainer = document.querySelector(".search-container")

// Array to store image comments
const imageComments = [];

// Function to open the image modal and display image details
const openImageModal = (imageData) => {
  // Extracting image data from the parameter
  const { imageUrl, title, commentary, author, itemIndex, randomTags } = imageData;
  currentImageIndex = itemIndex;

  // Update the modal with the selected image and details
  modalImageContainer.style.display = "block";
  modalImage.style.display = "none";
  modalImage.setAttribute("src", imageUrl);

  document.querySelector(".modal-title").textContent = title;
  document.querySelector(".modal-commentary").textContent = commentary;
  document.querySelector(".modal-author").textContent = author;
  modalOverlay.classList.add("open");
  modalContainer.classList.add("scaleImg");
  grid.style.filter = "blur(10px)";

  // Load the modal image and hide the placeholder when the image is loaded
  modalImage.addEventListener("load", () => {
    modalImageContainer.style.display = "none";
    modalImage.style.display = "block";
  });

  // Retrieve the comments for the current image
  const commentsForImage = imageComments[currentImageIndex] || [];
  displayComments(commentsForImage);

  // Get the tags for the current image
  displayTags(randomTags);


  // Update the navigation buttons and other UI elements
  if (currentImageIndex === 0) {
    prevButton.style.display = "none";
  } else {
    prevButton.style.display = "block";
  }

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
    tagSpan.classList.add("tags")
    tagSpan.textContent = "#" + tag.toLowerCase().trim(); // Add '#' before each tag
    tagsContainer.appendChild(tagSpan);

        // Add a click event listener to each tagSpan
    tagSpan.addEventListener("click", () => {
      const selectedCategory = tag.toLowerCase();
      performImageSearch(selectedCategory);
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
modalCloseButton.addEventListener("click", closeImageModal);

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
generateAndAppendGridItems();

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
    link.download = "";
    link.target = "_blank";
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  });
});

const prevButton = modalContainer.querySelector(".modal-arrow-button.prev");

modalContainer.addEventListener("click", (event) => {
  event.stopPropagation();
  const clickedElement = event.target;

  if (clickedElement.classList.contains("prev")) {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      const newImageData = {
        imageUrl: divs[newIndex].querySelector("img").getAttribute("src"),
        title: divs[newIndex].querySelector("h3").textContent,
        commentary: Commentaries[newIndex % Commentaries.length],
        author: Authors[newIndex % Authors.length],
        itemIndex: newIndex,
        randomTags: divs[newIndex].randomTags
      };
      openImageModal(newImageData);
    }
  } else if (clickedElement.classList.contains("next")) {
    if (currentImageIndex < divs.length - 1) {
      const newIndex = currentImageIndex + 1;
      const newImageData = {
        imageUrl: divs[newIndex].querySelector("img").getAttribute("src"),
        title: divs[newIndex].querySelector("h3").textContent,
        commentary: Commentaries[newIndex % Commentaries.length],
        author: Authors[newIndex % Authors.length],
        itemIndex: newIndex,
        randomTags: divs[newIndex].randomTags
      };
      openImageModal(newImageData);
    }
    if (currentImageIndex === divs.length - 1) {
      generateAndAppendGridItems();
    }
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
      commentsList.removeChild(commentsList.querySelector(".no-comments-message"));
    }
  }

  checkIfNoComments();
  updateSendButtonState();
  checkModeClassInComments();
};

// Function to update the state of the send button based on the comment field content
const updateSendButtonState = () => {
  const comment = commentaryField.value.trim();
  if (comment === "") {
    sendButton.style.cursor = "not-allowed";
    sendButton.classList.add("disabled")
  } else {
    sendButton.style.cursor = "pointer";
    sendButton.classList.remove("disabled")
  }
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
const darkModeToggle = document.getElementById('dark-mode-checkbox');
const body = document.body;
const elementsWithDarkModeClass = [body, grid, modalContainer];

// Function to apply styling to the comments list based on dark mode state
const applyStylingToCommentsList = (darkMode) => {
  const noCommentsWrittenItems = commentsList.querySelectorAll('li');
  noCommentsWrittenItems.forEach((li) => {
    if (li.textContent.trim() === "No comments written") {
      li.style.backgroundColor = darkMode ? "#1a1a1a" : "#ffffff";
      li.style.color = darkMode ? "#ffffff" : "#1a1a1a";
    }

    if (darkMode) {
      li.classList.add("light-mode");
    } else {
      li.classList.remove("light-mode");
    }
  });
};

// Function to add the 'dark-mode' class to relevant elements
const addDarkModeClassToElements = () => {
  elementsWithDarkModeClass.forEach((element) => element.classList.add('dark-mode'));
  applyStylingToCommentsList(true);
  commentaryField.style.boxShadow = 'none';
  // Save dark mode preference in local storage
  localStorage.setItem('darkModePreference', 'true');
};

// Function to remove the 'dark-mode' class from relevant elements
const removeDarkModeClassFromElements = () => {
  elementsWithDarkModeClass.forEach((element) => element.classList.remove('dark-mode'));
  applyStylingToCommentsList(false);
  commentaryField.style.boxShadow = '3px 3px 3px 0px #d1d1d1';
  // Save dark mode preference in local storage
  localStorage.setItem('darkModePreference', 'false');
};

// Function to check the current dark mode state and apply relevant class
const checkModeClassInComments = () => {
  if (darkModeToggle.checked) {
    addDarkModeClassToElements();
  } else {
    removeDarkModeClassFromElements();
  }
};

// Load the user's dark mode preference from local storage and apply it
const darkModePreference = localStorage.getItem('darkModePreference');
if (darkModePreference === 'true') {
  darkModeToggle.checked = true;
  addDarkModeClassToElements();
} else {
  darkModeToggle.checked = false;
  removeDarkModeClassFromElements();
}

// Event listener for the dark mode toggle change event
darkModeToggle.addEventListener('change', checkModeClassInComments);

// Search related elements
const searchInput = document.getElementById("search-input");
let searchTimeout;

// Function to perform image search based on the search query
const performImageSearch = (selectedCategory) => {
  const searchQuery = searchInput.value.trim().toLowerCase();
  let filteredImages;

  if (selectedCategory) {
    // Tag-based search
    closeImageModal()
    searchInput.value = ""; // Clear the search input field
    filteredImages = divs.filter((div) => {
      const tags = div.randomTags.map((tag) => tag.toLowerCase());
      return tags.includes(selectedCategory);
    });
  } else {
    // Title-based search
    filteredImages = divs.filter((div) => {
      const title = div.querySelector("h3").textContent.toLowerCase();
      return title.includes(searchQuery);
    });
  }

  grid.innerHTML = "";

  filteredImages.forEach((div) => {
    grid.appendChild(div);
  });

  initializeMasonryLayout();
};

// Event listener for the input event on the search input field
searchInput.addEventListener("input", () => {
  // Clear previous timeout (if any) to avoid unnecessary calls
  clearTimeout(searchTimeout);

  // Set a new timeout to perform the search after a delay
  searchTimeout = setTimeout(() => {
    const searchQuery = searchInput.value.trim().toLowerCase();
    if (searchQuery === "") {
      // Perform tag-based search based on the entered search query
      performImageSearch(searchQuery);
    } else {
      // Perform title-based search when the search bar is empty
      performImageSearch();
    }
  }, IMAGE_SEARCH_DELAY);
});

// Function to clear the search results and display all images
const clearSearchResults = () => {
  grid.innerHTML = "";

  divs.forEach((div) => {
    grid.appendChild(div);
  });

  initializeMasonryLayout();
};

// Clear the search input field and perform a new search when the "Clear" button is clicked
const clearButton = document.getElementById("clear-button");
clearButton.addEventListener("click", () => {
  searchInput.value = ""; // Clear the search input field
  clearSearchResults();   // Clear the search results and display all images
});

