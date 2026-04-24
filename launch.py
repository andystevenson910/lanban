#!/usr/bin/env python3
"""Cross-platform launcher for the Kanban app.

Runs `npm install` if needed, then starts the Vite dev server.
Works on Linux, macOS, and Windows.
"""
import os
import shutil
import subprocess
import sys


def main() -> int:
    root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root)

    npm = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm:
        print(
            "Error: npm not found. Install Node.js from https://nodejs.org and try again.",
            file=sys.stderr,
        )
        return 1

    if not os.path.isdir(os.path.join(root, "node_modules")):
        print("Installing dependencies (first run, this takes a minute)...")
        result = subprocess.run([npm, "install"], cwd=root)
        if result.returncode != 0:
            print("npm install failed.", file=sys.stderr)
            return result.returncode

    print("Starting Kanban dev server... (Ctrl+C to stop)")
    try:
        result = subprocess.run([npm, "run", "dev"], cwd=root)
        return result.returncode
    except KeyboardInterrupt:
        print("\nStopped.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
