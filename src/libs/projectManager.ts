import * as glob from "fast-glob";
import * as fs from "fs";
import getFolderSize from "get-folder-size";
import * as path from "path";
import * as vscode from "vscode";
import { ProjectConfig, Scaffolds } from "../types";
import {
  showErrorMessage,
  showInformationMessage,
  showOpenProjectWindowQuickPick,
  showTrashDeleteConfirm,
} from "../ui";
import { addProjectToRecentlyOpened } from "./stateManager";

let configCache: ProjectConfig | null = null;

const defaultScaffolds: Scaffolds = {
  // Frontend
  createVite: "npx create-vite .",
  createViteExtra: "npx create-vite-extra .",
  createNextApp: "npx create-next-app@latest .",
  createAstro: "npx create-astro .",

  // Desktop
  createElectronVite: "npm create @quick-start/electron .",

  createTauri: "npx create-tauri-app .",

  // Browser Extension
  createWxt: "npx wxt@latest init .",

  // Backend
  createNestjs: "npx @nestjs/cli new .",

  // Other
  createTurbo: "npx create-turbo@latest .",
  cargoInit: "cargo init .",
};

const defaultCleanerPatterns = [
  "**/node_modules",
  "**/target",
  "**/.venv",
  "**/build",
];

function getConfiguration(): ProjectConfig {
  if (configCache) {
    return configCache;
  }

  const config = vscode.workspace.getConfiguration("ProjectManager");
  configCache = {
    root: config.get<string>("root") || "",
    category: config.get<string[]>("category") || [],
    scaffolds: config.get<Scaffolds>("scaffolds") || defaultScaffolds,
    cleanerPatterns:
      config.get<string[]>("cleanerPatterns") || defaultCleanerPatterns,
  };

  return configCache;
}

export function getDefaultScaffolds(): Scaffolds {
  const { scaffolds } = getConfiguration();
  return Object.keys(scaffolds).length > 0 ? scaffolds : defaultScaffolds;
}

export function getProjectRootDir(): string | undefined {
  const { root } = getConfiguration();
  if (root && !fs.existsSync(root)) {
    makeDir(root);
  }
  return root;
}

export async function getProjectCategories(): Promise<string[]> {
  const rootDir = getProjectRootDir();
  if (rootDir) {
    const categories = await getSubDirs(rootDir);
    if (categories?.length) {
      // remove workspaces from categories
      const index = categories.indexOf("workspaces");
      if (index > -1) {
        categories.splice(index, 1);
      }
      return categories;
    }
  }
  return getConfiguration().category;
}

export async function getSubDirs(
  dirPath: string,
  retries = 3
): Promise<string[]> {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const uri = vscode.Uri.file(dirPath);

  for (let i = 0; i < retries; i++) {
    try {
      const entries = await vscode.workspace.fs.readDirectory(uri);
      return entries
        .filter(([, type]) => type === vscode.FileType.Directory)
        .map(([name]) => name);
    } catch (error) {
      if (i === retries - 1) {
        showErrorMessage(`Failed to read directory: ${dirPath}`);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, i)));
    }
  }
  return [];
}

export async function getAvailableList(): Promise<string[]> {
  const rootDir = getProjectRootDir();
  if (!rootDir) {
    showInformationMessage(
      "Please set projects root directory in settings.json"
    );
    return [];
  }

  const categories = await getSubDirs(rootDir);
  const availableList: string[] = [];

  for (const category of categories) {
    const categoryPath = path.join(rootDir, category);
    const projectDirs = await getSubDirs(categoryPath);

    if (projectDirs.length > 0) {
      availableList.push(category);
    }
  }

  return availableList;
}

export async function getAvailableProjects(): Promise<string[]> {
  const rootDir = getProjectRootDir();
  if (!rootDir) {
    showInformationMessage(
      "Please set projects root directory in settings.json"
    );
    return [];
  }

  const categories = await getAvailableList();
  const projects: string[] = [];
  for (const category of categories) {
    const categoryPath = path.join(rootDir, category);
    const projectDirs = await getSubDirs(categoryPath);
    projects.push(
      ...projectDirs.map((project) => path.join(categoryPath, project))
    );
  }
  return projects;
}

// 优化项目打开逻辑
export async function openProject(projectPath: string): Promise<void> {
  const uri = vscode.Uri.file(projectPath);

  try {
    const stats = await vscode.workspace.fs.stat(uri);
    if (stats.type !== vscode.FileType.Directory) {
      throw new Error("Not a directory");
    }

    const result = await showOpenProjectWindowQuickPick();

    if (result) {
      await addProjectToRecentlyOpened(projectPath);
      await vscode.commands.executeCommand(
        "vscode.openFolder",
        uri,
        result === "New Window"
      );
    }
  } catch {
    showErrorMessage(`Failed to open project: ${projectPath}`);
  }
}

export async function makeDir(dirPath: string): Promise<boolean> {
  if (fs.existsSync(dirPath)) {
    showInformationMessage(`The Project Name already exists.`);
    return true;
  }
  const uri = vscode.Uri.file(dirPath);
  await vscode.workspace.fs.createDirectory(uri);
  return false;
}

export async function deleteFile(uri: vscode.Uri): Promise<void> {
  const document = vscode.workspace.textDocuments.find(
    (doc) => doc.uri.toString() === uri.toString()
  );
  if (document) {
    await vscode.window.showTextDocument(document);
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  }
  await withProgress(`Deleting ${uri.fsPath}`, async (process) => {
    try {
      await vscode.workspace.fs.delete(uri, {
        recursive: true,
        useTrash: true,
      });
      process.report({ message: `Deleted ${uri.fsPath}` });
    } catch (error) {
      process.report({ message: `Failed to delete ${uri.fsPath}` });
      throw error;
    }
  });
}

