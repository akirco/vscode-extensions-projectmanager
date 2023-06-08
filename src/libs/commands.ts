import type { Command } from "@/typings/command";
import * as vscode from "vscode";
import * as path from "path";

import {
  getProjectCategories,
  getRootFolder,
  createFolder,
  openProject,
  getDirectories,
  deleteProject,
  executeCommandInTerminal,
} from "../libs/projectManager";

import { Scaffolds } from "./presetScaffold";

const categories = getProjectCategories().split(",");
const rootDir = getRootFolder();

const commands: Command[] = [
  {
    command: "pm.newProject",
    action: async () => {
      if (!rootDir) {
        vscode.window.showInformationMessage(
          `Please set root directory in settings.json`
        );
        return;
      }

      const selectedCategory = await vscode.window.showQuickPick(categories, {
        title: "choose the project category",
      });
      const projectName = await vscode.window.showInputBox({
        title: "input the project name",
      });
      if (selectedCategory && projectName) {
        const projectPath = path.join(rootDir, selectedCategory, projectName);

        const isExists = await createFolder(projectPath);
        if (isExists) {
          return;
        }
        const result = await vscode.window.showQuickPick([
          "open folder",
          "excute custom command",
          "init with scafflod",
        ]);
        if (result === "open folder") {
          openProject(projectPath);
        } else if (result === "excute custom command") {
          const cmd = await vscode.window.showInputBox({
            placeHolder: "Please input scaffold command...",
          });
          await executeCommandInTerminal(`cd ${projectPath} && ${cmd}`);
        } else if (result === "init with scafflod") {
          const cmd = await vscode.window.showQuickPick(
            Object.values(Scaffolds)
          );
          await executeCommandInTerminal(`cd ${projectPath} && ${cmd}`);
        }
      }
    },
  },
  {
    command: "pm.openProject",
    action: async () => {
      if (!rootDir) {
        vscode.window.showInformationMessage(
          `Please set root directory in settings.json`
        );
        return;
      }
      const selectedCategory = await vscode.window.showQuickPick(categories, {
        title: "Select the project category",
      });

      const categoryFullPath = path.join(rootDir, selectedCategory!);
      const lists = await getDirectories(categoryFullPath);

      if (lists.length > 0) {
        const selectProject = await vscode.window.showQuickPick(lists, {
          title: "Open the project",
        });
        openProject(path.join(categoryFullPath, selectProject!));
      } else {
        vscode.window.showWarningMessage("current category has not projects!");
      }
    },
  },
  {
    command: "pm.delectProject",
    action: async () => {
      if (!rootDir) {
        vscode.window.showInformationMessage(
          `Please set root directory in settings.json`
        );
        return;
      }
      const selectedCategory = await vscode.window.showQuickPick(categories, {
        title: "Select the project category",
      });
      const subFolder = path.join(rootDir, selectedCategory!);
      const lists = await getDirectories(subFolder);
      if (lists.length > 0) {
        const selectProject = await vscode.window.showQuickPick(lists, {
          title: "Delete the project",
          canPickMany: true,
        });
        selectProject?.map((item) => {
          deleteProject(path.join(subFolder, item)).then(() => {
            vscode.window.showInformationMessage("Delete completed!");
          });
        });
      } else {
        vscode.window.showWarningMessage("current category has not projects!");
      }
    },
  },
];

export default commands;
