// Load project data from local storage or initialize an empty array
let projectData = JSON.parse(localStorage.getItem('projectData')) || [];
const rowHeight = 50;
const sprintWidth = 120;
const colors = ['#1a73e8', '#34a853', '#6B8E23', '#009688', '#9c27b0', '#4682B4'];

// Load the highlight row from local storage or default to 1
let highlightRow = parseInt(localStorage.getItem('highlightRow')) || 1;
document.getElementById('highlightRowInput').value = highlightRow;

// Update highlight row on input change and re-render
document.getElementById('highlightRowInput').addEventListener('input', (e) => {
    highlightRow = parseInt(e.target.value) || 1;
    localStorage.setItem('highlightRow', highlightRow);
    render();
});

// Set up drag event for toolbar items
document.querySelector('.toolbar-item').addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('type', 'epic');

    // Prevent the browser from dragging the toolbar button
    e.dataTransfer.setDragImage(new Image(), 0, 0);

    // Create a visual epic object to follow the cursor
    const visualEpic = document.createElement('div');
    visualEpic.className = 'epic';
    visualEpic.style.position = 'absolute';
    visualEpic.style.width = `${sprintWidth}px`;
    visualEpic.style.height = `${rowHeight}px`;
    visualEpic.style.backgroundColor = colors[projectData.length % colors.length];
    visualEpic.style.opacity = '0.5';
    visualEpic.style.pointerEvents = 'none';
    document.body.appendChild(visualEpic);

    document.addEventListener('dragover', (e) => {
        visualEpic.style.left = `${e.clientX - sprintWidth / 2}px`;
        visualEpic.style.top = `${e.clientY - rowHeight / 2}px`;
    });

    document.addEventListener('drop', () => {
        document.body.removeChild(visualEpic);
    }, { once: true });
});

// Prevent default behavior on dragover
timeline.addEventListener('dragover', (e) => e.preventDefault());

// Handle drop event to create a new epic
timeline.addEventListener('drop', (e) => {
    if (e.dataTransfer.getData('type') === 'epic') {
        let left = snapToGrid(e.clientX + timeline.scrollLeft - timeline.getBoundingClientRect().left);
        let top = snapToRow(e.clientY - timeline.getBoundingClientRect().top);
        const color = colors[projectData.length % colors.length];

        // Ensure the new epic drops in the same resource row and sprint column the mouse pointer is hovering over
        const rowIndex = Math.floor((e.clientY - timeline.getBoundingClientRect().top) / rowHeight);
        const colIndex = Math.floor((e.clientX + timeline.scrollLeft - timeline.getBoundingClientRect().left) / sprintWidth);
        top = rowIndex * rowHeight;
        left = colIndex * sprintWidth;

        // Check for overlap and adjust position if necessary
        if (checkOverlap(null, left, top, sprintWidth, rowHeight)) {
            const adjustment = 10; // Adjust by 10 pixels
            let adjusted = false;

            for (let dx = -adjustment; dx <= adjustment; dx += adjustment) {
                for (let dy = -adjustment; dy <= adjustment; dy += adjustment) {
                    if (!checkOverlap(null, left + dx, top + dy, sprintWidth, rowHeight)) {
                        left += dx;
                        top += dy;
                        adjusted = true;
                        break;
                    }
                }
                if (adjusted) break;
            }

            if (!adjusted) {
                alert("Cannot place Epic here - overlaps with existing Epic.");
                return;
            }
        }

        projectData.push({ id: Date.now(), name: 'New Epic', left, top, width: 1, resourceCount: 1, color, starred: false }); // Default width to 1 sprint and resource count to 1
        saveAndRender();
    }
});

// Save project data to local storage and re-render
function saveAndRender() {
    localStorage.setItem('projectData', JSON.stringify(projectData));
    render();
}

// Clear the timeline and reset settings
function clearTimeline() {
    projectData = [];
    localStorage.removeItem('pageTitle');
    saveAndRender();
    isLockAreaEnabled = false;
    localStorage.setItem('isLockAreaEnabled', JSON.stringify(isLockAreaEnabled));
    updateLockAreaToggle();
    const pageTitleElement = document.getElementById('page-title');
    pageTitleElement.innerText = "My Project";
    pageTitleElement.style.color = '#B0B0B0';
}

// Snap value to the nearest grid line
function snapToGrid(value) {
    return Math.round(value / sprintWidth) * sprintWidth;
}

