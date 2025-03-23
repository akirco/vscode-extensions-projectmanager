import * as vscode from "vscode";
import { getProjectRootDir } from "./projectManager";

const excuteActiveEvent = (context: vscode.ExtensionContext) => {
  let config = vscode.workspace.getConfiguration("ProjectManager");
  const rootPath = config.get<string>("root");
  if (!rootPath) {
    vscode.window
      .showInformationMessage(
        "Please to set Projects root directory!",
        "Set Projects Root"
      )
      .then((choice) => {
        if (choice === "Set Projects Root") {
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "ProjectManager.root"
          );
        }
      });
  }

  //   reload settings
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(() => {
      config = vscode.workspace.getConfiguration("ProjectManager");
    })
  );

  // Watch for file changes in project root
  const projectRootPath = getProjectRootDir();
  if (projectRootPath) {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(projectRootPath, "**/*")
    );

    context.subscriptions.push(
      watcher,
      watcher.onDidCreate(() => {
        vscode.commands.executeCommand("workbench.files.action.refreshFilesExplorer");
      }),
      watcher.onDidDelete(() => {
        vscode.commands.executeCommand("workbench.files.action.refreshFilesExplorer");
      })
    );
  }
};

export default excuteActiveEvent;
