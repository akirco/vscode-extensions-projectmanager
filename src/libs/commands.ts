/* eslint-disable @typescript-eslint/naming-convention */
import type { Command } from "@/typings/command";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { QuickPickItem } from "vscode";

import {
  createWorkspace,
  deleteProject,
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
  validateProjectName,
  withErrorHandling,
  withProgress,
} from "../libs/projectManager";

const MESSAGES = {
  NO_ROOT: "Please set root directory in settings.json",
  NO_PROJECTS: "Current category has no projects",
  SELECT_CATEGORY: "Select Project Category",
  ENTER_PROJECT_NAME: "Enter project name",
} as const;

const DEPENDENCY_FOLDERS = [
  "node_modules",
  "target",
] as const;

const formatSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

async function deleteWithConfirmation(dir: string): Promise<void> {
  try {
    // 首先尝试移动到回收站
    await vscode.workspace.fs.delete(vscode.Uri.file(dir), {
      recursive: true,
      useTrash: true
    });
  } catch (error) {
    // 如果移动到回收站失败，询问用户是否直接删除
    const answer = await vscode.window.showWarningMessage(
      `Failed to move "${path.basename(dir)}" to recycle bin. Do you want to delete it permanently?`,
      { modal: true },
      "Yes",
      "No"
    );

    if (answer === "Yes") {
      await vscode.workspace.fs.delete(vscode.Uri.file(dir), {
        recursive: true,
        useTrash: false
      });
    } else {
      throw new Error(`Cancelled deletion of ${dir}`);
    }
  }
}

