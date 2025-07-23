[简体中文](README.zh-CN.md)

# Project Manager (pm)

A simple and efficient way to manage your local project files directly within VS Code.

## Features

- **Project Management**:
  - Create new projects with customizable scaffolds.
  - Open existing projects in the current or a new window.
  - Delete projects (moves to trash by default).
  - Quickly open projects from a list of all available projects or recently opened ones.
- **Workspace Management**:
  - Create and open multi-project workspaces.
  - Quickly open existing workspaces.
  - Close the current workspace or folder.
- **Dependency Management**:
  - Clean project dependencies based on configurable glob patterns (e.g., `node_modules`, `target`).
- **Git Integration**:
  - Clone remote repositories directly into your project structure.

## Getting Started

1.  **Install the Extension**: Search for "pm" in the VS Code Extensions view and click **Install**.
2.  **Configure the Root Directory**: Open your `settings.json` file and set the `ProjectManager.root` property to the absolute path of your projects' root folder.

    ```json
    {
      "ProjectManager.root": "/path/to/your/projects"
    }
    ```

## Usage

Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and type `pm` to see all available commands.

### Available Commands

- `pm: New Project`: Creates a new project in a selected category.
- `pm: Open Project`: Opens an existing project.
- `pm: Delete Project`: Deletes one or more projects.
- `pm: Quick Opening Project`: Quickly opens a project from a list of recent and all projects.
- `pm: Clone Remote Repository`: Clones a Git repository into a selected category.
- `pm: Delete Project Dependencies`: Deletes dependency folders (e.g., `node_modules`) from selected projects.
- `pm: Create And Open Workspace`: Creates a new workspace with selected projects.
- `pm: Quick Open Workspace`: Quickly opens an existing workspace.
- `pm: Close Workspace Or Folder`: Closes the currently open workspace or folder.

## Configuration

You can customize the extension's behavior by modifying the following settings in your `settings.json` file:

- **`ProjectManager.root`** (required):
  - The absolute path to the root folder where your projects are stored.
  - Example: `"/home/user/projects"` or `"D:\\Projects"`

- **`ProjectManager.category`**:
  - An array of strings representing your project categories. These categories will be used to organize your projects in subdirectories.
  - Default: `[]`
  - Example: `["Vue", "React", "Node", "Python"]`

- **`ProjectManager.scaffolds`**:
  - An object where keys are scaffold names and values are the commands to execute for creating a new project.
  - Default: `{}`
  - Example:
    ```json
    {
      "create-vite": "npx create-vite .",
      "create-next-app": "npx create-next-app@latest ."
    }
    ```

- **`ProjectManager.cleanerPatterns`**:
  - An array of glob patterns for folders to be deleted by the 'Delete Project Dependencies' command.
  - Default: `["**/node_modules", "**/target", "**/.venv"]`

## Example Configuration

```json
{
  "window.dialogStyle": "custom", // Recommended for a better user experience
  "ProjectManager.root": "D:\\Projects",
  "ProjectManager.category": [
    "Vue",
    "React",
    "Node",
    "Python",
    "Rust",
    "Go"
  ],
  "ProjectManager.scaffolds": {
    "Vite": "npx create-vite .",
    "Next.js": "npx create-next-app@latest ."
  },
  "ProjectManager.cleanerPatterns": [
    "**/node_modules",
    "**/target",
    "**/.venv",
    "**/build"
  ]
}
```

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request on [GitHub](https://github.com/akirco/vscode-extensions-projectmanager.git).

**Enjoy!**