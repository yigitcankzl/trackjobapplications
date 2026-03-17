#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const COPY_DIRS = ["_locales", "background", "content", "icons", "options", "popup"];

function clean(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true });
  }
  fs.mkdirSync(target, { recursive: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyAssets(targetDir) {
  for (const dir of COPY_DIRS) {
    const src = path.join(ROOT, dir);
    if (fs.existsSync(src)) {
      copyDir(src, path.join(targetDir, dir));
    }
  }
}

function buildChrome(manifest) {
  const targetDir = path.join(DIST, "chrome");
  clean(targetDir);

  // Remove Firefox-specific fields
  delete manifest.browser_specific_settings;
  // Chrome only supports service_worker, not scripts
  if (manifest.background) {
    delete manifest.background.scripts;
  }

  fs.writeFileSync(
    path.join(targetDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  copyAssets(targetDir);

  // Create ZIP
  execSync(`cd "${targetDir}" && zip -r ../chrome.zip .`);
  console.log("Chrome build ready: dist/chrome.zip");
}

function buildFirefox(manifest) {
  const targetDir = path.join(DIST, "firefox");
  clean(targetDir);

  // Firefox uses background.scripts, not service_worker
  if (manifest.background) {
    delete manifest.background.service_worker;
  }

  fs.writeFileSync(
    path.join(targetDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  copyAssets(targetDir);

  // Create ZIP
  execSync(`cd "${targetDir}" && zip -r ../firefox.zip .`);
  console.log("Firefox build ready: dist/firefox.zip");
}

// Main
const target = process.argv[2]; // "chrome", "firefox", or undefined (both)

const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "manifest.json"), "utf-8")
);

clean(DIST);

if (!target || target === "chrome") {
  buildChrome(JSON.parse(JSON.stringify(manifest)));
}
if (!target || target === "firefox") {
  buildFirefox(JSON.parse(JSON.stringify(manifest)));
}

if (!target) {
  console.log("\nBoth builds complete!");
}