const commands: Command[] = [
  {
    command: "pm.newProject",
    action: async () => {
      return withErrorHandling(async () => {
        const rootDir = getProjectRootDir();
        if (!rootDir) {
          vscode.window.showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }

        let selectedCategory: string | undefined;
        const category = await getProjectCategories();
        const categories = category.split(",").filter(Boolean);
        selectedCategory = await vscode.window.showQuickPick(categories, {
          title: MESSAGES.SELECT_CATEGORY,
          placeHolder: "type to search category...",
        });

        if (selectedCategory) {
          const projectName = await vscode.window.showInputBox({
            title: MESSAGES.ENTER_PROJECT_NAME,
            placeHolder: "notice that special names may not work...",
            validateInput: validateProjectName(rootDir, selectedCategory)
          });

          if (projectName) {
            const projectPath = path.join(rootDir, selectedCategory, projectName);
            await makeDir(projectPath);

            const result = await vscode.window.showQuickPick([
              "Open project folder",
              "Clone remote repository",
              "Init with scafflod",
              "Excute custom command",
            ]);

            // ...existing code for handling result...
            if (result === "Open project folder") {
              openProject(projectPath);
            } else if (result === "Excute custom command") {
              const cmd = await vscode.window.showInputBox({
                title: "Excute custom command",
                placeHolder: "enter the custom command, example : git clone ...",
              });
              if (cmd) {
                await executeCommandInTerminal(`cd ${projectPath} && ${cmd}`);
              }
              openProject(projectPath);
            } else if (result === "Init with scafflod") {
              const scaffolds = getDefaultScaffolds();
              const cmd = await vscode.window.showQuickPick(
                Object.values(scaffolds)
              );
              if (cmd) {
                await executeCommandInTerminal(`cd ${projectPath} && ${cmd}`);
              }
              openProject(projectPath);
            } else if (result === "Clone remote repository") {
              const repository = await vscode.window.showInputBox({
                title: "Git clone remote repository",
                placeHolder:
                  "enter the remote repository url,example: https://github.com/aa/bb.git...",
              });
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
          vscode.window.showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }
        const categories = await getAvailableList();

        if (categories && categories.length > 0) {
          const selectedCategory = await vscode.window.showQuickPick(
            categories,
            {
              title: "Select the project category",
              placeHolder: "type to search category...",
            }
          );
          if (selectedCategory) {
            const categoryFullPath = path.join(rootDir, selectedCategory);
            const lists = await getSubDirs(categoryFullPath);

            if (lists && lists.length > 0) {
              const selectProject = await vscode.window.showQuickPick(lists, {
                title: "Open the project",
                placeHolder: "type to search project...",
              });
              if (selectProject) {
                openProject(path.join(categoryFullPath, selectProject));
              }
            } else {
              vscode.window.showWarningMessage(MESSAGES.NO_PROJECTS);
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
        const rootDir = getProjectRootDir();
        if (!rootDir) {
          vscode.window.showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }
        const projects = await getAvailableProjects();
        const selectedProject = await vscode.window.showQuickPick(projects, {
          title: "Quick opening project",
          placeHolder: "search your project...",
        });
        if (selectedProject) {
          openProject(selectedProject);
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
          vscode.window.showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }

        const categories = await getAvailableList();

        const selectedCategory = await vscode.window.showQuickPick(categories, {
          title: "Select the project category",
          placeHolder: "type to search category...",
        });
        if (selectedCategory) {
          const categoryFullPath = path.join(rootDir, selectedCategory);
          const lists = await getSubDirs(categoryFullPath);
          if (lists && lists.length > 0) {
            const selectProject = await vscode.window.showQuickPick(lists, {
              title: "Delete the project",
              canPickMany: true,
            });
            if (selectProject) {
              selectProject.map((item) => {
                deleteProject(path.join(categoryFullPath, item));
              });
            }
          } else {
            vscode.window.showWarningMessage(MESSAGES.NO_PROJECTS);
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
          vscode.window.showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }

        const repository = await vscode.window.showInputBox({
          title: "Git clone remote repository",
          placeHolder:
            "Enter repository URL (e.g. https://github.com/user/repo.git)",
          validateInput: (value) => {
            return value.trim() ? null : "Repository URL is required";
          },
        });

        if (!repository) {
          return;
        }

        // Extract default folder name from repository URL
        const defaultName =
          repository
            .split("/")
            .pop()
            ?.replace(/\.git$/, "") || "";

        const category = await getProjectCategories();
        const categories = category.split(",").filter(Boolean);

        const selectedCategory = await vscode.window.showQuickPick(categories, {
          title: "Select Project Category",
          placeHolder: "type to search category...",
        });

        if (!selectedCategory) {
          return;
        }

        let projectName = await vscode.window.showInputBox({
          title: "Enter project name",
          value: defaultName,
          placeHolder: "Project name",
          validateInput: (value) => {
            if (!value.trim()) {
              return "Project name is required";
            }
            const projectPath = path.join(rootDir, selectedCategory, value);
            return fs.existsSync(projectPath) ? "Project already exists" : null;
          },
        });

        if (!projectName) {
          return;
        }

        const projectPath = path.join(rootDir, selectedCategory, projectName);
        const isExists = await makeDir(projectPath);
        if (isExists) {
          return;
        }

        try {
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Cloning Repository",
            cancellable: false
          }, async (progress) => {
            progress.report({ message: "Cloning..." });
            await executeCommandInTerminal(
              `cd ${projectPath} && git clone ${repository} .`
            );
          });

          const openNow = await vscode.window.showInformationMessage(
            "Repository cloned successfully! Open it now?",
            "Yes",
            "No"
          );

          if (openNow === "Yes") {
            await openProject(projectPath);
          }
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }, "Failed to clone repository");
    }
  },
  {
    command: "pm.deleteDependencies",
    action: async () => {
      return withErrorHandling(async () => {
        const rootDir = getProjectRootDir();
        if (!rootDir) {
          vscode.window.showInformationMessage(MESSAGES.NO_ROOT);
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
                message: `Checking ${path.basename(project)} (${i + 1}/${total})`,
              });

              const hasDeps = await hasAnyDependencies(project);
              const totalSize = await getDirectorySize(project);

              results.push({
                label: project,
                picked: hasDeps,
                description: `${hasDeps ? "Has dependencies" : "No dependencies"} (${formatSize(totalSize)})`
              });
            }

            return results;
          }
        );

        const selectedProjects = await vscode.window.showQuickPick(projectsWithDeps, {
          title: "Select projects to clean dependencies",
          placeHolder: "Projects with dependencies are pre-selected",
          canPickMany: true
        });

        if (!selectedProjects?.length) {
          return;
        }

        const projectPaths = selectedProjects.map(item => item.label);

        return withProgress("Cleaning Dependencies", async (progress) => {
          let deletedCount = 0;
          const total = projectPaths.length;
          let current = 0;

          for (const project of projectPaths) {
            current++;
            progress.report({
              message: `Analyzing ${path.basename(project)} (${current}/${total})`,
            });

            const dependencyDirs = await findDependencyDirs(project);

            for (const dir of dependencyDirs) {
              try {
                await deleteWithConfirmation(dir);
                deletedCount++;
              } catch (error) {
                if (error instanceof Error && error.message.includes('Cancelled')) {
                  console.log(error.message);
                  continue;
                }
                console.error(`Failed to delete ${dir}:`, error);
              }
            }
          }

          if (deletedCount > 0) {
            vscode.window.showInformationMessage(
              `Cleaned ${deletedCount} dependency folders from ${projectPaths.length} projects`
            );
          } else {
            vscode.window.showInformationMessage("No dependency folders found");
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
          vscode.window.showInformationMessage(MESSAGES.NO_ROOT);
          return;
        }

        const projects = await getAvailableProjects();
        const selectedProjects = await vscode.window.showQuickPick(projects, {
          title: "Select projects to add to workspace",
          placeHolder: "search your projects...",
          canPickMany: true,
        });

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
          vscode.window.showInformationMessage("No workspaces found");
          return;
        }

        const selectedWorkspace = await vscode.window.showQuickPick(
          workspaces.map((w) => ({
            label: path.basename(w),
            fullPath: w,
          })),
          {
            title: "Select workspace to open",
            placeHolder: "search workspaces...",
          }
        );

        if (selectedWorkspace) {
          const uri = vscode.Uri.file(selectedWorkspace.fullPath);
          await vscode.commands.executeCommand("vscode.openFolder", uri);
        }
      }, "Failed to open workspace");
    },
  }, {
    command: "pm.closeWorkspaceOrFolder",
    action: async () => {
      return withErrorHandling(async () => {
        const currentWorkspace = vscode.workspace.workspaceFolders;
        if (currentWorkspace && currentWorkspace.length > 0) {
          await vscode.commands.executeCommand("workbench.action.closeAllEditors");
          await vscode.commands.executeCommand("workbench.action.closeFolder");
        } else {
          vscode.window.showInformationMessage("No workspace or folder is currently open");
        }
      }, "Failed to close workspace or folder");
    }
  }
];

export default commands;
