const { execSync } = require("node:child_process");

try {
    execSync("npx web-ext lint --source-dir .", {
        stdio: "inherit",
        cwd: process.cwd()
    });
} catch (error) {
    process.exit(error.status || 1);
}
