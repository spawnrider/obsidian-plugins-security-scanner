import type { PluginManifest } from "./PluginManifest";
import type { Vulnerability } from "./Vulnerability";

export interface PluginScanResult {
	plugin: PluginManifest;
	results: Vulnerability[];
}
