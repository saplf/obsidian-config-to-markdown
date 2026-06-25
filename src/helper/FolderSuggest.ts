import { App, AbstractInputSuggest, TFolder, TAbstractFile } from 'obsidian';

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
	private onSelectCallback: (folder: TFolder) => void | Promise<void>;

	constructor(app: App, inputEl: HTMLInputElement, onSelectCallback: (folder: TFolder) => void | Promise<void>) {
		super(app, inputEl);
		this.onSelectCallback = onSelectCallback;
	}

	// 获取仓库中所有的文件夹对象
	getSuggestions(inputStr: string): TFolder[] {
		const abstractFiles = this.app.vault.getAllFolders();
		const folders: TFolder[] = [];
		const lowerCaseInputStr = inputStr.toLowerCase();

		abstractFiles.forEach((file: TAbstractFile) => {
			if (file instanceof TFolder) {
				// 根据用户输入进行模糊匹配过滤（支持根目录 ''）
				if (file.path.toLowerCase().contains(lowerCaseInputStr)) {
					folders.push(file);
				}
			}
		});

		return folders;
	}

	// 在下拉菜单中如何显示文件夹名称
	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.setText(folder.path);
	}

	// 当用户点击或回车选中某个文件夹时的回调
	selectSuggestion(folder: TFolder) {
		this.onSelectCallback(folder)?.then(() => { }).catch(() => { });
		this.close();
	}
}
