import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

interface Scaffolds {
  [key: string]: string;
}

const defaultScaffolds = {
  createVite: "npx create-vite template && mv ./template/* .",
  createElectronVite: "npx create-electron-vite template && mv ./template/* .",
  createReactApp: "npx create-react-app template && mv ./template/* .",
  createNextApp: "npx create-next-app@latest template && mv ./template/* .",
  createViteExtra: "npx create-vite-extra template && mv ./template/* .",
  cargoInit: "cargo new template && mv ./template/* .",
  createCrx: "npx create-crx-app template && mv ./template/* .",
  createAstro: "npx create-astro template && mv ./template/* .",
};

export function scaffoldsProcesser(scaffolds: Scaffolds) {
  const plateform = process.platform;
  if (plateform === "win32") {
    return Object.fromEntries(
      Object.entries(scaffolds).map(([key, value]) => [
        key,
        value.replace(/\//g, "\\"),
      ])
    );
  } else {
    return scaffolds;
  }
}

export function getDefaultScaffolds() {
  let scaffolds = vscode.workspace
    .getConfiguration("ProjectManager")
    .get<Scaffolds>("scaffolds");
  if (!scaffolds || Object.keys(scaffolds).length === 0) {
    return scaffoldsProcesser(defaultScaffolds);
  } else {
    return scaffoldsProcesser(scaffolds);
  }
}

export function getProjectRootDir() {
  const rootDir = vscode.workspace
    .getConfiguration("ProjectManager")
    .get<string>("root");
  if (rootDir) {
    if (!fs.existsSync(rootDir)) {
      makeDir(rootDir);
    }
  }
  return rootDir;
}

export async function getProjectCategories() {
  const rootDir = getProjectRootDir();
  if (rootDir) {
    const categories = await getSubDirs(rootDir);
    if (categories && categories?.length > 0) {
      return categories.join(",");
    } else {
      let categories = vscode.workspace
        .getConfiguration("ProjectManager")
        .get<string>("category");
      if (categories && categories.length > 0) {
        return categories;
      } else {
        return "CodeExtensions,Vue,React,Node,Python,Rust,Go,Temp";
      }
    }
  } else {
    return "CodeExtensions,Vue,React,Node,Python,Rust,Go,Temp";
  }
}

export function isDirectory(path: string) {
  try {
    const stat = fs.statSync(path);
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
}

export async function getAvailableList() {
  const rootDir = getProjectRootDir();
  let availableList: string[] = [];
  if (rootDir) {
    const categoryDirs = await getSubDirs(rootDir);

    if (categoryDirs && categoryDirs.length > 0) {
      for (const categoryDir of categoryDirs) {
        const categoryFullPath = path.join(rootDir, categoryDir);
        const projectDirs = await getSubDirs(categoryFullPath);
        if (projectDirs && projectDirs.length > 0) {
          availableList.push(categoryDir);
        }
      }
    }
  } else {
    vscode.window.showInformationMessage(
      "Please set root directory in settings.json"
    );
  }
  return availableList;
}

export async function getAvailableProjects() {
  let availableProjects: string[] = [];
  const rootDir = getProjectRootDir();
  if (rootDir) {
    const categories = await getAvailableList();

    if (categories && categories.length > 0) {
      for (const category of categories) {
        const categoryFullPath = path.join(rootDir, category);
        const projectDirs = await getSubDirs(categoryFullPath);
        if (projectDirs && projectDirs.length > 0) {
          const projectFullPath = projectDirs.map((projects) => {
            return path.join(categoryFullPath, projects);
          });
          availableProjects.push(...projectFullPath);
        }
      }
    }
  } else {
    vscode.window.showInformationMessage(
      "Please set root directory in settings.json"
    );
  }
  return availableProjects;
}

export async function openProject(path: string) {
  const uri = vscode.Uri.file(path);
  const result = await vscode.window.showInformationMessage(
    "Which window you want to open this project?",
    { modal: true },
    "current",
    "new"
  );

  if (result === "new") {
    vscode.commands.executeCommand("vscode.openFolder", uri, true);
  } else if (result === "current") {
    vscode.commands.executeCommand("vscode.openFolder", uri, false);
  }
}

export async function makeDir(path: string) {
  if (fs.existsSync(path)) {
    vscode.window.showInformationMessage(`The Project Name is exists.`);
    return true;
  } else {
    const uri = vscode.Uri.file(path);
    vscode.workspace.fs.createDirectory(uri);
    return false;
  }
}

export async function getSubDirs(path: string) {
  if (!fs.existsSync(path)) {
    return;
  } else {
    const uri = vscode.Uri.file(path);
    const entries = await vscode.workspace.fs.readDirectory(uri);
    const projectDirs = [];
    for (const [name, type] of entries) {
      if (type === vscode.FileType.Directory) {
        projectDirs.push(name);
      }
    }
    return projectDirs;
  }
}

export async function deleteFile(uri: vscode.Uri) {
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

export async function deleteProject(path: string | string[]) {
  const uris = Array.isArray(path)
    ? path.map((p) => vscode.Uri.file(p))
    : [vscode.Uri.file(path)];

  await Promise.all(uris.map(deleteFile));

  await vscode.commands.executeCommand(
    `workbench.files.action.refreshFilesExplorer`
  );
  await vscode.commands.executeCommand(
    "workbench.files.action.closeAllEditors"
  );
  await vscode.window.showInformationMessage("Delete Completed!");
}

export async function executeCommandInTerminal(command: string) {
  const terminals = vscode.window.terminals;
  let terminal: vscode.Terminal | undefined;
  if (terminals.length === 0) {
    terminal = vscode.window.createTerminal();
  } else {
    const items = terminals
      .filter((t) => t.processId === undefined)
      .map((t) => ({
        label: t.name,
        terminal: t,
      }));
    if (items.length > 0) {
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "choose a terminal to excute command...",
      });
      if (selected) {
        terminal = selected.terminal;
      }
    } else {
      terminal = vscode.window.createTerminal();
    }
  }
  if (terminal) {
    terminal.show();
    terminal.sendText(command);
  }
}