// Snap value to the nearest row
function snapToRow(value) {
    return Math.round(value / rowHeight) * rowHeight;
}

// Render the timeline and epics
function render() {
    timeline.innerHTML = '<div class="timeline-grid"></div>';
    drawResourceRows();
    projectData.forEach(epic => timeline.appendChild(createEpicElement(epic)));
    drawSprintGrid();
}

// Draw resource rows on the timeline
function drawResourceRows() {
    const timelineWidth = 26 * sprintWidth;
    for (let i = 0; i < 50; i++) {
        const row = document.createElement('div');
        row.className = 'resource-row';
        row.style.top = `${i * rowHeight}px`;
        row.style.width = `${timelineWidth}px`;
        timeline.appendChild(row);
    }

    const resourceLine = document.createElement('div');
    resourceLine.className = 'resource-line';
    resourceLine.style.top = `${highlightRow * rowHeight - 2}px`;
    resourceLine.style.width = `${timeline.scrollWidth}px`; // Ensure the red line spans the full width of the timeline
    timeline.appendChild(resourceLine);
}

// Create an epic element
function createEpicElement(epic) {
    const epicEl = document.createElement('div');
    epicEl.className = 'epic';
    epicEl.style.backgroundColor = epic.color;
    epicEl.style.top = `${epic.top}px`;
    epicEl.style.left = `${epic.left}px`;
    epicEl.style.width = `${epic.width * sprintWidth}px`;
    epicEl.style.height = `${epic.resourceCount * rowHeight}px`;

    epicEl.innerHTML = `
        <div style="cursor: text; font-weight: bold;" onclick="startEditingEpicName(${epic.id})">${epic.name}</div>
        <div class="resize-handle"></div>
        <div class="resize-handle-vertical"></div>
        <div class="epic-label"><i class="fas fa-clock"></i> ${epic.width}</div>
        <div class="epic-resource-label"><i class="fas fa-users"></i> ${epic.resourceCount}</div>
        <div class="star-epic" onclick="toggleStarEpic(${epic.id})"><i class="fa${epic.starred ? 's' : 'r'} fa-star"></i></div>
        <div class="delete-epic" onclick="deleteEpic(${epic.id})"><i class="fas fa-trash-alt"></i></div>
    `;
    makeDraggable(epicEl, epic);
    return epicEl;
}

// Delete an epic by ID
function deleteEpic(epicId) {
    projectData = projectData.filter(epic => epic.id !== epicId);
    saveAndRender();
}

// Start editing the name of an epic
function startEditingEpicName(epicId) {
    const epic = projectData.find(e => e.id === epicId);
    const newName = prompt("Edit Epic Name:", epic.name);
    if (newName !== null) {
        epic.name = newName.trim() || "New Epic";
        saveAndRender();
    }
}

// Make an element draggable
function makeDraggable(element, epic) {
    element.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle')) startResizing(e, epic);
        else if (e.target.classList.contains('resize-handle-vertical')) startVerticalResizing(e, epic);
        else startDragging(e, epic);
    });
}

// Start dragging an epic
function startDragging(e, epic) {
    e.preventDefault();
    const offsetX = e.clientX - e.target.getBoundingClientRect().left;
    const offsetY = e.clientY - e.target.getBoundingClientRect().top;

    document.onmousemove = (e) => {
        let newLeft = snapToGrid(e.clientX - offsetX - timeline.getBoundingClientRect().left);
        let newTop = snapToRow(e.clientY - offsetY - timeline.getBoundingClientRect().top);

        if (newLeft < 0) newLeft = 0;
        if (newTop < 0) newTop = 0;

        if (!checkOverlap(epic, newLeft, newTop, epic.width * sprintWidth, epic.resourceCount * rowHeight)) {
            epic.left = newLeft;
            epic.top = newTop;
            render(); // Update the position visually during dragging
        }
    };
    document.onmouseup = () => {
        document.onmousemove = null;
        saveAndRender(); // Save the final position after dragging
    };
}

