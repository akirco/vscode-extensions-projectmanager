[English](README.md)

# Project Manager (pm)

一个简单高效的方式，在 VS Code 中直接管理您的本地项目文件。

## 功能特性

- **项目管理**:
  - 使用可自定义的脚手架创建新项目。
  - 在当前窗口或新窗口中打开现有项目。
  - 删除项目（默认移动到回收站）。
  - 从所有可用项目或最近打开的项目列表中快速打开项目。
- **工作区管理**:
  - 创建并打开多项目工作区。
  - 快速打开现有的工作区。
  - 关闭当前工作区或文件夹。
- **依赖管理**:
  - 基于可配置的 glob 模式（例如 `node_modules`、`target`）清理项目依赖。
- **Git 集成**:
  - 将远程仓库直接克隆到您的项目结构中。

##快速入门

1.  **安装扩展**：在 VS Code 扩展视图中搜索 “pm”，然后点击 **安装**。
2.  **配置根目录**：打开您的 `settings.json` 文件，并将 `ProjectManager.root` 属性设置为您项目根文件夹的绝对路径。

    ```json
    {
      "ProjectManager.root": "/path/to/your/projects"
    }
    ```

## 使用方法

打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`），然后输入 `pm` 以查看所有可用命令。

### 可用命令

- `pm: New Project`: 在选定的类别中创建一个新项目。
- `pm: Open Project`: 打开一个现有项目。
- `pm: Delete Project`: 删除一个或多个项目。
- `pm: Quick Opening Project`: 从最近和所有项目的列表中快速打开一个项目。
- `pm: Clone Remote Repository`: 将一个 Git 仓库克隆到选定的类别中。
- `pm: Delete Project Dependencies`: 从选定的项目中删除依赖文件夹（例如 `node_modules`）。
- `pm: Create And Open Workspace`: 使用选定的项目创建一个新的工作区。
- `pm: Quick Open Workspace`: 快速打开一个现有的工作区。
- `pm: Close Workspace Or Folder`: 关闭当前打开的工作区或文件夹。

## 配置

您可以通过修改 `settings.json` 文件中的以下设置来自定义扩展的行为：

- **`ProjectManager.root`** (必需):
  - 存储项目的根文件夹的绝对路径。
  - 示例: `"/home/user/projects"` 或 `"D:\Projects"`

- **`ProjectManager.category`**:
  - 一个字符串数组，代表您的项目类别。这些类别将用于在子目录中组织您的项目。
  - 默认值: `[]`
  - 示例: `["Vue", "React", "Node", "Python"]`

- **`ProjectManager.scaffolds`**:
  - 一个对象，其中键是脚手架名称，值是用于创建新项目的命令。
  - 默认值: `{}`
  - 示例:
    ```json
    {
      "create-vite": "npx create-vite .",
      "create-next-app": "npx create-next-app@latest ."
    }
    ```

- **`ProjectManager.cleanerPatterns`**:
  - 一个 glob 模式数组，用于“删除项目依赖”命令删除的文件夹。
  - 默认值: `["**/node_modules", "**/target", "**/.venv"]`

## 配置示例

```json
{
  "window.dialogStyle": "custom", // 推荐设置为 custom 以获得更好的用户体验
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

## 贡献

欢迎贡献！请随时在 [GitHub](https://github.com/akirco/vscode-extensions-projectmanager.git) 上提出问题或提交拉取请求。

**Enjoy!**
