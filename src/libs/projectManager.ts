import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

interface Scaffolds {
  [key: string]: string;
}

const defaultScaffolds: Scaffolds = {
  createVite: "npx create-vite template && mv ./template/* .",
  createElectronVite: "npx create-electron-vite template && mv ./template/* .",
  createReactApp: "npx create-react-app template && mv ./template/* .",
  createNextApp: "npx create-next-app@latest template && mv ./template/* .",
  createViteExtra: "npx create-vite-extra template && mv ./template/* .",
  cargoInit: "cargo new template && mv ./template/* .",
  createCrx: "npx create-crx-app template && mv ./template/* .",
  createAstro: "npx create-astro template && mv ./template/* .",
};

function adjustPathForPlatform(scaffolds: Scaffolds): Scaffolds {
  const isWindows = process.platform === "win32";
  return Object.fromEntries(
    Object.entries(scaffolds).map(([key, value]) => [
      key,
      isWindows ? value.replace(/\//g, "\\") : value,
    ])
  );
}

export function getDefaultScaffolds(): Scaffolds {
  const scaffolds = vscode.workspace
    .getConfiguration("ProjectManager")
    .get<Scaffolds>("scaffolds");
  if (!scaffolds || Object.keys(scaffolds).length === 0) {
    return adjustPathForPlatform(defaultScaffolds);
  }

  return adjustPathForPlatform(scaffolds);
}

export function getProjectRootDir(): string | undefined {
  const rootDir = vscode.workspace
    .getConfiguration("ProjectManager")
    .get<string>("root");
  if (rootDir && !fs.existsSync(rootDir)) {
    makeDir(rootDir);
  }
  return rootDir;
}

export async function getProjectCategories(): Promise<string> {
  const rootDir = getProjectRootDir();
  if (rootDir) {
    const categories = await getSubDirs(rootDir);
    if (categories?.length) {
      return categories.join(",");
    }
  }
  return (
    vscode.workspace
      .getConfiguration("ProjectManager")
      .get<string>("category") ||
    "CodeExtensions,Vue,React,Node,Python,Rust,Go,Temp"
  );
}

export async function getSubDirs(dirPath: string): Promise<string[]> {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const uri = vscode.Uri.file(dirPath);
  const entries = await vscode.workspace.fs.readDirectory(uri);
  return entries
    .filter(([_, type]) => type === vscode.FileType.Directory)
    .map(([name]) => name);
}

export async function getAvailableList(): Promise<string[]> {
  const rootDir = getProjectRootDir();
  if (!rootDir) {
    vscode.window.showInformationMessage(
      "Please set root directory in settings.json"
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
    vscode.window.showInformationMessage(
      "Please set root directory in settings.json"
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

export async function openProject(projectPath: string): Promise<void> {
  const uri = vscode.Uri.file(projectPath);
  const result = await vscode.window.showInformationMessage(
    "Which window you want to open this project?",
    { modal: true },
    "current",
    "new"
  );
  if (result) {
    vscode.commands.executeCommand("vscode.openFolder", uri, result === "new");
  }
}

export async function makeDir(dirPath: string): Promise<boolean> {
  if (fs.existsSync(dirPath)) {
    vscode.window.showInformationMessage(`The Project Name already exists.`);
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
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Deleting ${uri.fsPath}`,
      cancellable: false,
    },
    async (process) => {
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
    }
  );
}

export async function deleteProject(paths: string | string[]): Promise<void> {
  const uris = Array.isArray(paths)
    ? paths.map((p) => vscode.Uri.file(p))
    : [vscode.Uri.file(paths)];
  await Promise.all(uris.map(deleteFile));
  await vscode.commands.executeCommand(
    "workbench.files.action.refreshFilesExplorer"
  );
  await vscode.commands.executeCommand(
    "workbench.files.action.closeAllEditors"
  );
  await vscode.window.showInformationMessage("Delete Completed!");
}

export async function executeCommandInTerminal(command: string): Promise<void> {
  let terminal = vscode.window.terminals.find((t) => t.processId === undefined);
  if (!terminal) {
    terminal = vscode.window.createTerminal();
  }
  terminal.show();
  terminal.sendText(command);
}
