# Ganttris Project

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

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ganttris
   ```

2. **Install Dependencies**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Build the Project**
   To minify and obfuscate the HTML, CSS, and JavaScript files, run:
   ```bash
   npm run build
   ```

## Usage
After building the project, the minified and obfuscated files will be available in the `dist` directory. You can deploy these files to a web server to make the application accessible.

## Deployment

To deploy the project to GitHub Pages, run the following command:

```sh
npm run deploy
```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.