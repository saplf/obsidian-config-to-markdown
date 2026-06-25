import { App, ButtonComponent, ExtraButtonComponent, IconName, PluginSettingTab, Setting } from 'obsidian';
import OctmPlugin from './main';
import { TransKeys } from './i18n/zh';
import { localeOptions } from './i18n';
import { FolderSuggest } from './helper/FolderSuggest';

export enum IfDirAbsent {
	create = 'create',

	ignore = 'ignore',
}

export interface OctmPluginSettings {
	lang: string;

	targetDir?: string;

	ifDirAbsent: IfDirAbsent;
}

export const DEFAULT_SETTINGS: OctmPluginSettings = {
	lang: 'auto',

	ifDirAbsent: IfDirAbsent.create,
};

export class OctmSettingTab extends PluginSettingTab {
	plugin: OctmPlugin;

	private targetDirBtn: ButtonComponent | undefined;
	private targetDirInput = '';

	constructor(app: App, plugin: OctmPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	get settings() {
		return this.plugin.settings;
	}

	t(str: TransKeys, arg?: unknown) {
		return this.plugin.t(str, arg);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(this.t('setting.lang'))
			.setDesc(this.t('setting.lang_desc'))
			.addExtraButton((eb) => {
				addExtraIcon(eb, 'languages');
			})
			.addDropdown((drop) => {
				drop
					.addOption('auto', this.t('setting.lang_auto'))
					.addOptions(localeOptions)
					.setValue(this.settings.lang)
					.onChange(async (value) => {
						this.settings.lang = value;
						await this.plugin.saveSettings();
						this.plugin.i18n.changeLang(value);
						this.display();
					});
			});

		new Setting(containerEl)
			.setName(this.t('setting.select_folder'))
			.setDesc(this.t('setting.select_folder_desc'))
			.addText((text) => {
				text
					.setValue(this.settings.targetDir ?? '')
					.setPlaceholder(this.t('input.placeholder'))
					.onChange(async (v) => {
						this.targetDirInput = v;
						this.targetDirBtn?.setDisabled(false);
					})

				new FolderSuggest(this.app, text.inputEl, async (folder) => {
					this.targetDirInput = '';
					this.targetDirBtn?.setDisabled(true);
					text.setValue(folder.path);
					this.settings.targetDir = folder.path;
					await this.plugin.saveSettings();
				});
			})
			.addButton((btn) => {
				this.targetDirBtn = btn;
				btn
					.setButtonText(this.t('button.apply'))
					.setTooltip(this.t('button.select_folder_tooltip'))
					.setDisabled(true)
					.onClick(async () => {
						this.settings.targetDir = this.targetDirInput;
						this.targetDirInput = '';
						await this.plugin.saveSettings();
						btn.setDisabled(true);
					})
			});

		new Setting(containerEl)
			.setName(this.t('setting.if_no_dir'))
			.setDesc(this.t('setting.if_no_dir_desc'))
			.addDropdown(async (drop) => {
				drop
					.addOption(IfDirAbsent.create, this.t('setting.if_no_dir_create'))
					.addOption(IfDirAbsent.ignore, this.t('setting.if_no_dir_ignore'))
					.setValue(this.settings.ifDirAbsent)
					.onChange(async (v) => {
						this.settings.ifDirAbsent = v as IfDirAbsent;
						await this.plugin.saveSettings();
					})
			});
	}
}

function addExtraIcon(ebtn: ExtraButtonComponent, icon: IconName) {
	ebtn.setIcon(icon);
	ebtn.extraSettingsEl.style.pointerEvents = 'none';
}
