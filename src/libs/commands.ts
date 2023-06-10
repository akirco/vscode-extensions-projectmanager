import type { Command } from "@/typings/command";
import * as vscode from "vscode";
import * as path from "path";

import {
  getProjectCategories,
  getProjectRootDir,
  makeDir,
  openProject,
  getSubDirs,
  deleteProject,
  executeCommandInTerminal,
  getAvailableList,
  getDefaultScaffolds,
} from "../libs/projectManager";

const commands: Command[] = [
  {
    command: "pm.newProject",
    action: async () => {
      const categories = getProjectCategories().split(",").filter(Boolean);
      const rootDir = getProjectRootDir();
      if (!rootDir) {
        vscode.window.showInformationMessage(
          `Please set root directory in settings.json`
        );
        return;
      }

      const selectedCategory = await vscode.window.showQuickPick(categories, {
        title: "Select Category",
      });

      const projectName = await vscode.window.showInputBox({
        title: "Enter the project name",
      });

      if (selectedCategory && projectName) {
        const projectPath = path.join(rootDir, selectedCategory, projectName);

        const isExists = await makeDir(projectPath);
        if (isExists) {
          return;
        }
        const result = await vscode.window.showQuickPick([
          "Open project folder",
          "Init with scafflod",
          "Excute custom command",
        ]);
        if (result === "Open project folder") {
          openProject(projectPath);
        } else if (result === "Excute custom command") {
          const cmd = await vscode.window.showInputBox({
            placeHolder:
              "Please enter the custom command, example : git clone ...",
          });
          if (cmd) {
            await executeCommandInTerminal(`cd ${projectPath} && ${cmd}`);
          }
        } else if (result === "Init with scafflod") {
          const cmd = await vscode.window.showQuickPick(
            Object.values(getDefaultScaffolds())
          );
          if (cmd) {
            await executeCommandInTerminal(`cd ${projectPath} && ${cmd}`);
          }
        } else {
          return;
        }
      } else {
        return;
      }
    },
  },
  {
    command: "pm.openProject",
    action: async () => {
      const rootDir = getProjectRootDir();
      if (!rootDir) {
        vscode.window.showInformationMessage(
          `Please set root directory in settings.json`
        );
        return;
      }
      const categories = await getAvailableList();

      if (categories && categories.length > 0) {
        const selectedCategory = await vscode.window.showQuickPick(categories, {
          title: "Select the project category",
        });
        if (selectedCategory) {
          const categoryFullPath = path.join(rootDir, selectedCategory);
          const lists = await getSubDirs(categoryFullPath);

          if (lists && lists.length > 0) {
            const selectProject = await vscode.window.showQuickPick(lists, {
              title: "Open the project",
            });
            if (selectProject) {
              openProject(path.join(categoryFullPath, selectProject));
            }
          } else {
            vscode.window.showWarningMessage(
              "current category has not projects!"
            );
          }
        }
      }
    },
  },
  {
    command: "pm.deleteProject",
    action: async () => {
      const rootDir = getProjectRootDir();
      if (!rootDir) {
        vscode.window.showInformationMessage(
          `Please set root directory in settings.json`
        );
        return;
      }

      const categories = await getAvailableList();

      const selectedCategory = await vscode.window.showQuickPick(categories, {
        title: "Select the project category",
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
          vscode.window.showWarningMessage(
            "current category has not projects!"
          );
        }
      }
    },
  },
];

export default commands;
