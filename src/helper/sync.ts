import { App } from "obsidian";

export enum FileNodeType {
	file,

	folder,
}

export type FileNode = {
	type: FileNodeType;

	name: string;

	path: string;

	relativePath: string;

	parent?: string;
};

/**
 * 转换成 md 文件的文件名称列表
 */
const toMdFileList = [
	/plugins\/[^/]+\/data\.json$/,
	'app.json',
	'appearance.json',
	'community-plugins.json',
	'core-plugins.json',
	'graph.json',
];

/**
 * 不转换成 md 文件的文件列表
 */
const rawFileList = [/plugins\/[^/]+\/main\.js$/, /plugins\/[^/]+\/styles\.css$/, /plugins\/[^/]+\/manifest\.json$/];

/**
 * 文件夹白名单 —— 该名单之外的文件夹忽略
 */
const whiteFolder = [
	// 配置根目录下的所有目录
	/^[^/]+$/,
	// plugin 下的一级目录
	/^plugins\/[^/]+$/,
];

function isInList(value: string, list: (string | RegExp)[]): boolean {
	return list.some(item => typeof item === 'string' ? value === item : item.test(value));
}

function sortNodes(nodes: FileNode[]): FileNode[] {
	return [...nodes].sort((a, b) => {
		if (a.type !== b.type) {
			return a.type === FileNodeType.folder ? -1 : 1;
		}
		return a.path.length - b.path.length;
	});
}

async function ensureDir(adapter: import("obsidian").DataAdapter, path: string): Promise<void> {
	if (!(await adapter.exists(path))) {
		await adapter.mkdir(path);
	}
}

async function writeToVault(app: App, destPath: string, content: string): Promise<void> {
	const existing = app.vault.getFileByPath(destPath);
	if (existing) {
		await app.vault.modify(existing, content);
	} else {
		await app.vault.create(destPath, content);
	}
}

async function listDirRecursive(app: App, dir: string, baseDir: string, parent?: string): Promise<FileNode[]> {
	const { files, folders } = await app.vault.adapter.list(dir);
	const result: FileNode[] = [];

	for (const folderPath of folders.sort()) {
		const name = folderPath.substring(folderPath.lastIndexOf('/') + 1);
		const relativePath = folderPath.substring(baseDir.length + 1);
		if (!isInList(relativePath, whiteFolder)) {
			continue;
		}
		result.push({ type: FileNodeType.folder, name, path: folderPath, relativePath, parent });
		const children = await listDirRecursive(app, folderPath, baseDir, folderPath);
		result.push(...children);
	}

	for (const filePath of files.sort()) {
		const name = filePath.substring(filePath.lastIndexOf('/') + 1);
		const relativePath = filePath.substring(baseDir.length + 1);
		if (!isInList(relativePath, toMdFileList) && !isInList(relativePath, rawFileList)) {
			continue;
		}
		result.push({ type: FileNodeType.file, name, path: filePath, relativePath, parent });
	}

	return result;
}

/**
 * 获取 obsidian 配置文件夹目录文件结构（平铺）
 */
export async function getObsidianConfigTree(app: App): Promise<FileNode[]> {
	const configDir = app.vault.configDir;
	return await listDirRecursive(app, configDir, configDir);
}

/**
 * 将 FileNode[] 写入到 obsidian 库中指定文件夹，保持原有结构
 * 文本文件会转为同名 .md 文件，头部添加 YAML 元信息，正文添加代码块
 * @param nodes      平铺的文件节点列表
 * @param targetDir  目标目录路径（ vault 内）
 */
export async function writeConfigTree(
	app: App,
	nodes: FileNode[],
	targetDir?: string,
): Promise<void> {
	if (!targetDir) {
		return;
	}

	const adapter = app.vault.adapter;
	await ensureDir(adapter, targetDir);

	for (const node of sortNodes(nodes)) {
		if (node.type === FileNodeType.folder) {
			await ensureFolder(app, `${targetDir}/${node.relativePath}`);
			continue;
		}

		const content = await adapter.read(node.path);

		if (isInList(node.relativePath, rawFileList)) {
			await writeToVault(app, `${targetDir}/${node.relativePath}`, content);
		} else {
			const mdContent = await toMarkdownFile(adapter, node, content);
			await writeToVault(app, `${targetDir}/${node.relativePath}.md`, mdContent);
		}
	}
}

async function ensureFolder(app: App, path: string): Promise<void> {
	if (!app.vault.getFolderByPath(path)) {
		await app.vault.createFolder(path);
	}
}

/**
 * 将 vault 内备份内容写回 obsidian 配置文件夹
 * @param nodes      平铺的文件节点列表
 * @param sourceDir  vault 内的备份目录路径
 */
export async function restoreConfigTree(
	app: App,
	nodes: FileNode[],
	sourceDir?: string,
): Promise<void> {
	if (!sourceDir) {
		return;
	}

	const adapter = app.vault.adapter;
	const configDir = app.vault.configDir;

	for (const node of sortNodes(nodes)) {
		if (node.type === FileNodeType.folder) {
			await ensureFolder(app, `${configDir}/${node.relativePath}`);
			continue;
		}

		const destPath = node.path;

		if (isInList(node.relativePath, rawFileList)) {
			const content = await adapter.read(`${sourceDir}/${node.relativePath}`);
			await writeToVault(app, destPath, content);
		} else {
			const mdContent = await adapter.read(`${sourceDir}/${node.relativePath}.md`);
			const content = parseCodeBlock(mdContent);
			await writeToVault(app, destPath, content);
		}
	}
}

async function toMarkdownFile(
	adapter: import("obsidian").DataAdapter,
	node: FileNode,
	content: string,
): Promise<string> {
	const ext = node.name.includes('.') ? node.name.split('.').pop() : '';
	const lang = ext || '';

	let stat: { ctime: number; mtime: number } | null = null;
	try {
		stat = await adapter.stat(node.path);
	} catch {
		// ignore
	}

	const yaml = [
		'---',
		`original_name: ${node.name}`,
		`original_path: ${node.path}`,
		`relative_path: ${node.relativePath}`,
		`created_at: ${stat ? new Date(stat.ctime).toISOString() : ''}`,
		`updated_at: ${stat ? new Date(stat.mtime).toISOString() : ''}`,
		'---',
	].join('\n');

	return `${yaml}\n\n# ${node.name}\n\n\`\`\`${lang}\n${content}\n\`\`\`\n`;
}

function parseCodeBlock(mdContent: string): string {
	const afterFrontMatter = mdContent.replace(/---[\s\S]*?---\s*/, '');
	const afterHeading = afterFrontMatter.replace(/^# .*\n\n?/, '');
	const match = afterHeading.match(/```\w*\n?([\s\S]*?)```/);
	return match ? match[1]!.replace(/\n$/, '') : afterHeading.trim();
}
