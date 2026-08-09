# Capture overhead benchmark

- Result: PASS
- Maximum incremental p95: 2.402 ms (target <=5 ms)
- Maximum incremental p99: 3.729 ms (target <=10 ms)
- Byte mismatch / dropped / reordered: 0 / 0 / 0
- Runs: 5; warmup: 200/run; measured: 2000/run
- Payload mix: 80% 1KiB, 15% 16KiB, 5% 256KiB
- Hardware: 11th Gen Intel(R) Core(TM) i7-1165G7 @ 2.80GHz, 8 CPUs, 7.6 GiB
- OS / Node / commit: linux 6.18.33.2-microsoft-standard-WSL2; v22.23.1; uncommitted

## Honest limitation

This launch-workspace measurement uses an in-process local echo loop rather than an OS child-process round trip. CI should repeat the packaged child echo benchmark on Linux, macOS, and Windows before release.
