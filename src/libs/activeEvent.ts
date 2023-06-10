import * as vscode from "vscode";

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
};

export default excuteActiveEvent;
