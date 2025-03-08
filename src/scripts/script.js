// inject:hostname-check

let projectData = JSON.parse(localStorage.getItem('projectData')) || [];
const rowHeight = 50;
const sprintWidth = 120; // Updated sprint width
const colors = ['#1a73e8', '#34a853', '#6B8E23', '#009688', '#9c27b0', '#4682B4'];

let highlightRow = parseInt(localStorage.getItem('highlightRow')) || 1;
document.getElementById('highlightRowInput').value = highlightRow;

document.getElementById('highlightRowInput').addEventListener('input', (e) => {
    highlightRow = parseInt(e.target.value) || 1;
    localStorage.setItem('highlightRow', highlightRow);
    render();
});

document.querySelector('.toolbar-item').addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('type', 'epic');
});

timeline.addEventListener('dragover', (e) => e.preventDefault());

timeline.addEventListener('drop', (e) => {
    if (e.dataTransfer.getData('type') === 'epic') {
        const left = snapToGrid(e.clientX - timeline.getBoundingClientRect().left);
        const top = snapToRow(projectData.length * rowHeight);
        const color = colors[projectData.length % colors.length];

        if (checkOverlap(null, left, top, sprintWidth * 3)) {
            alert("Cannot place Epic here - overlaps with existing Epic.");
            return;
        }

        projectData.push({ id: Date.now(), name: 'New Epic', left, top, width: 3, resourceCount: 1, color }); // Store width in sprints
        saveAndRender();
    }
});

function saveAndRender() {
    localStorage.setItem('projectData', JSON.stringify(projectData));
    render();
}

function clearTimeline() {
    projectData = [];
    localStorage.removeItem('pageTitle'); // Clear the project title
    saveAndRender();
    // Reset the effort toggle to "Unlocked"
    isLockAreaEnabled = false;
    localStorage.setItem('isLockAreaEnabled', JSON.stringify(isLockAreaEnabled));
    updateLockAreaToggle();
    // Reset the project title
    const pageTitleElement = document.getElementById('page-title');
    pageTitleElement.innerText = "My Project";
    pageTitleElement.style.color = '#B0B0B0'; // Light gray color for default text
}

function snapToGrid(value) {
    return Math.round(value / sprintWidth) * sprintWidth;
}

function snapToRow(value) {
    return Math.round(value / rowHeight) * rowHeight;
}

function render() {
    timeline.innerHTML = '<div class="timeline-grid"></div>';
    drawResourceRows();
    projectData.forEach(epic => timeline.appendChild(createEpicElement(epic)));
    drawSprintGrid();
}

function drawResourceRows() {
    const timelineWidth = 26 * sprintWidth; // Set the timeline length to 26 sprints
    for (let i = 0; i < 50; i++) { // Set the total number of resource rows to 50
        const row = document.createElement('div');
        row.className = 'resource-row';
        row.style.top = `${i * rowHeight}px`;
        row.style.width = `${timelineWidth}px`; // Set the width to match the total width of the timeline
        if (i === highlightRow - 1) {
            row.classList.add('highlight');
            const resourceLine = document.createElement('div');
            resourceLine.className = 'resource-line';
            row.appendChild(resourceLine);
        }
        timeline.appendChild(row);
    }
}

function createEpicElement(epic) {
    const epicEl = document.createElement('div');
    epicEl.className = 'epic';
    epicEl.style.backgroundColor = epic.color;
    epicEl.style.top = `${epic.top}px`;
    epicEl.style.left = `${epic.left}px`;
    epicEl.style.width = `${epic.width * sprintWidth}px`; // Convert width from sprints to pixels
    epicEl.style.height = `${epic.resourceCount * rowHeight}px`;

    epicEl.innerHTML = `
        <div style="cursor: text; font-weight: bold;" onclick="startEditingEpicName(${epic.id})">${epic.name}</div>
        <div class="resize-handle"></div>
        <div class="resize-handle-vertical"></div>
        <div class="epic-label"><i class="fas fa-clock"></i> ${epic.width}</div>
        <div class="epic-resource-label"><i class="fas fa-users"></i> ${epic.resourceCount}</div>
        <div class="delete-epic" onclick="deleteEpic(${epic.id})"><i class="fas fa-trash-alt"></i></div>
    `;
    makeDraggable(epicEl, epic);
    return epicEl;
}

function deleteEpic(epicId) {
    projectData = projectData.filter(epic => epic.id !== epicId);
    saveAndRender();
}

function startEditingEpicName(epicId) {
    const epic = projectData.find(e => e.id === epicId);
    const newName = prompt("Edit Epic Name:", epic.name);
    if (newName !== null) {
        epic.name = newName.trim();
        saveAndRender();
    }
}

function makeDraggable(element, epic) {
    element.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle')) startResizing(e, epic);
        else if (e.target.classList.contains('resize-handle-vertical')) startVerticalResizing(e, epic);
        else startDragging(e, epic);
    });
}

