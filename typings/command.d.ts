export interface Command {
  command: string;
  message?: string;
  action: (...args: any[]) => any;
}
