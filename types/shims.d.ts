declare module "obsidian" {
	export const Plugin: any;
	export const PluginSettingTab: any;
	export const Setting: any;
	export const Notice: any;
	export function normalizePath(path: string): string;

	export interface TFile {
	path: string;
	name: string;
	stat: { mtime: number; size: number };
	parent?: TFolder;
	deprecated?: boolean;
}

	export interface TFolder {
	path: string;
	name: string;
	children: Array<TFile | TFolder>;
}

	export interface App {
	vault: any;
}

	export interface ButtonComponent {
	setButtonText(text: string): this;
	setCta(): this;
	onClick(callback: () => void): this;
}

	export interface ToggleComponent {
	setValue(value: boolean): this;
	onChange(callback: (value: boolean) => void): this;
}

	export interface TextComponent {
	setPlaceholder(text: string): this;
	setValue(value: string): this;
	onChange(callback: (value: string) => void): this;
}

	export interface DropdownComponent {
	addOption(value: string, label: string): this;
	setValue(value: string): this;
	onChange(callback: (value: string) => void): this;
}
}

declare module "googleapis";

