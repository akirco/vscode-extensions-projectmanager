# AI Agent Instructions for VS Code Project Manager Extension

This document guides AI agents in understanding and contributing to the Project Manager VS Code extension.

## Project Overview

This extension helps manage local project files by:

- Organizing projects into configurable categories (Vue, React, Python, etc.)
- Providing commands for creating, opening, and deleting projects
- Managing workspaces and project dependencies
- Supporting git repository cloning

## Architecture & Core Components

### Key Files

- `src/extension.ts` - Entry point, registers commands and handles activation
- `src/libs/projectManager.ts` - Core project management logic
- `src/libs/commands.ts` - Command implementations
- `src/libs/stateManager.ts` - Manages extension state
- `src/ui.ts` - UI utility functions for QuickPick and notifications

### Important Patterns

1. Configuration is managed through VS Code settings:

   ```typescript
   const config = vscode.workspace.getConfiguration("ProjectManager");
   ```

2. Project structure follows a category-based hierarchy:

   ```
   RootFolder/
     ├── vue/
     ├── react/
     └── workspaces/ (default)
   ```

3. Commands are registered via the `commands` array in `src/libs/commands.ts`

## Development Workflow

### Build & Watch

- Run `npm run watch` for development
- Run `npm run watch-tests` for test development

### Project Setup

1. Install dependencies: `npm install`
2. Compile: `npm run compile`
3. Package: `vsce package`

## Extension Settings

Key configuration properties (`package.json`):

- `ProjectManager.root` - Root directory for projects
- `ProjectManager.category` - Configurable project categories
- `ProjectManager.scaffolds` - Project templates/scaffolds
- `ProjectManager.cleanerPatterns` - Patterns for dependency cleanup

## Common Tasks & Patterns

### Adding New Commands

1. Define command in `package.json` under `contributes.commands`
2. Implement handler in `src/libs/commands.ts`
3. Add UI elements if needed in `src/ui.ts`

### Project Operations

- Use `getProjectRootDir()` to access the configured project root
- Validate paths with `fs.existsSync()` before operations
- Handle errors using `showErrorMessage()` from `ui.ts`

## Testing

Test files are located in `src/test/suite/`. Follow existing patterns in `extension.test.ts` for new tests.

## Important Note

When modifying project structure or adding features, ensure changes are reflected in both the command registration (`package.json`) and implementation (`src/libs/commands.ts`).
