import { App } from 'obsidian';

export type TransValue = ((input: unknown, app: App) => string) | string;
