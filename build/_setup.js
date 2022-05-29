"use strict";
// This is a simple setup script in TypeScript that should work for most projects without modification
// The purpose of this script is to install build dependencies (tools like "func" and "fift") automatically
// We rely on this script for example to support Glitch.com (online IDE) and have it working in one click
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const child_process_1 = __importDefault(require("child_process"));
// package ton-compiler brings its own func and fift executables which interfere with the system ones
try {
    fs_1.default.unlinkSync(__dirname + "/../node_modules/.bin/func");
    fs_1.default.unlinkSync(__dirname + "/../node_modules/.bin/fift");
}
catch (e) { }
try {
    fs_1.default.unlinkSync(__dirname + "/../node_modules/.bin/func.cmd");
    fs_1.default.unlinkSync(__dirname + "/../node_modules/.bin/fift.cmd");
}
catch (e) { }
// check if we're running on glitch.com (glitch is running Ubuntu 16)
if (fs_1.default.existsSync("/app/.glitchdotcom.json")) {
    // make sure we're installed once
    if (!fs_1.default.existsSync("/app/bin")) {
        child_process_1.default.execSync(`mkdir bin`);
        child_process_1.default.execSync(`wget https://github.com/ton-defi-org/ton-binaries/releases/download/ubuntu-16/fift -P ./bin`);
        child_process_1.default.execSync(`chmod +x ./bin/fift`);
        child_process_1.default.execSync(`wget https://github.com/ton-defi-org/ton-binaries/releases/download/ubuntu-16/func -P ./bin`);
        child_process_1.default.execSync(`chmod +x ./bin/func`);
        child_process_1.default.execSync(`wget https://github.com/ton-defi-org/ton-binaries/releases/download/fiftlib/fiftlib.zip -P ./bin`);
        child_process_1.default.execSync(`unzip ./bin/fiftlib.zip -d ./bin/fiftlib`);
    }
}
