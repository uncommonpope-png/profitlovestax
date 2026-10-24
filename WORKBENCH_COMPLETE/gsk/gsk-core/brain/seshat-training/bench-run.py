#!/usr/bin/env python3
"""Run train-lora.py as a child; report wall time + child peak RSS."""
import resource, subprocess, sys, time

t0 = time.time()
r = subprocess.run(sys.argv[1:])
dt = time.time() - t0
peak_kb = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
print(f'BENCH-WALL: {dt:.1f}s | child peak RSS {peak_kb/1e6:.2f} GB | exit {r.returncode}')
