import * as vscode from "vscode";
import excuteActiveEvent from "./libs/activeEvent";
import commands from "./libs/commands";
import { initialize as initializeStateManager } from "./libs/stateManager";

export function activate(context: vscode.ExtensionContext) {
  excuteActiveEvent(context);
  initializeStateManager(context);

  // register command actions
  commands.map((item) => {
    let disposable = vscode.commands.registerCommand(item.command, item.action);
    context.subscriptions.push(disposable);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {
  // Clean up resources
  for (const terminal of vscode.window.terminals) {
    terminal.dispose();
  }
}