// Start resizing an epic horizontally
function startResizing(e, epic) {
    const startX = e.clientX;
    const initialWidth = epic.width * sprintWidth;
    const initialHeight = epic.resourceCount * rowHeight;

    document.onmousemove = (e) => {
        const newWidth = snapToGrid(Math.max(sprintWidth, initialWidth + (e.clientX - startX)));
        const newEpicWidth = Math.round(newWidth / sprintWidth);

        if (isLockAreaEnabled) {
            const totalCells = (initialHeight / rowHeight) * (initialWidth / sprintWidth);
            const newResourceCount = Math.round(totalCells / newEpicWidth);

            if (!checkOverlap(epic, epic.left, epic.top, newEpicWidth * sprintWidth, newResourceCount * rowHeight)) {
                epic.width = newEpicWidth;
                epic.resourceCount = newResourceCount;
                saveAndRender();
            }
        } else {
            if (!checkOverlap(epic, epic.left, epic.top, newEpicWidth * sprintWidth, epic.resourceCount * rowHeight)) {
                epic.width = newEpicWidth;
                saveAndRender();
            }
        }
    };

    document.onmouseup = () => document.onmousemove = null;
    e.stopPropagation();
}

// Toggle the lock area state
let isLockAreaEnabled = JSON.parse(localStorage.getItem('isLockAreaEnabled')) || false;

function toggleLockArea() {
    isLockAreaEnabled = !isLockAreaEnabled;
    localStorage.setItem('isLockAreaEnabled', JSON.stringify(isLockAreaEnabled));
    updateLockAreaToggle();
}

// Update the lock area toggle button
function updateLockAreaToggle() {
    const lockAreaToggle = document.getElementById('lock-effort-toggle');
    const icon = lockAreaToggle.querySelector('i');
    if (isLockAreaEnabled) {
        lockAreaToggle.classList.add('locked');
        icon.classList.remove('fa-lock-open');
        icon.classList.add('fa-lock');
        lockAreaToggle.innerHTML = '<i class="fas fa-lock"></i> Effort';
    } else {
        lockAreaToggle.classList.remove('locked');
        icon.classList.remove('fa-lock');
        icon.classList.add('fa-lock-open');
        lockAreaToggle.innerHTML = '<i class="fas fa-lock-open"></i> Effort';
    }
}

updateLockAreaToggle();

// Start resizing an epic vertically
function startVerticalResizing(e, epic) {
    const startY = e.clientY;
    const initialHeight = epic.resourceCount * rowHeight;
    const initialWidth = epic.width * sprintWidth;

    document.onmousemove = (e) => {
        const newHeight = snapToRow(Math.max(rowHeight, initialHeight + (e.clientY - startY)));
        const newResourceCount = Math.round(newHeight / rowHeight);

        if (isLockAreaEnabled) {
            const totalCells = (initialHeight / rowHeight) * (initialWidth / sprintWidth);
            const newEpicWidth = Math.round(totalCells / newResourceCount);

            if (!checkOverlap(epic, epic.left, epic.top, newEpicWidth * sprintWidth, newResourceCount * rowHeight)) {
                epic.width = newEpicWidth;
                epic.resourceCount = newResourceCount;
                saveAndRender();
            }
        } else {
            if (!checkOverlap(epic, epic.left, epic.top, epic.width * sprintWidth, newResourceCount * rowHeight)) {
                epic.resourceCount = newResourceCount;
                saveAndRender();
            }
        }
    };

    document.onmouseup = () => document.onmousemove = null;
    e.stopPropagation();
}

// Check if an epic overlaps with others
function checkOverlap(currentEpic, left, top, width = currentEpic?.width * sprintWidth, height = currentEpic?.resourceCount * rowHeight) {
    return projectData.some(epic =>
        epic.id !== currentEpic?.id &&
        (
            (top < epic.top + (epic.resourceCount * rowHeight) &&
             top + height > epic.top &&
             left < epic.left + (epic.width * sprintWidth) &&
             left + width > epic.left)
        )
    );
}

// Draw the sprint grid on the timeline
function drawSprintGrid() {
    const grid = document.querySelector('.timeline-grid');
    grid.innerHTML = '';
    const gridWidth = 26 * sprintWidth;
    const gridHeight = 50 * rowHeight;

    for (let x = 0; x < gridWidth; x += sprintWidth) {
        if (x > 0 && (x / sprintWidth) % 6 === 0) {
            const border = document.createElement('div');
            border.className = 'sprint-border';
            border.style.left = `${x}px`;
            border.style.height = `${gridHeight}px`;
            grid.appendChild(border);
        }
    }
}

// Load the saved title from local storage
const savedTitle = localStorage.getItem('pageTitle');
const pageTitleElement = document.getElementById('page-title');
if (savedTitle && savedTitle !== "My Project") {
    pageTitleElement.innerText = savedTitle;
    pageTitleElement.style.color = '';
} else {
    pageTitleElement.innerText = "My Project";
    pageTitleElement.style.color = '#B0B0B0';
}

