import { App, getLanguage } from 'obsidian';
import en from './en';
import zhCn, { TransKeys, TransType } from './zh';
import OctmPlugin from '../main';

const localeMap: { [key: string]: Partial<TransType> } = {
	'en': en,
	'zh-cn': zhCn,
	'zh': zhCn,
};

export const localeOptions = {
	en: 'English',
	zh: '中文',
};

export default class AppI18n {
	plugin: OctmPlugin;
	app: App;
	current: Partial<TransType> | undefined;

	constructor(plugin: OctmPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;
		this.changeLang(plugin.settings.lang);
	}

	t(str: TransKeys, arg?: unknown) {
		const dict = this.current || en;
		const v = dict[str] ?? zhCn[str] ?? str;
		if (typeof v === 'function') {
			return v(arg, this.app);
		}
		return v;
	}

	changeLang(lang: string) {
		this.current = localeMap[lang === 'auto' ? getLanguage() : lang];
	}
}
