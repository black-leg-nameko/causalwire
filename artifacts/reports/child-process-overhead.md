# Packaged child-process overhead

- Result: PASS
- Maximum incremental p95: 4.518 ms (target <=5 ms)
- Byte mismatches: 0
- Runtime: linux 6.18.33.2-microsoft-standard-WSL2; v22.23.1
- Method: sequential newline exchange, direct OS child echo vs dist CLI record wrapper; one in-flight frame at a time

## Claim boundary

Measures a local packaged child-process echo path. It excludes remote MCP/tool/network latency and is cross-platform evidence only on runners that execute it.
