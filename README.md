# Obsidian Security Scanner

A CLI to scan community plugins in an Obsidian vault for known vulnerabilities.

## Installation 
> [!IMPORTANT]
> Only for development purpose

```bash
npm install
npm run build
```

## Usage

To scan the plugins of a vault, use the `scan` command with the path to your Obsidian vault.

```bash
npx obsidian_security_scanner scan --vault-path /path/to/your/vault
```

### Options

| Option | Description |
| --- | --- |
| `-p, --vault-path <path>` | Path to the Obsidian vault (required) |
| `--withCVE` | Include CVE information in the output (optional) |

### Example

```
$ npx obsidian-security-scanner scan --vault-path /path/to/your/vault --withCVE
✔ Scanning plugins for vulnerabilities...
✔ Scan complete. Vulnerabilities found in the following plugins:re

Plugin: Example Plugin (v1.0.0)
┌───────────┬─────────┬──────────┬────────────────────────────────────┐
│ Component │ Version │ Severity │           Info (CVEs)              │
├───────────┼─────────┼──────────┼────────────────────────────────────┤
│ jquery    │  2.1.4  │  medium  │ CVE-2015-9251, CVE-2019-11358, C…  │
└───────────┴─────────┴──────────┴────────────────────────────────────┘
```

## License

MIT
