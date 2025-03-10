// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true
});

// Mock alert
window.alert = jest.fn();

// Create a mock for document elements we need
document.body.innerHTML = `
<input type="number" id="highlightRowInput" value="1" min="1" max="20">
<div class="toolbar">
  <div class="toolbar-item btn btn-epic" draggable="true" data-type="epic"></div>
  <div class="toolbar-item btn btn-lock" id="lock-effort-toggle"></div>
  <div class="toolbar-item btn btn-arrange" id="arrangeButton"></div>
</div>
<div class="timeline" id="timeline">
  <div class="timeline-grid"></div>
</div>
<h1 id="page-title" contenteditable="true">My Project</h1>
`;

// Create a mock for other DOM APIs
global.DOMRect = class DOMRect {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.top = y;
    this.right = x + width;
    this.bottom = y + height;
    this.left = x;
  }
};

Element.prototype.getBoundingClientRect = function() {
  return new DOMRect(0, 0, 100, 50);
};

// Mock drag and drop events
class DataTransfer {
  constructor() {
    this.data = {};
  }

  setData(format, data) {
    this.data[format] = data;
  }

  getData(format) {
    return this.data[format] || '';
  }

  setDragImage() {}
}

class DragEvent extends Event {
  constructor(type, options) {
    super(type, options);
    this.dataTransfer = new DataTransfer();
    this.clientX = options?.clientX || 0;
    this.clientY = options?.clientY || 0;
  }
}

window.DataTransfer = DataTransfer;
window.DragEvent = DragEvent;

// Ensure global objects are available
if (!global.window) global.window = window;
if (!global.document) global.document = document;
