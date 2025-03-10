# Entity Graph

An interactive graph visualization tool for displaying and managing hierarchical entity relationships. Built with React, TypeScript, and React Flow.

## Features

- Interactive node visualization with drag-and-drop support
- Hierarchical and circular layout options
- Search functionality with child node inclusion
- Node details on hover/click
- Smooth animations and transitions
- Responsive design

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

For Docker deployment:
- [Docker](https://www.docker.com/products/docker-desktop/)
- Docker Compose

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd graph-visualization
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Docker Deployment

### Option 1: Using Docker Compose (Recommended)

1. Build and start the container:
   ```bash
   docker compose up
   ```

2. Access the application at:
   ```
   http://localhost:3000
   ```

3. To stop the container:
   ```bash
   docker compose down
   ```

### Option 2: Using Docker Directly

1. Build the Docker image:
   ```bash
   docker build -t entity-graph .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:80 entity-graph
   ```

3. Access the application at:
   ```
   http://localhost:3000
   ```

## Usage

1. **Layout Selection**:
   - Choose between "Hierarchical Layout" and "Circular Layout" using the dropdown menu

2. **Search**:
   - Use the search bar to filter nodes by label or ID
   - Toggle "Include child nodes" to show/hide child nodes in search results

3. **Node Interaction**:
   - Click and drag nodes to reposition them
   - Click on a node to view its details
   - Hover over nodes for quick information
   - Parent node movement will also move its children

## Project Structure

```
graph-visualization/
├── src/
│   ├── components/     # React components
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   └── data/          # Graph data and configurations
├── public/           # Static assets
└── docker/           # Docker configuration files
```

## Development Commands

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build locally
- `npm run lint`: Run ESLint
- `npm run type-check`: Run TypeScript type checking

## Cleaning and Rebuilding

If you encounter any build issues or need to clean the project:

1. Clean the project:
   ```bash
   # Remove build artifacts and dependencies
   rm -rf node_modules dist .cache
   
   # Clean npm cache
   npm cache clean --force
   ```

2. Reinstall dependencies and rebuild:
   ```bash
   # Install dependencies
   npm install
   
   # Rebuild the project
   npm run build
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
