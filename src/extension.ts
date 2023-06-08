import * as vscode from "vscode";
import commands from "./libs/commands";

// get config
let config = vscode.workspace.getConfiguration("ProjectManager");

export function activate(context: vscode.ExtensionContext) {
  // set projects root directory must be
  const projectsRoot = config.get<string>("root");
  if (!projectsRoot) {
    vscode.window
      .showInformationMessage(
        "please to set Projects root directory!!!",
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

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(() => {
      // update user settings
      config = vscode.workspace.getConfiguration("ProjectManager");
    })
  );

  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "pm" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  commands.map((item) => {
    let disposable = vscode.commands.registerCommand(item.command, item.action);
    context.subscriptions.push(disposable);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
