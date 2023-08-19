import type { Command } from '@/typings/command';
import * as vscode from 'vscode';
import * as path from 'path';

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
  getAvailableProjects,
} from '../libs/projectManager';

const commands: Command[] = [
  {
    command: 'pm.newProject',
    action: async () => {
      let selectedCategory: string | undefined;
      let projectName: string | undefined;
      const categories = getProjectCategories().split(',').filter(Boolean);
      const rootDir = getProjectRootDir();
      if (!rootDir) {
        vscode.window.showInformationMessage(
          `Please set root directory in settings.json`
        );
        return;
      }
      selectedCategory = await vscode.window.showQuickPick(categories, {
        title: 'Select Project Category',
        placeHolder: 'type to search category...',
      });
      if (selectedCategory) {
        projectName = await vscode.window.showInputBox({
          title: 'Enter the project name',
          placeHolder: 'notice that special names may not work...',
        });
      }
      if (selectedCategory && projectName) {
        const projectPath = path.join(rootDir, selectedCategory, projectName);
        const isExists = await makeDir(projectPath);
        if (isExists) {
          return;
        }
        const result = await vscode.window.showQuickPick([
          'Open project folder',
          'Clone remote repository',
          'Init with scafflod',
          'Excute custom command',
        ]);
        if (result === 'Open project folder') {
          openProject(projectPath);
        } else if (result === 'Excute custom command') {
          const cmd = await vscode.window.showInputBox({
            title: 'Excute custom command',
            placeHolder: 'enter the custom command, example : git clone ...',
          });
          if (cmd) {
            await executeCommandInTerminal(`cd ${projectPath} && ${cmd}`);
          }
        } else if (result === 'Init with scafflod') {
          const cmd = await vscode.window.showQuickPick(
            Object.values(getDefaultScaffolds())
          );
          if (cmd) {
            await executeCommandInTerminal(`cd ${projectPath} && ${cmd}`);
          }
        } else if (result === 'Clone remote repository') {
          const repository = await vscode.window.showInputBox({
            title: 'Git clone remote repository',
            placeHolder:
              'enter the remote repository url,example: https://github.com/aa/bb.git...',
          });
          if (repository) {
            await executeCommandInTerminal(
              `cd ${projectPath} && git clone ${repository}`
            );
          }
        }
      } else {
        return;
      }
    },
  },
  {
    command: 'pm.openProject',
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
          title: 'Select the project category',
          placeHolder: 'type to search category...',
        });
        if (selectedCategory) {
          const categoryFullPath = path.join(rootDir, selectedCategory);
          const lists = await getSubDirs(categoryFullPath);

          if (lists && lists.length > 0) {
            const selectProject = await vscode.window.showQuickPick(lists, {
              title: 'Open the project',
              placeHolder: 'type to search project...',
            });
            if (selectProject) {
              openProject(path.join(categoryFullPath, selectProject));
            }
          } else {
            vscode.window.showWarningMessage(
              'current category has not projects!'
            );
          }
        }
      }
    },
  },
  {
    command: 'pm.quickOpenProject',
    action: async () => {
      const rootDir = getProjectRootDir();
      if (!rootDir) {
        vscode.window.showInformationMessage(
          `Please set root directory in settings.json`
        );
        return;
      }
      const projects = await getAvailableProjects();
      const selectedProject = await vscode.window.showQuickPick(projects, {
        title: 'Quick opening project',
        placeHolder: 'search your project...',
      });
      if (selectedProject) {
        openProject(selectedProject);
      }
    },
  },
  {
    command: 'pm.deleteProject',
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
        title: 'Select the project category',
        placeHolder: 'type to search category...',
      });
      if (selectedCategory) {
        const categoryFullPath = path.join(rootDir, selectedCategory);
        const lists = await getSubDirs(categoryFullPath);
        if (lists && lists.length > 0) {
          const selectProject = await vscode.window.showQuickPick(lists, {
            title: 'Delete the project',
            canPickMany: true,
          });
          if (selectProject) {
            selectProject.map((item) => {
              deleteProject(path.join(categoryFullPath, item));
            });
          }
        } else {
          vscode.window.showWarningMessage(
            'current category has not projects!'
          );
        }
      }
    },
  },
];

export default commands;
