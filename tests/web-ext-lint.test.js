import { execSync } from "node:child_process";
import test from "node:test";

test("web-ext lint", () => {
    execSync("npx web-ext lint --source-dir .", {
        stdio: "inherit",
        cwd: process.cwd(),
    });
});
