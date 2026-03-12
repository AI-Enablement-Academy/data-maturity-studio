import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.env.CONVEX_DEPLOY_KEY) {
  console.log("Convex deploy key detected. Deploying Convex backend before Next.js build.");
  run("npx", ["convex", "deploy", "-y", "--typecheck", "disable"]);
} else {
  console.log("No CONVEX_DEPLOY_KEY found. Skipping Convex deploy for this build.");
}

run("npx", ["next", "build"]);
