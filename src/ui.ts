/* eslint-disable @typescript-eslint/naming-convention */
import * as path from "path";
import * as vscode from "vscode";
import { validateProjectName } from "./libs/projectManager";
import { QuickPickItem, Scaffolds } from "./types";

const MESSAGES = {
  NO_ROOT: "Please set root directory in settings.json",
  NO_PROJECTS: "Current category has no projects",
  SELECT_CATEGORY: "Select Project Category",
  ENTER_PROJECT_NAME: "Enter project name",
} as const;

export function showInformationMessage(message: string) {
  vscode.window.showInformationMessage(message);
}

export function showWarningMessage(message: string) {
  vscode.window.showWarningMessage(message);
}

export function showErrorMessage(message: string) {
  vscode.window.showErrorMessage(message);
}

// Overload signatures for showQuickPick
export function showQuickPick(
  items: readonly string[],
  options: vscode.QuickPickOptions & { canPickMany: true }
): Promise<string[] | undefined>;
export function showQuickPick(
  items: readonly string[],
  options?: vscode.QuickPickOptions
): Promise<string | undefined>;
export function showQuickPick<T extends vscode.QuickPickItem>(
  items: readonly T[],
  options: vscode.QuickPickOptions & { canPickMany: true }
): Promise<T[] | undefined>;
export function showQuickPick<T extends vscode.QuickPickItem>(
  items: readonly T[],
  options?: vscode.QuickPickOptions
): Promise<T | undefined>;

// Implementation
export function showQuickPick<T extends vscode.QuickPickItem>(
  items: readonly T[] | readonly string[],
  options?: vscode.QuickPickOptions
): Promise<T | T[] | string | string[] | undefined> {
  return vscode.window.showQuickPick(items as any, options) as Promise<
    T | T[] | string | string[] | undefined
  >;
}

export async function showInputBox(
  options: vscode.InputBoxOptions
): Promise<string | undefined> {
  return vscode.window.showInputBox(options);
}

export async function showCategoryQuickPick(
  categories: string[]
): Promise<string | undefined> {
  return showQuickPick(categories, {
    title: MESSAGES.SELECT_CATEGORY,
    placeHolder: "type to search category...",
  });
}

export async function showProjectNameInput(
  rootDir: string,
  selectedCategory: string,
  defaultValue?: string
): Promise<string | undefined> {
  return showInputBox({
    title: MESSAGES.ENTER_PROJECT_NAME,
    placeHolder: "notice that special names may not work...",
    value: defaultValue,
    validateInput: validateProjectName(rootDir, selectedCategory),
  });
}

export async function showNewProjectOptions(): Promise<string | undefined> {
  const options: string[] = [
    "Open project folder",
    "Clone remote repository",
    "Init with scafflod",
    "Excute custom command",
  ];
  return showQuickPick(options, {
    title: "Select an action",
  });
}

export async function showRepoCloneInput(): Promise<string | undefined> {
  return showInputBox({
    title: "Git clone remote repository",
    placeHolder:
      "enter the remote repository url,example: https://github.com/aa/bb.git...",
  });
}

export async function showScaffoldQuickPick(
  scaffolds: Scaffolds
): Promise<string | undefined> {
  return showQuickPick(Object.values(scaffolds), {
    title: "Select a scaffold to initialize project",
  });
}

export async function showCustomCommandInput(): Promise<string | undefined> {
  return showInputBox({
    title: "Excute custom command",
    placeHolder: "enter the custom command, example : git clone ...",
  });
}

export async function showProjectQuickPick(
  projects: readonly vscode.QuickPickItem[]
): Promise<vscode.QuickPickItem | undefined> {
  return showQuickPick(projects, {
    title: "Open the project",
    placeHolder: "type to search project...",
  });
}

export async function showDeleteProjectQuickPick(
  projects: string[]
): Promise<string[] | undefined> {
  const result = await showQuickPick(
    projects.map((p) => ({ label: p })),
    {
      title: "Delete the project",
      canPickMany: true,
    }
  );
  return result?.map((item: vscode.QuickPickItem) => item.label);
}

export async function showDepsCleanQuickPick(
  projectsWithDeps: QuickPickItem[]
): Promise<string[] | undefined> {
  const selected = await showQuickPick(projectsWithDeps, {
    title: "Select projects to clean dependencies",
    placeHolder: "Projects with dependencies are pre-selected",
    canPickMany: true,
  });
  return selected?.map((item: QuickPickItem) => item.label);
}

export async function showWorkspaceProjectQuickPick(
  projects: string[]
): Promise<string[] | undefined> {
  const result = await showQuickPick(
    projects.map((p) => ({ label: p })),
    {
      title: "Select projects to add to workspace",
      placeHolder: "search your projects...",
      canPickMany: true,
    }
  );
  return result?.map((item: vscode.QuickPickItem) => item.label);
}

export async function showWorkspaceQuickPick(
  workspaces: string[]
): Promise<string | undefined> {
  const result = await showQuickPick(
    workspaces.map((w) => ({
      label: path.basename(w),
      fullPath: w,
    })),
    {
      title: "Select workspace to open",
      placeHolder: "search workspaces...",
    }
  );
  return result?.fullPath;
}

export async function showOpenProjectWindowQuickPick(): Promise<
  "Current Window" | "New Window" | undefined
> {
  const result = await vscode.window.showInformationMessage(
    "Which window you want to open this project?",
    { modal: true },
    "Current Window",
    "New Window"
  );
  return result;
}

export async function showCloneSuccessQuickPick(): Promise<
  "Yes" | "No" | undefined
> {
  const result = await vscode.window.showInformationMessage(
    "Repository cloned successfully! Open it now?",
    "Yes",
    "No"
  );
  return result;
}

export async function showTrashDeleteConfirm(dir: string): Promise<boolean> {
  const answer = await vscode.window.showWarningMessage(
    `Failed to move "${path.basename(
      dir
    )}" to recycle bin. Do you want to delete it permanently?`,
    { modal: true },
    "Yes",
    "No"
  );
  return answer === "Yes";
}