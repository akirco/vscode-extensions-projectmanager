import * as vscode from "vscode";

export interface Command {
  command: string;
  action: (...args: unknown[]) => unknown;
}

export interface ProjectConfig {
  root: string;
  category: string[];
  scaffolds: Scaffolds;
  cleanerPatterns: string[];
}

export interface Scaffolds {
  [key: string]: string;
}

export interface QuickPickItem extends vscode.QuickPickItem {
  fullPath?: string;
}