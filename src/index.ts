#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import { exec } from "node:child_process";
import { Command } from "commander";
import { consola } from "consola";
import type { PluginManifest } from "./types/PluginManifest";
import type { Vulnerability } from "./types/Vulnerability";
import type { RetireFileResult } from "./types/RetireFileResult";
import type { VulnerabilityRow } from "./types/VulnerabilityRow";

async function isRetireInstalled(): Promise<boolean> {
	return new Promise((resolve) => {
		exec("npx retire --version", (error) => {
			if (error) {
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
}

async function runRetire(pluginPath: string): Promise<Vulnerability[]> {
	return new Promise((resolve) => {
		const command = `npx retire --path "${pluginPath}" --outputformat json`;
		exec(command, (_error, stdout) => {
			if (stdout) {
				try {
					const retireOutput = JSON.parse(stdout);
					if (retireOutput.data && Array.isArray(retireOutput.data)) {
						const allVulnerabilities = retireOutput.data.flatMap(
							(fileResult: RetireFileResult) => fileResult.results || [],
						);
						resolve(allVulnerabilities);
					} else {
						resolve([]);
					}
				} catch (_e) {
					consola.error(`Failed to parse retire.js output for ${pluginPath}`);
					resolve([]);
				}
			} else {
				resolve([]);
			}
		});
	});
}

async function scanPluginManifests(
	vaultPath: string,
): Promise<PluginManifest[]> {
	const pluginsPath = path.join(vaultPath, ".obsidian", "plugins");
	try {
		const stats = await fs.promises.stat(pluginsPath);
		if (!stats.isDirectory()) {
			consola.error(`Error: Plugins path is not a directory: ${pluginsPath}`);
			return [];
		}
	} catch (_error) {
		consola.error(`Error accessing plugins path: ${pluginsPath}`);
		consola.error(
			"Please ensure the vault path is correct and contains an .obsidian/plugins directory.",
		);
		return [];
	}

	const pluginFolders = await fs.promises.readdir(pluginsPath, {
		withFileTypes: true,
	});

	const manifests: PluginManifest[] = [];

	for (const dirent of pluginFolders) {
		if (dirent.isDirectory()) {
			const manifestPath = path.join(pluginsPath, dirent.name, "manifest.json");
			try {
				const manifestContent = await fs.promises.readFile(
					manifestPath,
					"utf-8",
				);
				const manifestData = JSON.parse(manifestContent);
				manifests.push({
					id: manifestData.id,
					name: manifestData.name,
					version: manifestData.version,
					path: path.join(pluginsPath, dirent.name),
				});
			} catch (_error) {
				// Ignore folders without a manifest.json or with read errors
			}
		}
	}

	return manifests;
}

async function main() {
	const program = new Command();

	program
		.name("obsidian-security-scanner")
		.description("A CLI to scan community plugins in an Obsidian vault.")
		.version("1.0.0");

	program
		.command("scan")
		.description("Scan the plugins of a vault")
		.option("-p, --vault-path <path>", "Path to the Obsidian vault")
		.option("--withCVE", "Include CVE information in the output")
		.action(async (options) => {
			const retireInstalled = await isRetireInstalled();
			if (!retireInstalled) {
				consola.error(
					"Retire.js is not installed. Please install it using your preferred package manager:",
				);
				consola.info("npm: npm install -g retire");
				consola.info("pnpm: pnpm install -g retire");
				consola.info("yarn: yarn global add retire");
				return;
			}

			const vaultPath = options.vaultPath;
			if (!vaultPath) {
				consola.error("The vault path is required.");
				program.help();
				return;
			}
			const plugins = await scanPluginManifests(vaultPath);

			if (plugins.length === 0) {
				consola.info("No plugins found or an error occurred.");
				return;
			}

			consola.info("Found plugins:");
			console.table(
				plugins.map((p) => ({
					Name: p.name,
					Version: p.version,
				})),
			);

			consola.start("Scanning plugins for vulnerabilities...");

			const scanPromises = plugins.map(async (plugin) => {
				const results = await runRetire(plugin.path);
				return { plugin, results };
			});

			const allResults = await Promise.all(scanPromises);
			const pluginsWithVulnerabilities = allResults.filter(
				(r) => r.results.length > 0,
			);

			if (pluginsWithVulnerabilities.length === 0) {
				consola.success("Scan complete. No vulnerabilities found.");
				return;
			}

			consola.warn(
				"Scan complete. Vulnerabilities found in the following plugins:",
			);

			for (const { plugin, results } of pluginsWithVulnerabilities) {
				consola.info(`\nPlugin: ${plugin.name} (v${plugin.version})`);
				const tableData = results
					.filter((result) => result.vulnerabilities?.length)
					.flatMap((result) =>
						result.vulnerabilities.map((vuln) => {
							const row: VulnerabilityRow = {
								Component: result.component,
								Version: result.version,
								Severity: vuln.severity,
							};
							if (options.withCVE) {
								row["Info (CVEs)"] = vuln.info.join(", ");
							}
							return row;
						}),
					);
				console.table(tableData);
			}
		});

	program.parse(process.argv);
}

main();
