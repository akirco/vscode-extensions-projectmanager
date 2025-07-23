# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.6] - 2025-07-23

### Changed
- Refactored the internal project structure for better maintainability.
- Updated project dependencies to their latest versions.
- Replaced string-based `category` configuration with an array for improved flexibility.

### Added
- Configuration option `ProjectManager.cleanerPatterns` to customize which dependency folders are removed.
- Display for currently opened projects.

## [0.1.5]

### Changed
- Reworked the logic for project creation.
- Improved the command execution process in the terminal.

### Added
- **New Command**: `pm.cloneRepository` to clone a remote repository.
- **New Command**: `pm.openWorkspace` to create and open a VS Code Workspace from multiple projects.
- **New Command**: `pm.deleteDependencies` to clean dependency folders like `node_modules` and `target`.

## [0.1.3]

### Added
- Added support for Linux-based operating systems.

## [0.1.1]

### Added
- **New Command**: `pm.quickOpenProject` for faster access to projects.

### Fixed
- Resolved an issue where commands would not execute correctly in the integrated terminal.

## [0.1.0]

### Changed
- Optimized the performance of opening and deleting projects.
- Converted project scaffolds to be user-configurable via settings.

## [0.0.1]

### Added
- Initial release of the Project Manager extension.
- Core features: Create, open, and delete projects.