import * as path from "path";
import * as vscode from "vscode";

import {
  createWorkspace,
  deleteProject,
  deleteWithConfirmation,
  executeCommandInTerminal,
  findDependencyDirs,
  getAvailableList,
  getAvailableProjects,
  getAvailableWorkspaces,
  getDefaultScaffolds,
  getDirectorySize,
  getProjectCategories,
  getProjectRootDir,
  getSubDirs,
  hasAnyDependencies,
  makeDir,
  openProject,
  withErrorHandling,
  withProgress,
} from "../libs/projectManager";
import { getRecentlyOpenedProjects } from "../libs/stateManager";
import { Command, QuickPickItem } from "../types";
import {
  showCategoryQuickPick,
  showCloneSuccessQuickPick,
  showCustomCommandInput,
  showDeleteProjectQuickPick,
  showDepsCleanQuickPick,
  showInformationMessage,
  showNewProjectOptions,
  showProjectNameInput,
  showProjectQuickPick,
  showRepoCloneInput,
  showScaffoldQuickPick,
  showWarningMessage,
  showWorkspaceProjectQuickPick,
  showWorkspaceQuickPick,
} from "../ui";

const MESSAGES = {
  NO_ROOT: "Please set root directory in settings.json",
  NO_PROJECTS: "Current category has no projects",
  NO_RECENT_PROJECTS: "No recent projects to display.",
} as const;

const formatSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

