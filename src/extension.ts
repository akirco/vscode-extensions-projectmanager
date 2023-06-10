import * as vscode from "vscode";
import commands from "./libs/commands";
import excuteActiveEvent from "./libs/activeEvent";

export function activate(context: vscode.ExtensionContext) {
  excuteActiveEvent(context);

  // register command actions
  commands.map((item) => {
    let disposable = vscode.commands.registerCommand(item.command, item.action);
    context.subscriptions.push(disposable);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
