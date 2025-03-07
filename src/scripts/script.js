// inject:hostname-check

let projectData = JSON.parse(localStorage.getItem('projectData')) || [];
const rowHeight = 50;
const sprintWidth = 60;
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

        projectData.push({ id: Date.now(), name: 'New Epic', left, top, width: sprintWidth * 3, resourceCount : 1, color });
        saveAndRender();
    }
});

function saveAndRender() {
    localStorage.setItem('projectData', JSON.stringify(projectData));
    render();
}

function clearTimeline() {
    projectData = [];
    saveAndRender();
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
    for (let i = 0; i < 20; i++) {
        const row = document.createElement('div');
        row.className = 'resource-row';
        row.style.top = `${i * rowHeight}px`;
        if (i === highlightRow - 1) row.classList.add('highlight');
        timeline.appendChild(row);
    }
}

function createEpicElement(epic) {
    const epicEl = document.createElement('div');
    epicEl.className = 'epic';
    epicEl.style.backgroundColor = epic.color;
    epicEl.style.top = `${epic.top}px`;
    epicEl.style.left = `${epic.left}px`;
    epicEl.style.width = `${epic.width}px`;
    epicEl.style.height = `${epic.resourceCount * rowHeight}px`;

    epicEl.innerHTML = `
        <div style="cursor: text; font-weight: bold;" onclick="startEditingEpicName(${epic.id})">${epic.name}</div>
        <div class="resize-handle"></div>
        <div class="resize-handle-vertical"></div>
        <div style="position:absolute;bottom:2px;right:4px;background:#444;color:#ffffff;padding:2px 4px;border-radius:3px;font-size:12px;">${epic.width / sprintWidth} Sprints</div>
        <div style="position:absolute;bottom:2px;left:4px;background:#444;color:#ffffff;padding:2px 4px;border-radius:3px;font-size:12px;">${epic.resourceCount} Res</div>
    `;
    makeDraggable(epicEl, epic);
    return epicEl;
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
    const offsetX = e.clientX - e.target.getBoundingClientRect().left;
    const offsetY = e.clientY - e.target.getBoundingClientRect().top;

    document.onmousemove = (e) => {
        const newLeft = snapToGrid(e.clientX - offsetX - timeline.getBoundingClientRect().left);
        const newTop = snapToRow(e.clientY - offsetY - timeline.getBoundingClientRect().top);

        if (!checkOverlap(epic, newLeft, newTop, epic.width, epic.resourceCount)) {
            epic.left = newLeft;
            epic.top = newTop;
            saveAndRender();
        }
    };
    document.onmouseup = () => document.onmousemove = null;
}

function startResizing(e, epic) {
    const startX = e.clientX;
    const initialWidth = epic.width;

    document.onmousemove = (e) => {
        const newWidth = snapToGrid(Math.max(sprintWidth, initialWidth + (e.clientX - startX)));

        if (!checkOverlap(epic, epic.left, epic.top, newWidth, epic.resourceCount)) {
            epic.width = newWidth;
            saveAndRender();
        }
    };

    document.onmouseup = () => document.onmousemove = null;
    e.stopPropagation();
}

function startVerticalResizing(e, epic) {
    const startY = e.clientY;
    const initialHeight = epic.resourceCount * rowHeight;

    document.onmousemove = (e) => {
        const newHeight = Math.max(rowHeight, initialHeight + (e.clientY - startY));
        epic.resourceCount = Math.round(newHeight / rowHeight);
        saveAndRender();
    };

    document.onmouseup = () => document.onmousemove = null;
    e.stopPropagation();
}

function checkOverlap(currentEpic, left, top, width = currentEpic?.width, resourceCount = currentEpic?.resourceCount) {
    return projectData.some(epic =>
        epic.id !== currentEpic?.id &&
        (
            (epic.top === top && epic.left < left + width && epic.left + epic.width > left) || 
            (top < epic.top + (epic.resourceCount * rowHeight) &&
             top + (resourceCount * rowHeight) > epic.top &&
             epic.left < left + width &&
             epic.left + epic.width > left)
        )
    );
}

function drawSprintGrid() {
    const grid = document.querySelector('.timeline-grid');
    grid.innerHTML = '';
    const gridWidth = timeline.scrollWidth;
    const gridHeight = timeline.scrollHeight;  // Ensure it spans the full height including scroll area

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
if (savedTitle) {
    document.getElementById('page-title').innerText = savedTitle;
}

// Save the title to local storage when it is edited
document.getElementById('page-title').addEventListener('input', (e) => {
    localStorage.setItem('pageTitle', e.target.innerText);
});

saveAndRender();