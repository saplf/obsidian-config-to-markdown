import { TransType } from './zh';

const trans: Partial<TransType> = {
	'setting.lang': 'Language',
	'setting.lang_desc': 'The plugin will automatically reload after selecting a language',
	'setting.lang_auto': 'Follow Obsidian',
	'setting.select_folder': 'Select save directory',
	'setting.select_folder_desc': (_, app) => `Use a directory as the backup target for ${app.vault.configDir}`,
	'setting.if_no_dir': 'If directory does not exist',
	'setting.if_no_dir_desc': 'When applying settings, if the target directory does not exist',
	'setting.if_no_dir_create': 'Create directory',
	'setting.if_no_dir_ignore': 'Skip item',
};

export default trans;
