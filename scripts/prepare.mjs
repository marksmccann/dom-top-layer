import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync(".git")) {
    console.log("Skipping Husky install because no .git directory was found.");
    process.exit(0);
}

const result = spawnSync("npx", ["--no", "husky"], {
    stdio: "inherit",
    shell: process.platform === "win32"
});

if (result.error) {
    throw result.error;
}

process.exit(result.status ?? 0);