const commands: Command[] = [
  {
    command: "pm.newProject",
    action: async () => {
      return withErrorHandling(async () => {
        const rootDir = getProjectRootDir();
        if (!rootDir) {
          showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }

        const categories = await getProjectCategories();
        const selectedCategory = await showCategoryQuickPick(categories);

        if (selectedCategory) {
          const projectName = await showProjectNameInput(
            rootDir,
            selectedCategory
          );

          if (projectName) {
            const projectPath = path.join(
              rootDir,
              selectedCategory,
              projectName
            );
            await makeDir(projectPath);

            const result = await showNewProjectOptions();

            if (result === "Open project folder") {
              openProject(projectPath);
            } else if (result === "Excute custom command") {
              const cmd = await showCustomCommandInput();
              if (cmd) {
                await executeCommandInTerminal(`cd ${projectPath} && ${cmd}`);
              }
              openProject(projectPath);
            } else if (result === "Init with scafflod") {
              const scaffolds = getDefaultScaffolds();
              const cmd = await showScaffoldQuickPick(scaffolds);
              if (cmd) {
                await executeCommandInTerminal(`cd ${projectPath} && ${cmd}`);
              }
              openProject(projectPath);
            } else if (result === "Clone remote repository") {
              const repository = await showRepoCloneInput();
              if (repository) {
                await executeCommandInTerminal(
                  `cd ${projectPath} && git clone ${repository}`
                );
              }
              openProject(projectPath);
            }
          }
        }
      }, "Failed to create project");
    },
  },
  {
    command: "pm.openProject",
    action: async () => {
      return withErrorHandling(async () => {
        const rootDir = getProjectRootDir();
        if (!rootDir) {
          showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }
        const categories = await getAvailableList();

        if (categories && categories.length > 0) {
          const selectedCategory = await showCategoryQuickPick(categories);
          if (selectedCategory) {
            const categoryFullPath = path.join(rootDir, selectedCategory);
            const lists = await getSubDirs(categoryFullPath);

            if (lists && lists.length > 0) {
              const selectProject = await showProjectQuickPick(
                lists.map((l) => ({ label: l }))
              );
              if (selectProject) {
                openProject(path.join(categoryFullPath, selectProject.label));
              }
            } else {
              showWarningMessage(MESSAGES.NO_PROJECTS);
            }
          }
        }
      }, "Failed to open project");
    },
  },
  {
    command: "pm.quickOpenProject",
    action: async () => {
      return withErrorHandling(async () => {
        const recentProjects = getRecentlyOpenedProjects(10);
        const allProjects = await getAvailableProjects();

        const quickPickItems: vscode.QuickPickItem[] = [];

        if (recentProjects.length > 0) {
          quickPickItems.push({
            label: "Recent Projects",
            kind: vscode.QuickPickItemKind.Separator,
          });
          quickPickItems.push(...recentProjects.map((p) => ({ label: p })));
        }

        const otherProjects = allProjects.filter(
          (p) => !recentProjects.includes(p)
        );

        if (otherProjects.length > 0) {
          quickPickItems.push({
            label: "All Projects",
            kind: vscode.QuickPickItemKind.Separator,
          });
          quickPickItems.push(...otherProjects.map((p) => ({ label: p })));
        }

        if (quickPickItems.length === 0) {
          showInformationMessage(MESSAGES.NO_PROJECTS);
          return;
        }

        const selected = await showProjectQuickPick(quickPickItems);

        if (selected) {
          openProject(selected.label);
        }
      }, "Failed to quick open project");
    },
  },
  {
    command: "pm.deleteProject",
    action: async () => {
      return withErrorHandling(async () => {
        const rootDir = getProjectRootDir();
        if (!rootDir) {
          showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }

        const categories = await getAvailableList();

        const selectedCategory = await showCategoryQuickPick(categories);
        if (selectedCategory) {
          const categoryFullPath = path.join(rootDir, selectedCategory);
          const lists = await getSubDirs(categoryFullPath);
          if (lists && lists.length > 0) {
            const selectProject = await showDeleteProjectQuickPick(lists);
            if (selectProject) {
              selectProject.map((item) => {
                deleteProject(path.join(categoryFullPath, item));
              });
            }
          } else {
            showWarningMessage(MESSAGES.NO_PROJECTS);
          }
        }
      }, "Failed to delete project");
    },
  },
  {
    command: "pm.cloneRepository",
    action: async () => {
      return withErrorHandling(async () => {
        const rootDir = getProjectRootDir();
        if (!rootDir) {
          showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }

        const repository = await showRepoCloneInput();

        if (!repository) {
          return;
        }

        // Extract default folder name from repository URL
        const defaultName =
          repository
            .split("/")
            .pop()
            ?.replace(/\.git$/, "") || "";

        const categories = await getProjectCategories();

        const selectedCategory = await showCategoryQuickPick(categories);

        if (!selectedCategory) {
          return;
        }

        const projectName = await showProjectNameInput(
          rootDir,
          selectedCategory,
          defaultName
        );

        if (!projectName) {
          return;
        }

        const projectPath = path.join(rootDir, selectedCategory, projectName);
        const isExists = await makeDir(projectPath);
        if (isExists) {
          return;
        }

        try {
          await withProgress("Cloning Repository", async (progress) => {
            progress.report({ message: "Cloning..." });
            await executeCommandInTerminal(
              `cd ${projectPath} && git clone ${repository} .`
            );
          });

          const openNow = await showCloneSuccessQuickPick();

          if (openNow === "Yes") {
            await openProject(projectPath);
          }
        } catch (error) {
          showInformationMessage(
            `Failed to clone repository: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }, "Failed to clone repository");
    },
  },
  {
    command: "pm.deleteDependencies",
    action: async () => {
      return withErrorHandling(async () => {
        const rootDir = getProjectRootDir();
        if (!rootDir) {
          showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }

        const projects = await getAvailableProjects();

        const projectsWithDeps = await withProgress(
          "Checking Projects",
          async (progress) => {
            const results: QuickPickItem[] = [];
            const total = projects.length;

            for (let i = 0; i < projects.length; i++) {
              const project = projects[i];
              progress.report({
                message: `Checking ${path.basename(project)} (${
                  i + 1
                }/${total})`,
              });

              const hasDeps = await hasAnyDependencies(project);
              // 没依赖跳过
              if (!hasDeps) {
                break;
              }

              const totalSize = await getDirectorySize(project);

              results.push({
                label: project,
                picked: hasDeps,
                description: `${
                  hasDeps ? "Has dependencies" : "No dependencies"
                } (${formatSize(totalSize)})`,
              });
            }

            return results;
          }
        );
        if (!projectsWithDeps.length) {
          showInformationMessage("No dependencies found.");
          return;
        }
        const selectedProjects = await showDepsCleanQuickPick(projectsWithDeps);

        if (!selectedProjects?.length) {
          return;
        }

        return withProgress("Cleaning Dependencies", async (progress) => {
          let deletedCount = 0;
          const total = selectedProjects.length;
          let current = 0;

          for (const project of selectedProjects) {
            current++;
            progress.report({
              message: `Analyzing ${path.basename(
                project
              )} (${current}/${total})`,
            });

            const dependencyDirs = await findDependencyDirs(project);

            for (const dir of dependencyDirs) {
              try {
                await deleteWithConfirmation(dir);
                deletedCount++;
              } catch (error) {
                if (
                  error instanceof Error &&
                  error.message.includes("Cancelled")
                ) {
                  console.log(error.message);
                  continue;
                }
                console.error(`Failed to delete ${dir}:`, error);
              }
            }
          }

          if (deletedCount > 0) {
            showInformationMessage(
              `Cleaned ${deletedCount} dependency folders from ${selectedProjects.length} projects`
            );
          } else {
            showInformationMessage("No dependency folders found");
          }
        });
      }, "Failed to clean dependencies");
    },
  },
  {
    command: "pm.openWorkspace",
    action: async () => {
      return withErrorHandling(async () => {
        const rootDir = getProjectRootDir();
        if (!rootDir) {
          showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }

        const projects = await getAvailableProjects();
        const selectedProjects = await showWorkspaceProjectQuickPick(projects);

        if (!selectedProjects?.length) {
          return;
        }

        const workspaceFile = await createWorkspace(selectedProjects);
        const uri = vscode.Uri.file(workspaceFile);
        await vscode.commands.executeCommand("vscode.openFolder", uri);
      }, "Failed to create workspace");
    },
  },
  {
    command: "pm.quickOpenWorkspace",
    action: async () => {
      return withErrorHandling(async () => {
        const workspaces = await getAvailableWorkspaces();

        if (!workspaces.length) {
          showInformationMessage("No workspaces found");
          return;
        }

        const selectedWorkspace = await showWorkspaceQuickPick(workspaces);

        if (selectedWorkspace) {
          const uri = vscode.Uri.file(selectedWorkspace);
          await vscode.commands.executeCommand("vscode.openFolder", uri);
        }
      }, "Failed to open workspace");
    },
  },
  {
    command: "pm.closeWorkspaceOrFolder",
    action: async () => {
      return withErrorHandling(async () => {
        const currentWorkspace = vscode.workspace.workspaceFolders;
        if (currentWorkspace && currentWorkspace.length > 0) {
          await vscode.commands.executeCommand(
            "workbench.action.closeAllEditors"
          );
          await vscode.commands.executeCommand("workbench.action.closeFolder");
        } else {
          showInformationMessage("No workspace or folder is currently open");
        }
      }, "Failed to close workspace or folder");
    },
  },
];

export default commands;
