import * as vscode from "vscode";
import * as fs from "fs";

export function getRootFolder() {
  return vscode.workspace
    .getConfiguration("ProjectManager")
    .get<string>("root");
}

export function getProjectCategories() {
  let categories = vscode.workspace
    .getConfiguration("ProjectManager")
    .get<string>("category");
  if (categories && categories.length > 0) {
    return categories;
  } else {
    return "Vue,React,Node,Python,Rust,Go,PHP";
  }
}

// ? 打开目录
export async function openProject(p: string) {
  const uri = vscode.Uri.file(p);

  const result = await vscode.window.showInformationMessage(
    "Where do you want to open this project?",
    { modal: true },
    "current window",
    "new window"
  );

  if (result === "new window") {
    vscode.commands.executeCommand("vscode.openFolder", uri, true);
  } else if (result === "current window") {
    vscode.commands.executeCommand("vscode.openFolder", uri, false);
  }
}

// ? 创建目录
export async function createFolder(path: string) {
  if (fs.existsSync(path)) {
    vscode.window.showInformationMessage(`The folder is exists.`);
    return true;
  } else {
    const uri = vscode.Uri.file(path);
    vscode.workspace.fs.createDirectory(uri).then(() => {
      vscode.window.showInformationMessage(`Create completed...\t ${path}`);
    });
  }
}

//? 获取子目录
export async function getDirectories(path: string) {
  const uri = vscode.Uri.file(path);
  const entries = await vscode.workspace.fs.readDirectory(uri);
  const directories = [];
  for (const [name, type] of entries) {
    if (type === vscode.FileType.Directory) {
      directories.push(name);
    }
  }
  return directories;
}

//? 删除项目
// todo  删除状态显示
export async function deleteProject(path: string | string[]) {
  if (typeof path === "string") {
    const uri = vscode.Uri.file(path);
    vscode.workspace.fs.delete(uri, { recursive: true });
  } else if (Array.isArray(path)) {
    path.map((p) => {
      const uri = vscode.Uri.file(p);
      vscode.workspace.fs.delete(uri, { recursive: true });
    });
  }
}

export async function executeCommandInTerminal(command: string) {
  const terminals = vscode.window.terminals;
  let terminal: vscode.Terminal | undefined;
  if (terminals.length === 0) {
    terminal = vscode.window.createTerminal();
  } else {
    const items = terminals.map((t) => ({
      label: t.name,
      terminal: t,
    }));
    const selected = await vscode.window.showQuickPick(items);
    if (selected) {
      terminal = selected.terminal;
    }
  }
  if (terminal) {
    terminal.show();
    terminal.sendText(command);
  }
}