// Prevent the title from expanding vertically when hitting "Enter"
pageTitleElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
});

// Save the title to local storage when it is edited
pageTitleElement.addEventListener('input', (e) => {
    const title = e.target.innerText.trim();
    if (title && title !== "My Project") {
        localStorage.setItem('pageTitle', title);
        pageTitleElement.style.color = '';
    } else {
        pageTitleElement.innerText = "My Project";
        pageTitleElement.style.color = '#B0B0B0';
        localStorage.setItem('pageTitle', "My Project");
    }
});

// Function to download project data
function downloadData() {
    const data = {
        projectData,
        pageTitle: localStorage.getItem('pageTitle'),
        isLockAreaEnabled: JSON.parse(localStorage.getItem('isLockAreaEnabled'))
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "projectData.gntt");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Function to upload project data
function uploadData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = JSON.parse(e.target.result);
            projectData = data.projectData || [];
            localStorage.setItem('pageTitle', data.pageTitle || "My Project");
            localStorage.setItem('isLockAreaEnabled', JSON.stringify(data.isLockAreaEnabled || false));
            saveAndRender();
            const pageTitleElement = document.getElementById('page-title');
            const savedTitle = localStorage.getItem('pageTitle');
            if (savedTitle && savedTitle !== "My Project") {
                pageTitleElement.innerText = savedTitle;
                pageTitleElement.style.color = '';
            } else {
                pageTitleElement.innerText = "My Project";
                pageTitleElement.style.color = '#B0B0B0';
            }
            isLockAreaEnabled = JSON.parse(localStorage.getItem('isLockAreaEnabled')) || false;
            updateLockAreaToggle();
        };
        reader.readAsText(file);
    }
}

// Function to automatically arrange epics to minimize empty space
function arrangeEpics() {
    const maxResources = parseInt(document.getElementById('highlightRowInput').value) || 1;
    const occupied = Array(maxResources).fill(0).map(() => Array(26).fill(false)); // Track occupied cells

    // Sort epics by starred status and then by size
    projectData.sort((a, b) => {
        if (a.starred !== b.starred) {
            return b.starred - a.starred;
        }
        return (b.resourceCount * b.width) - (a.resourceCount * a.width);
    });

    projectData.forEach(epic => {
        let found = false;

        for (let col = 0; col < 26 && !found; col++) {
            for (let row = 0; row < maxResources && !found; row++) {
                if (canPlaceEpic(epic, row, col, occupied)) {
                    placeEpic(epic, row, col, occupied);
                    found = true;
                }
            }
        }

        if (!found) {
            alert("Cannot arrange all epics within the defined resource limit.");
            return;
        }
    });

    saveAndRender();
}

// Check if an epic can be placed at the specified row and column
function canPlaceEpic(epic, row, col, occupied) {
    for (let r = row; r < row + epic.resourceCount; r++) {
        for (let c = col; c < col + epic.width; c++) {
            if (r >= occupied.length || c >= occupied[0].length || occupied[r][c]) {
                return false;
            }
        }
    }
    return true;
}

// Place an epic at the specified row and column
function placeEpic(epic, row, col, occupied) {
    epic.left = col * sprintWidth;
    epic.top = row * rowHeight;

    for (let r = row; r < row + epic.resourceCount; r++) {
        for (let c = col; c < col + epic.width; c++) {
            occupied[r][c] = true;
        }
    }
}

// Compact the epics vertically to eliminate empty vertical space
function compactEpicsVertically() {
    const maxResources = parseInt(document.getElementById('highlightRowInput').value) || 1;
    const occupied = Array(maxResources).fill(0).map(() => Array(26).fill(false)); // Track occupied cells

    projectData.forEach(epic => {
        let found = false;

        for (let row = 0; row < maxResources && !found; row++) {
            for (let col = 0; col < 26 && !found; col++) {
                if (canPlaceEpic(epic, row, col, occupied)) {
                    placeEpic(epic, row, col, occupied);
                    found = true;
                }
            }
        }
    });
}

// Toggle the star status of an epic
function toggleStarEpic(epicId) {
    const epic = projectData.find(e => e.id === epicId);
    epic.starred = !epic.starred;
    saveAndRender();
}

// Add event listener for the arrange button
document.getElementById('arrangeButton').addEventListener('click', arrangeEpics);

// Initial render of the timeline
saveAndRender();