function startDragging(e, epic) {
    e.preventDefault(); // Prevent text selection
    const offsetX = e.clientX - e.target.getBoundingClientRect().left;
    const offsetY = e.clientY - e.target.getBoundingClientRect().top;

    document.onmousemove = (e) => {
        let newLeft = snapToGrid(e.clientX - offsetX - timeline.getBoundingClientRect().left);
        let newTop = snapToRow(e.clientY - offsetY - timeline.getBoundingClientRect().top);

        // Prevent dragging beyond the left bound
        if (newLeft < 0) newLeft = 0;

        // Prevent dragging beyond the top bound
        if (newTop < 0) newTop = 0;

        if (!checkOverlap(epic, newLeft, newTop, epic.width * sprintWidth, epic.resourceCount * rowHeight)) {
            epic.left = newLeft;
            epic.top = newTop;
            saveAndRender();
        }
    };
    document.onmouseup = () => document.onmousemove = null;
}

function startResizing(e, epic) {
    const startX = e.clientX;
    const initialWidth = epic.width * sprintWidth;
    const initialHeight = epic.resourceCount * rowHeight;

    document.onmousemove = (e) => {
        const newWidth = snapToGrid(Math.max(sprintWidth, initialWidth + (e.clientX - startX)));
        const newEpicWidth = Math.round(newWidth / sprintWidth); // Store width in whole sprints

        if (isLockAreaEnabled) {
            const totalCells = (initialHeight / rowHeight) * (initialWidth / sprintWidth);
            const newResourceCount = Math.round(totalCells / newEpicWidth); // Adjust resource count to whole numbers

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

let isLockAreaEnabled = JSON.parse(localStorage.getItem('isLockAreaEnabled')) || false;

function toggleLockArea() {
    isLockAreaEnabled = !isLockAreaEnabled;
    localStorage.setItem('isLockAreaEnabled', JSON.stringify(isLockAreaEnabled));
    updateLockAreaToggle();
}

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

// Call updateLockAreaToggle on page load to set the initial state
updateLockAreaToggle();

function startVerticalResizing(e, epic) {
    const startY = e.clientY;
    const initialHeight = epic.resourceCount * rowHeight;
    const initialWidth = epic.width * sprintWidth;

    document.onmousemove = (e) => {
        const newHeight = snapToRow(Math.max(rowHeight, initialHeight + (e.clientY - startY)));
        const newResourceCount = Math.round(newHeight / rowHeight); // Store resource count in whole numbers

        if (isLockAreaEnabled) {
            const totalCells = (initialHeight / rowHeight) * (initialWidth / sprintWidth);
            const newEpicWidth = Math.round(totalCells / newResourceCount); // Adjust width to whole sprints

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

function drawSprintGrid() {
    const grid = document.querySelector('.timeline-grid');
    grid.innerHTML = '';
    const gridWidth = 26 * sprintWidth; // Set the timeline length to 26 sprints
    const gridHeight = 50 * rowHeight;  // Set the grid height to match 50 resources

    for (let x = 0; x < gridWidth; x += sprintWidth) {
        if (x > 0 && (x / sprintWidth) % 6 === 0) {
            const border = document.createElement('div');
            border.className = 'sprint-border';
            border.style.left = `${x}px`;
            border.style.height = `${gridHeight}px`;  // Make the border span full height
            grid.appendChild(border);
        }
    }
}

// Load the saved title from local storage
const savedTitle = localStorage.getItem('pageTitle');
const pageTitleElement = document.getElementById('page-title');
if (savedTitle && savedTitle !== "My Project") {
    pageTitleElement.innerText = savedTitle;
    pageTitleElement.style.color = ''; // Reset to default color
} else {
    pageTitleElement.innerText = "My Project";
    pageTitleElement.style.color = '#B0B0B0'; // Light gray color for default text
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
        pageTitleElement.style.color = ''; // Reset to default color
    } else {
        pageTitleElement.innerText = "My Project";
        pageTitleElement.style.color = '#B0B0B0'; // Light gray color for default text
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
            // Update the project title
            const pageTitleElement = document.getElementById('page-title');
            const savedTitle = localStorage.getItem('pageTitle');
            if (savedTitle && savedTitle !== "My Project") {
                pageTitleElement.innerText = savedTitle;
                pageTitleElement.style.color = ''; // Reset to default color
            } else {
                pageTitleElement.innerText = "My Project";
                pageTitleElement.style.color = '#B0B0B0'; // Light gray color for default text
            }
            // Update the effort toggle
            isLockAreaEnabled = JSON.parse(localStorage.getItem('isLockAreaEnabled')) || false;
            updateLockAreaToggle();
        };
        reader.readAsText(file);
    }
}

saveAndRender();