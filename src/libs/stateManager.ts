import * as vscode from "vscode";

const RECENTLY_OPENED_PROJECTS_KEY = "pm.recentlyOpenedProjects";
const MAX_RECENT_PROJECTS = 50;

let globalState: vscode.Memento;

export function initialize(context: vscode.ExtensionContext) {
  globalState = context.globalState;
}

export function getRecentlyOpenedProjects(count?: number): string[] {
  const projects = globalState.get<string[]>(RECENTLY_OPENED_PROJECTS_KEY) || [];
  if (count) {
    return projects.slice(0, count);
  }
  return projects;
}

export async function addProjectToRecentlyOpened(projectPath: string) {
  let recentProjects = getRecentlyOpenedProjects();

  // Remove the project if it already exists to move it to the top
  const existingIndex = recentProjects.indexOf(projectPath);
  if (existingIndex > -1) {
    recentProjects.splice(existingIndex, 1);
  }

  // Add the new project to the top of the list
  recentProjects.unshift(projectPath);

  // Limit the number of recent projects
  if (recentProjects.length > MAX_RECENT_PROJECTS) {
    recentProjects = recentProjects.slice(0, MAX_RECENT_PROJECTS);
  }

  await globalState.update(RECENTLY_OPENED_PROJECTS_KEY, recentProjects);
}