export async function deleteProject(paths: string | string[]): Promise<void> {
  const uris = Array.isArray(paths)
    ? paths.map((p) => vscode.Uri.file(p))
    : [vscode.Uri.file(paths)];

  await withProgress("Deleting projects", async (progress) => {
    const total = uris.length;

    for (let i = 0; i < uris.length; i++) {
      progress.report({
        message: `${i + 1}/${total}: ${path.basename(uris[i].fsPath)}`,
        increment: (1 / total) * 100,
      });
      await deleteFile(uris[i]);
    }
  });

  await vscode.commands.executeCommand(
    "workbench.files.action.refreshFilesExplorer"
  );
  await vscode.commands.executeCommand(
    "workbench.files.action.closeAllEditors"
  );
  showInformationMessage("Delete Completed!");
}

export async function executeCommandInTerminal(command: string): Promise<void> {
  let terminal = vscode.window.terminals.find((t) => t.processId === undefined);
  if (!terminal) {
    terminal = vscode.window.createTerminal({
      name: "Project Manager Terminal",
      shellPath: process.platform === "win32" ? "powershell.exe" : "bash",
      shellArgs: process.platform === "win32" ? ["-NoLogo"] : ["-l"],

      env: { TERM: "xterm-256color" },
      hideFromUser: false,
    });
  }
  terminal.show();

  return new Promise((resolve, reject) => {
    const disposable = vscode.window.onDidCloseTerminal((closedTerminal) => {
      if (closedTerminal === terminal) {
        disposable.dispose();
        if (terminal?.exitStatus?.code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Command failed with exit code ${terminal?.exitStatus?.code}`
            )
          );
        }
      }
    });

    const cmdSeparator = process.platform === "win32" ? ";" : "&&";
    terminal?.sendText(command.replace(/&&/g, cmdSeparator));
    terminal?.sendText("exit");
  });
}

export async function createWorkspace(projects: string[]): Promise<string> {
  const rootDir = getProjectRootDir();
  if (!rootDir) {
    throw new Error("Root directory not set");
  }

  const workspacesPath = path.join(rootDir, "workspaces");
  if (!fs.existsSync(workspacesPath)) {
    await makeDir(workspacesPath);
  }

  const name = projects.map((proj) => path.basename(proj)).join("-");

  const workspaceName =
    new Date().toISOString().slice(0, 10) + "-" + name + ".code-workspace";
  const workspaceFile = path.join(workspacesPath, workspaceName);

  const workspaceContent = {
    folders: projects.map((proj) => ({
      path: proj,
    })),
    settings: {},
  };

  await vscode.workspace.fs.writeFile(
    vscode.Uri.file(workspaceFile),
    Buffer.from(JSON.stringify(workspaceContent, null, 2))
  );

  return workspaceFile;
}

export async function getAvailableWorkspaces(): Promise<string[]> {
  const rootDir = getProjectRootDir();
  if (!rootDir) {
    return [];
  }

  const workspacesPath = path.join(rootDir, "workspaces");
  if (!fs.existsSync(workspacesPath)) {
    return [];
  }

  const workspaces = await vscode.workspace.fs.readDirectory(
    vscode.Uri.file(workspacesPath)
  );
  return workspaces
    .filter(
      ([name, type]) =>
        type === vscode.FileType.File && name.endsWith(".code-workspace")
    )
    .map(([name]) => path.join(workspacesPath, name));
}

// extras
export const validateProjectName =
  (rootDir: string, category: string) =>
  (value: string): string | null => {
    if (!value.trim()) {
      return "Project name is required";
    }
    const projectPath = path.join(rootDir, category, value);
    return fs.existsSync(projectPath) ? "Project already exists" : null;
  };

export async function withErrorHandling<T>(
  action: () => Promise<T>,
  errorMessage: string
): Promise<T | undefined> {
  try {
    return await action();
  } catch (error) {
    showErrorMessage(
      `${errorMessage}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return undefined;
  }
}

// 通用进度提示
export async function withProgress<T>(
  title: string,
  action: (
    progress: vscode.Progress<{ message?: string; increment?: number }>
  ) => Promise<T>
): Promise<T> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: false,
    },
    action
  );
}

export async function findDependencyDirs(
  projectPath: string
): Promise<string[]> {
  const { cleanerPatterns } = getConfiguration();
  const results = await glob(cleanerPatterns, {
    cwd: projectPath,
    absolute: true,
    onlyDirectories: true,
  });
  return results;
}

export async function hasAnyDependencies(
  projectPath: string
): Promise<boolean> {
  const { cleanerPatterns } = getConfiguration();
  const entries = await glob(cleanerPatterns, {
    cwd: projectPath,
    onlyFiles: false,
    absolute: true,
  });
  return entries.length > 0;
}

export async function getDirectorySize(dirPath: string): Promise<number> {
  try {
    const size = await getFolderSize.loose(dirPath);
    return size;
  } catch (e) {
    console.error(`Failed to get size for ${dirPath}:`, e);
    return 0;
  }
}

export async function deleteWithConfirmation(dir: string): Promise<void> {
  try {
    // 首先尝试移动到回收站
    await vscode.workspace.fs.delete(vscode.Uri.file(dir), {
      recursive: true,
      useTrash: true,
    });
  } catch {
    // 如果移动到回收站失败，询问用户是否直接删除
    const confirmed = await showTrashDeleteConfirm(dir);

    if (confirmed) {
      await vscode.workspace.fs.delete(vscode.Uri.file(dir), {
        recursive: true,
        useTrash: false,
      });
    } else {
      throw new Error(`Cancelled deletion of ${dir}`);
    }
  }
}

// 监听配置变更
vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration("ProjectManager")) {
    configCache = null;
  }
});
