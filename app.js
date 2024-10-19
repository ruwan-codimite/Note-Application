// Open the IndexedDB or create if it doesn't exist
let db;
var isDB = false;
const request = indexedDB.open("ChecklistDB", 1);

request.onupgradeneeded = function (event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains("checklists")) {
    db.createObjectStore("checklists", { keyPath: "mainTitle" });
  }
};

request.onsuccess = function (event) {
  db = event.target.result;
  isDB = true;
};

request.onerror = function (event) {
  console.error("Database error:", event.target.errorCode);
};

// Function to add a checklist item
const addChecklistItem = (
  title = "",
  description = "",
  checkStatus = false
) => {
  const checkListItemWrap = document.getElementById("checklist-items");

  const checklistItem = document.createElement("div");
  checklistItem.classList.add("checklist-item");
  checklistItem.innerHTML = `
  <div class="checklist-wrap-1">
      <input type="text" class="checklist-item-input" placeholder="Enter checklist item..." value="${title}" />
      <div class="checklist-buttons">
        <button class="move-up" onclick="moveChecklistItemUp(this)">
          <i class="bi bi-arrow-up"></i>
        </button>
        <button class="move-down" onclick="moveChecklistItemDown(this)">
          <i class="bi bi-arrow-down"></i>
        </button>
        <button class="delete-checklist-item" onclick="deleteChecklistItem(this)">
          <i class="bi bi-trash"></i>
        </button>
      </div>
      </div>
      <textarea class="checklist-item-description" rows="2"
        placeholder="Enter checklist item description...">${description}</textarea>
    `;
  checkListItemWrap.appendChild(checklistItem);
};

// Function to delete a checklist item
const deleteChecklistItem = (element) => {
  element.closest(".checklist-item").remove();
};

// Function to move checklist item up
const moveChecklistItemUp = (element) => {
  const checkListItemWrap = document.getElementById("checklist-items");
  const parent = element.closest(".checklist-item");
  const previousElement = parent.previousElementSibling;
  if (previousElement) {
    checkListItemWrap.insertBefore(parent, previousElement);
  } else {
    console.log("This item is already at the top.");
  }
};

// Function to move checklist item down
const moveChecklistItemDown = (element) => {
  const checkListItemWrap = document.getElementById("checklist-items");
  const parent = element.closest(".checklist-item");
  const nextElement = parent.nextElementSibling;
  if (nextElement) {
    checkListItemWrap.insertBefore(nextElement, parent);
  } else {
    console.log("This item is already at the bottom.");
  }
};

// Function to toggle the sidebar
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const content = document.querySelector(".content");

  if (sidebar.classList.contains("collapsed-sidebar")) {
    sidebar.classList.remove("collapsed-sidebar");
    content.style.marginLeft = "330px";
    // Call this function when the app starts or after a checklist is saved/deleted
    loadSavedChecklists();
  } else {
    sidebar.classList.add("collapsed-sidebar");
    content.style.marginLeft = "0";
  }
}

// Function to create a new checklist
function createNewCheckList() {
  const checklistWrap = document.getElementById("checklist-wrap");
  const metaData = `
      <input type="text" id="checklist-title" class="checklist-meta-input" placeholder="Enter checklist name..." />
      <button class="add-checklist-item" onclick="addChecklistItem()"><i class="bi bi-plus-square"></i> Add Checklist Item</button>
      <div class="checklist-items" id="checklist-items"></div>
      <div class="button-wrap">
        <button onclick="downloadChecklist()">Download checklist</button>
        <button onclick="saveChecklistToIndexedDB()">Save checklist</button>
      </div>
    `;
  checklistWrap.innerHTML = metaData;
}

