# Ganttris

A simple, browser-based project management tool for planning and visualization.

## Overview
Ganttris is a project management tool that allows users to visualize and manage tasks using a Gantt chart interface. This README provides instructions for setting up the project, building the application, and using the features.

## Project Structure
```
ganttris
├── src
│   ├── index.html        # Main HTML structure of the application
│   ├── styles
│   │   └── style.css     # CSS styles for the application
│   └── scripts
│       └── script.js     # JavaScript functionality and interactivity
├── dist                   # Directory for minified and obfuscated output files
├── package.json           # npm configuration file
├── gulpfile.js           # Gulp configuration for build tasks
└── README.md              # Project documentation
```

## Development Setup

### Prerequisites

- Node.js and npm installed

### Installation

```bash
npm install
```

### Running the application

```bash
npm start
```

This will start a development server at http://localhost:8080

## Testing

### Unit Tests

Run unit tests with Jest:

```bash
npm test
```

### End-to-End Tests

Run end-to-end tests with Playwright:

```bash
npm run test:e2e
```

To run only specific browser:

```bash
npx playwright test --project=chromium
```

### Test Coverage

Generate test coverage report:

```bash
npm test -- --coverage
```

## Build for Production

```bash
npm run build
```

This will generate optimized files in the `dist` directory.

## Usage
After building the project, the minified and obfuscated files will be available in the `dist` directory. You can deploy these files to a web server to make the application accessible.

## Deployment

To deploy the project to GitHub Pages, run the following command:

```sh
npm run deploy
```

## Features

- Drag and drop epics onto the timeline
- Resize epics horizontally and vertically
- Star important epics
- Lock effort to maintain consistent workload when resizing
- Arrange epics automatically to minimize empty space
- Local storage for project data persistence
- Import and export project data

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.