import { App } from 'obsidian';

const trans = {
	'setting.lang': '语言',
	'setting.lang_desc': '选择语言后，插件将自动重新加载',
	'setting.lang_auto': '跟随 Obsidian',
	'setting.select_folder': '选择保存目录',
	'setting.select_folder_desc': (_, app) => `将一个目录作为 ${app.vault.configDir} 的备份目标`,
	'setting.if_no_dir': '如果目录不存在',
	'setting.if_no_dir_desc': '覆盖设置时，如果目标位置不存在对应的目录',
	'setting.if_no_dir_create': '创建目录',
	'setting.if_no_dir_ignore': '忽略项目',
	'input.placeholder': '请输入',
	'button.apply': '应用',
	'button.select_folder_tooltip': '如果输入的目录不存在，点击应用后，将会创建该目录',
} satisfies Record<string, TransValue>;

export type TransKeys = keyof typeof trans;

export type TransValue = ((input: unknown, app: App) => string) | string;

export type TransType = Record<TransKeys, TransValue>;

export default trans;