// Function to download the checklist as JSON
function downloadChecklist() {
  const checklistTitle = document.getElementById("checklist-title").value;
  const checklistItems = document.querySelectorAll(".checklist-item");
  const items = [];

  checklistItems.forEach((item) => {
    const title = item.querySelector(".checklist-item-input").value;
    const description = item.querySelector(".checklist-item-description").value;
    const checkStatus = item.querySelector(".checklist-item-checkbox")
      ? item.querySelector(".checklist-item-checkbox").checked
      : false;

    items.push({ title, description, checkStatus });
  });

  const checklistData = { mainTitle: checklistTitle, items };
  const jsonString = JSON.stringify(checklistData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${checklistTitle || "checklist"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Function to load JSON file
function loadJSONFile() {
  const inputFile = document.getElementById("jsonFileInput");
  inputFile.click();

  inputFile.onchange = function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const jsonData = JSON.parse(e.target.result);
      renderChecklistFromJSON(jsonData);
    };

    reader.readAsText(file);
  };
}

// Function to render checklist from JSON
function renderChecklistFromJSON(jsonData) {
  createNewCheckList(); // Initialize new checklist structure

  document.getElementById("checklist-title").value = jsonData.mainTitle;
  jsonData.items.forEach((item) => {
    addChecklistItem(item.title, item.description, item.checkStatus);
  });
}

window.onload = function () {
  var x  = setInterval(function() {
    if(isDB){
      loadSavedChecklists();
      clearInterval(x);
    }
  }, 1000);
};

function saveChecklistToIndexedDB() {
  const checklistTitle = document.getElementById("checklist-title").value;
  const checklistItems = document.querySelectorAll(".checklist-item");
  const items = [];

  checklistItems.forEach((item) => {
    const title = item.querySelector(".checklist-item-input").value;
    const description = item.querySelector(".checklist-item-description").value;
    const checkStatus = item.querySelector(".checklist-item-checkbox")
      ? item.querySelector(".checklist-item-checkbox").checked
      : false;

    items.push({ title, description, checkStatus });
  });

  const checklistData = { mainTitle: checklistTitle, items };

  // Save the checklist data into IndexedDB
  const transaction = db.transaction(["checklists"], "readwrite");
  const objectStore = transaction.objectStore("checklists");
  const request = objectStore.put(checklistData);

  request.onsuccess = function () {
    console.log("Checklist saved to IndexedDB");
    loadSavedChecklists();
    closeChecklist();
  };

  request.onerror = function (event) {
    console.error("Error saving checklist to IndexedDB", event);
  };
}

// Function to filter sidebar items by title
document.getElementById("search-input").addEventListener("input", function () {
  const filterText = this.value.toLowerCase();
  const menuItems = document.querySelectorAll(".menu-item");

  menuItems.forEach((item) => {
    const title = item.querySelector(".item-title").textContent.toLowerCase();
    if (title.includes(filterText)) {
      item.style.display = ""; // Show the item if it matches the filter
    } else {
      item.style.display = "none"; // Hide the item if it doesn't match
    }
  });
});

function closeChecklist() {
  const checklistWrap = document.getElementById("checklist-wrap");
  checklistWrap.innerHTML = ""; // Clear the checklist content
}

function textAreaAdjust(element) {
  element.style.height = "1px";
  element.style.height = 2 + element.scrollHeight + "px";
}

function renderViewChecklist(checklist) {
  const checklistWrap = document.getElementById("checklist-wrap");

  // Clear previous content
  checklistWrap.innerHTML = `
      <div class="view-checklist-title">${checklist.mainTitle}</div>
      <div class="checklist-items" id="checklist-items"></div>
    `;

  const checklistItemsWrap = document.getElementById("checklist-items");

  // Add items from the checklist
  checklist.items.forEach((item) => {
    const checklistItem = document.createElement("div");
    checklistItem.classList.add("checklist-item-view");
    let x = item.description
      ? `<textarea class="checklist-item-description" disabled>${item.description}</textarea>`
      : "";
    checklistItem.innerHTML = `
        <div class="checklist-item-checkbox">
          <input type="checkbox" ${
            item.checkStatus ? "checked" : ""
          } />  <span class="checklist-item-title">${item.title}</span>
        </div>
        ${x}
      `;
    checklistItemsWrap.appendChild(checklistItem);
    textAreaAdjust(checklistItem.querySelector(".checklist-item-description"));
  });
}

// Function to fetch saved checklists from IndexedDB and render them in the sidebar
function loadSavedChecklists() {
  try {
    const transaction = db.transaction(["checklists"], "readonly");
    const objectStore = transaction.objectStore("checklists");
    const request = objectStore.getAll();

    request.onsuccess = function (event) {
      const checklists = event.target.result;
      const sidebarMenu = document.querySelector(".sidebar-menu");
      sidebarMenu.innerHTML = ""; // Clear existing sidebar items

      checklists.forEach((checklist) => {
        const menuItem = document.createElement("div");
        menuItem.classList.add("menu-item");
        menuItem.innerHTML = `
          <div class="item-title">${checklist.mainTitle}</div>
          <div class="item-buttons">
            <button class="delete-item" onclick="deleteChecklist('${checklist.mainTitle}')"><i class="bi bi-trash"></i></button>
            <button class="edit-item" onclick="editChecklist('${checklist.mainTitle}')"><i class="bi bi-pencil"></i></button>
            <button class="export-item" onclick="exportChecklist('${checklist.mainTitle}')"><i class="bi bi-download"></i></button>
            <button class="view-item" onclick="viewChecklist('${checklist.mainTitle}')"><i class="bi bi-eye"></i></button>
          </div>
        `;
        sidebarMenu.appendChild(menuItem);
      });
    };

    request.onerror = function (event) {
      console.error("Error fetching checklists from IndexedDB", event);
    };
  } catch (e) {
    console.log(e);
  }
}

function viewChecklist(title) {
  const transaction = db.transaction(["checklists"], "readonly");
  const objectStore = transaction.objectStore("checklists");
  const request = objectStore.get(title);

  request.onsuccess = function (event) {
    const checklist = event.target.result;
    renderViewChecklist(checklist); // Call a new function to render the non-editable view
  };

  request.onerror = function (event) {
    console.error("Error fetching checklist", event);
  };
}

function editChecklist(title) {
  const transaction = db.transaction(["checklists"], "readonly");
  const objectStore = transaction.objectStore("checklists");
  const request = objectStore.get(title);

  request.onsuccess = function (event) {
    const checklist = event.target.result;

    if (checklist) {
      // Clear and render the checklist in an editable format
      const checklistWrap = document.getElementById("checklist-wrap");
      checklistWrap.innerHTML = `
          <input type="text" id="checklist-title" class="checklist-meta-input" value="${checklist.mainTitle}" placeholder="Enter checklist name..." />
          <button class="add-checklist-item" onclick="addChecklistItem()"><i class="bi bi-plus-square"></i> Add Checklist Item</button>
          <div class="checklist-items" id="checklist-items"></div>
          <div class="button-wrap">
            <button onclick="downloadChecklist()">Download checklist</button>
            <button onclick="saveEditedChecklistToIndexedDB('${checklist.mainTitle}')">Save Changes</button>
          </div>
        `;

      // Populate the checklist items
      checklist.items.forEach((item) => {
        if (item.title) {
          addChecklistItem(item.title, item.description, item.checkStatus);
        }
      });
    } else {
      console.error(`No checklist found with title: ${title}`);
    }
  };

  request.onerror = function (event) {
    console.error("Error retrieving checklist from IndexedDB", event);
  };
}

// Function to save the edited checklist back to IndexedDB
function saveEditedChecklistToIndexedDB(originalTitle) {
  const checklistTitle = document.getElementById("checklist-title").value;
  const checklistItems = document.querySelectorAll(".checklist-item");
  const items = [];

  checklistItems.forEach((item) => {
    const title = item.querySelector(".checklist-item-input").value;
    const description = item.querySelector(".checklist-item-description").value;
    const checkStatus = item.querySelector(".checklist-item-checkbox")
      ? item.querySelector(".checklist-item-checkbox").checked
      : false;

    items.push({ title, description, checkStatus });
  });

  const updatedChecklistData = { mainTitle: checklistTitle, items };

  const transaction = db.transaction(["checklists"], "readwrite");
  const objectStore = transaction.objectStore("checklists");

  // If the title has been changed, delete the old checklist
  if (originalTitle !== checklistTitle) {
    objectStore.delete(originalTitle);
  }

  const request = objectStore.put(updatedChecklistData);

  request.onsuccess = function () {
    console.log("Checklist updated successfully in IndexedDB");
    loadSavedChecklists(); // Reload the sidebar
    closeChecklist(); // Close the checklist editor
  };

  request.onerror = function (event) {
    console.error("Error updating checklist in IndexedDB", event);
  };
}

function deleteChecklist(title) {
  const transaction = db.transaction(["checklists"], "readwrite");
  const objectStore = transaction.objectStore("checklists");
  const request = objectStore.delete(title);

  request.onsuccess = function () {
    console.log("Checklist deleted from IndexedDB");
    loadSavedChecklists(); // Refresh the sidebar
  };

  request.onerror = function (event) {
    console.error("Error deleting checklist from IndexedDB", event);
  };
}

function exportChecklist(title) {
  const transaction = db.transaction(["checklists"], "readonly");
  const objectStore = transaction.objectStore("checklists");
  const request = objectStore.get(title);

  request.onsuccess = function (event) {
    const checklist = event.target.result;
    const jsonString = JSON.stringify(checklist, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${checklist.mainTitle}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  request.onerror = function (event) {
    console.error("Error exporting checklist", event);
  };
}
