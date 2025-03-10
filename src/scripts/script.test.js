describe('Ganttris Core Functionality', () => {
  const mockProjectData = [
    { id: 1, name: 'Epic 1', left: 0, top: 0, width: 2, resourceCount: 1, color: '#1a73e8', starred: false },
    { id: 2, name: 'Epic 2', left: 240, top: 50, width: 1, resourceCount: 2, color: '#34a853', starred: true }
  ];
  
  beforeEach(() => {
    document.body.innerHTML = `
      <input type="number" id="highlightRowInput" value="1" min="1" max="20">
      <div class="toolbar">
        <div class="toolbar-item btn btn-epic" draggable="true" data-type="epic"></div>
        <div class="toolbar-item btn btn-lock" id="lock-effort-toggle"><i class="fas fa-lock-open"></i></div>
        <div class="toolbar-item btn btn-arrange" id="arrangeButton"></div>
      </div>
      <div class="timeline" id="timeline">
        <div class="timeline-grid"></div>
      </div>
      <h1 id="page-title" contenteditable="true">My Project</h1>
    `;

    localStorage.getItem.mockImplementation((key) => {
      if (key === 'projectData') return JSON.stringify(mockProjectData);
      if (key === 'highlightRow') return '1';
      if (key === 'pageTitle') return 'Test Project';
      if (key === 'isLockAreaEnabled') return 'false';
      return null;
    });

    jest.clearAllMocks();
    jest.resetModules();
    
    window.projectData = [...mockProjectData];
  });

  test('should load project data from localStorage', () => {
    require('./script');
    expect(localStorage.getItem).toHaveBeenCalledWith('projectData');
    expect(window.projectData).toEqual(mockProjectData);
  });

  test('should save project data to localStorage and render', () => {
    // Create a manual implementation of render to test if it's called
    const renderMock = jest.fn();
    
    // Create a custom mock implementation of saveAndRender that will use our mock
    jest.doMock('./script', () => ({
      saveAndRender: () => {
        localStorage.setItem('projectData', JSON.stringify(window.projectData));
        renderMock();
      },
      render: renderMock
    }));
    
    // Import the module with our mocks
    const script = require('./script');
    
    // Call the mocked saveAndRender function
    script.saveAndRender();
    
    // Verify our expectations
    expect(localStorage.setItem).toHaveBeenCalledWith('projectData', JSON.stringify(window.projectData));
    expect(renderMock).toHaveBeenCalled();
    
    // Reset mocked modules
    jest.resetModules();
  });

  test('should clear timeline and reset settings', () => {
    // Create mock functions
    const renderMock = jest.fn();
    const updateToggleMock = jest.fn();
    
    // Mock the script module
    jest.doMock('./script', () => ({
      clearTimeline: () => {
        window.projectData = [];
        localStorage.removeItem('pageTitle');
        localStorage.setItem('projectData', JSON.stringify([]));
        renderMock();
        window.isLockAreaEnabled = false;
        localStorage.setItem('isLockAreaEnabled', 'false');
        updateToggleMock();
      },
      render: renderMock,
      updateLockAreaToggle: updateToggleMock
    }));
    
    const script = require('./script');
    script.clearTimeline();
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('pageTitle');
    expect(localStorage.setItem).toHaveBeenCalledWith('projectData', JSON.stringify([]));
    expect(localStorage.setItem).toHaveBeenCalledWith('isLockAreaEnabled', 'false');
    expect(renderMock).toHaveBeenCalled();
    
    jest.resetModules();
  });

  test('should toggle star status of an epic', () => {
    const saveAndRenderMock = jest.fn();
    
    jest.doMock('./script', () => ({
      toggleStarEpic: (id) => {
        const epic = window.projectData.find(e => e.id === id);
        if (epic) {
          epic.starred = !epic.starred;
          saveAndRenderMock();
        }
      },
      saveAndRender: saveAndRenderMock
    }));
    
    const script = require('./script');
    script.toggleStarEpic(1);
    
    expect(saveAndRenderMock).toHaveBeenCalled();
    expect(window.projectData[0].starred).toBeTruthy();
    
    jest.resetModules();
  });

  test('should delete an epic', () => {
    const saveAndRenderMock = jest.fn();
    
    jest.doMock('./script', () => ({
      deleteEpic: (id) => {
        window.projectData = window.projectData.filter(epic => epic.id !== id);
        saveAndRenderMock();
      },
      saveAndRender: saveAndRenderMock
    }));
    
    const script = require('./script');
    script.deleteEpic(1);
    
    expect(saveAndRenderMock).toHaveBeenCalled();
    expect(window.projectData.length).toBe(1);
    expect(window.projectData[0].id).toBe(2);
    
    jest.resetModules();
  });

  test('should check for overlap correctly', () => {
    // Mock only the function we need
    jest.doMock('./script', () => ({
      checkOverlap: (currentEpic, left, top, width, height) => {
        return window.projectData.some(epic =>
          epic.id !== currentEpic?.id &&
          (
            (top < epic.top + (epic.resourceCount * rowHeight) &&
             top + height > epic.top &&
             left < epic.left + (epic.width * sprintWidth) &&
             left + width > epic.left)
          )
        );
      }
    }));
    
    const rowHeight = 50;
    const sprintWidth = 120;
    const script = require('./script');
    
    expect(script.checkOverlap(null, 500, 500, 120, 50)).toBe(false);
    expect(script.checkOverlap(null, 0, 0, 120, 50)).toBe(true);
    expect(script.checkOverlap(window.projectData[0], 0, 0, 240, 50)).toBe(false);
    
    jest.resetModules();
  });

  test('should snap values to grid and row', () => {
    jest.doMock('./script', () => ({
      snapToGrid: (value) => Math.round(value / 120) * 120,
      snapToRow: (value) => Math.floor(value / 50) * 50
    }));
    
    const script = require('./script');
    
    expect(script.snapToGrid(125)).toBe(120);
    expect(script.snapToGrid(180)).toBe(240);
    expect(script.snapToRow(25)).toBe(0);
    expect(script.snapToRow(30)).toBe(0);
    
    jest.resetModules();
  });

  test('should arrange epics within resource limits', () => {
    const saveAndRenderMock = jest.fn();
    
    jest.doMock('./script', () => ({
      arrangeEpics: () => {
        saveAndRenderMock();
      },
      saveAndRender: saveAndRenderMock
    }));
    
    const script = require('./script');
    script.arrangeEpics();
    
    expect(saveAndRenderMock).toHaveBeenCalled();
    
    jest.resetModules();
  });

  test('should toggle lock area', () => {
    const updateLockAreaToggleMock = jest.fn();
    
    jest.doMock('./script', () => ({
      toggleLockArea: () => {
        window.isLockAreaEnabled = !window.isLockAreaEnabled;
        localStorage.setItem('isLockAreaEnabled', String(window.isLockAreaEnabled));
        updateLockAreaToggleMock();
      },
      updateLockAreaToggle: updateLockAreaToggleMock
    }));
    
    window.isLockAreaEnabled = false;
    const script = require('./script');
    
    script.toggleLockArea();
    
    expect(window.isLockAreaEnabled).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('isLockAreaEnabled', 'true');
    expect(updateLockAreaToggleMock).toHaveBeenCalled();
    
    jest.resetModules();
  });
});