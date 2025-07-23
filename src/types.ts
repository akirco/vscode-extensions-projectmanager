import * as vscode from "vscode";

export interface Command {
  command: string;
  action: (...args: any[]) => any;
}

export interface ProjectConfig {
  root: string;
  category: string;
  scaffolds: Scaffolds;
  cleanerPatterns: string[];
}

export interface Scaffolds {
  [key: string]: string;
}

export interface QuickPickItem extends vscode.QuickPickItem {
  fullPath?: string;
}