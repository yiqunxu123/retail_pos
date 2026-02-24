#!/usr/bin/env node
/**
 * ADB Screenshot Script - Fallback when Maestro is not installed
 * 
 * Uses Android Debug Bridge (adb) to capture screenshots from connected device/emulator.
 * No Playwright, no Maestro - just ADB (comes with Android SDK).
 * 
 * Usage:
 *   1. Ensure app is running on device/emulator (npx expo run:android -d)
 *   2. Manually navigate to desired screen
 *   3. Run: node scripts/adb-screenshot.js [filename]
 * 
 * Or interactive mode: node scripts/adb-screenshot.js --interactive
 *   - Navigate to a screen, press Enter to capture, enter filename
 *   - Repeat for each screen
 * 
 * Screenshots saved to: screenshots/ (created if not exists)
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");
const DEFAULT_APP_ID = "com.anonymous.ititansapp";

function ensureScreenshotsDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    console.log(`Created folder: ${SCREENSHOTS_DIR}`);
  }
}

function checkAdb() {
  try {
    execSync("adb version", { stdio: "pipe" });
    return true;
  } catch {
    console.error("ADB not found. Please ensure Android SDK platform-tools is in PATH.");
    process.exit(1);
  }
}

function getDeviceSerial() {
  try {
    const out = execSync("adb devices", { encoding: "utf-8" });
    const lines = out.trim().split("\n").slice(1).filter((l) => l.trim());
    const connected = lines.filter((l) => l.includes("device") && !l.includes("unauthorized"));
    if (connected.length === 0) {
      console.error("No Android device/emulator connected. Run: adb devices");
      process.exit(1);
    }
    // Use first authorized device; if multiple, prefer non-emulator (physical device)
    const serial = connected[0].split(/\s+/)[0];
    return serial;
  } catch (e) {
    console.error("Failed to check devices:", e.message);
    process.exit(1);
  }
}

function adb(extra = "") {
  const serial = getDeviceSerial();
  return serial ? `adb -s ${serial} ${extra}`.trim() : "adb";
}

function takeScreenshot(filename) {
  ensureScreenshotsDir();
  const baseName = filename.replace(/\.png$/, "");
  const filepath = path.join(SCREENSHOTS_DIR, `${baseName}.png`);
  const adbCmd = adb("exec-out screencap -p");
  try {
    execSync(`${adbCmd} > "${filepath}"`, {
      stdio: "pipe",
      shell: true,
    });
    console.log(`Saved: ${filepath}`);
    return filepath;
  } catch (e) {
    console.error("Screenshot failed:", e.message);
    return null;
  }
}

function launchApp() {
  const adbCmd = adb("shell");
  try {
    execSync(`${adbCmd} am start -n ${DEFAULT_APP_ID}/.MainActivity`, {
      stdio: "pipe",
    });
    console.log("Launched app");
  } catch {
    try {
      execSync(`${adbCmd} monkey -p ${DEFAULT_APP_ID} 1`, { stdio: "pipe" });
      console.log("Launched app via monkey");
    } catch (e) {
      console.warn("Could not launch app:", e.message);
    }
  }
}

function interactiveMode() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("\n=== ADB Screenshot - Interactive Mode ===\n");
  console.log("1. Navigate to the screen you want to capture");
  console.log("2. Press Enter to take screenshot");
  console.log("3. Enter filename (e.g. 01-login, 02-dashboard) or 'q' to quit\n");

  const prompt = () => {
    rl.question("Press Enter when ready (or 'q' to quit): ", (answer) => {
      if (answer.toLowerCase() === "q") {
        console.log("Done.");
        rl.close();
        process.exit(0);
      }
      rl.question("Filename (without .png): ", (name) => {
        if (name.trim()) {
          takeScreenshot(name.trim());
        } else {
          const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
          takeScreenshot(`screenshot-${ts}`);
        }
        console.log("");
        prompt();
      });
    });
  };

  prompt();
}

function main() {
  checkAdb();
  getDeviceSerial(); // validate device exists
  ensureScreenshotsDir();

  const args = process.argv.slice(2);
  if (args.includes("--interactive") || args.includes("-i")) {
    interactiveMode();
    return;
  }

  if (args.includes("--launch")) {
    launchApp();
    return;
  }

  const filename = args[0] || `screenshot-${Date.now()}`;
  takeScreenshot(filename);
}

main();
