# Obsidian Security Scanner

A CLI to scan community plugins in an Obsidian vault for known vulnerabilities.

## Installation

```bash
npm install
npm run build
```

## Usage

To scan the plugins of a vault, use the `scan` command with the path to your Obsidian vault.

```bash
node dist/index.js scan --vault-path /path/to/your/vault
```

### Example

```
$ node dist/index.js scan --vault-path /path/to/your/vault
✔ Scanning plugins for vulnerabilities...
✔ Scan complete. Vulnerabilities found in the following plugins:

Plugin: Example Plugin (v1.0.0)
┌───────────┬─────────┬──────────┬──────────────────────────┐
│ Component │ Version │ Severity │      Info (CVEs)       │
├───────────┼─────────┼──────────┼──────────────────────────┤
│ jquery    │  2.1.4  │  medium  │ CVE-2015-9251, CVE-2019… │
└───────────┴─────────┴──────────┴──────────────────────────┘
```

## License

MIT