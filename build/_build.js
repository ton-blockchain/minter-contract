"use strict";
// This is a simple generic build script in TypeScript that should work for most projects without modification
// The script assumes that it is running from the repo root, and the directories are organized this way:
//  ./build/ - directory for build artifacts exists
//  ./contracts/*.fc - root contracts that are deployed separately are here
//  ./contracts/imports/*.fc - shared utility code that should be imported as compilation dependency is here
// if you need imports that are dedicated to one contract and aren't shared, place them in a directory with the contract name:
//  ./contracts/import/mycontract/*.fc
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const process_1 = __importDefault(require("process"));
const child_process_1 = __importDefault(require("child_process"));
const fast_glob_1 = __importDefault(require("fast-glob"));
function main() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`=================================================================`);
        console.log(`Build script running, let's find some FunC contracts to compile..`);
        // if we have an explicit bin directory, use the executables there (needed for glitch.com)
        if (fs_1.default.existsSync("bin")) {
            process_1.default.env.PATH = path_1.default.join(__dirname, "..", "bin") + path_1.default.delimiter + process_1.default.env.PATH;
            process_1.default.env.FIFTPATH = path_1.default.join(__dirname, "..", "bin", "fiftlib");
        }
        // make sure func compiler is available
        let funcVersion = "";
        try {
            funcVersion = child_process_1.default.execSync("func -V").toString();
        }
        catch (e) { }
        if (!funcVersion.includes(`Func build information`)) {
            console.log(`\nFATAL ERROR: 'func' executable is not found, is it installed and in path?`);
            process_1.default.exit(1);
        }
        // make sure fift cli is available
        let fiftVersion = "";
        try {
            fiftVersion = child_process_1.default.execSync("fift -V").toString();
        }
        catch (e) { }
        if (!fiftVersion.includes(`Fift build information`)) {
            console.log(`\nFATAL ERROR: 'fift' executable is not found, is it installed and in path?`);
            process_1.default.exit(1);
        }
        // go over all the root contracts in the contracts directory
        const rootContracts = fast_glob_1.default.sync(["contracts/*.fc", "contracts/*.func"]);
        for (const rootContract of rootContracts) {
            // compile a new root contract
            console.log(`\n* Found root contract '${rootContract}' - let's compile it:`);
            const contractName = path_1.default.parse(rootContract).name;
            // delete existing build artifacts
            const fiftArtifact = `build/${contractName}.fif`;
            if (fs_1.default.existsSync(fiftArtifact)) {
                console.log(` - Deleting old build artifact '${fiftArtifact}'`);
                fs_1.default.unlinkSync(fiftArtifact);
            }
            const mergedFuncArtifact = `build/${contractName}.merged.fc`;
            if (fs_1.default.existsSync(mergedFuncArtifact)) {
                console.log(` - Deleting old build artifact '${mergedFuncArtifact}'`);
                fs_1.default.unlinkSync(mergedFuncArtifact);
            }
            const fiftCellArtifact = `build/${contractName}.cell.fif`;
            if (fs_1.default.existsSync(fiftCellArtifact)) {
                console.log(` - Deleting old build artifact '${fiftCellArtifact}'`);
                fs_1.default.unlinkSync(fiftCellArtifact);
            }
            const cellArtifact = `build/${contractName}.cell`;
            if (fs_1.default.existsSync(cellArtifact)) {
                console.log(` - Deleting old build artifact '${cellArtifact}'`);
                fs_1.default.unlinkSync(cellArtifact);
            }
            // check if we have a tlb file
            const tlbFile = `contracts/${contractName}.tlb`;
            if (fs_1.default.existsSync(tlbFile)) {
                console.log(` - TL-B file '${tlbFile}' found, calculating crc32 on all ops..`);
                const tlbContent = fs_1.default.readFileSync(tlbFile).toString();
                const tlbOpMessages = (_a = tlbContent.match(/^(\w+).*=\s*InternalMsgBody$/gm)) !== null && _a !== void 0 ? _a : [];
                for (const tlbOpMessage of tlbOpMessages) {
                    const crc = crc32(tlbOpMessage);
                    const asQuery = `0x${(crc & 0x7fffffff).toString(16)}`;
                    const asResponse = `0x${((crc | 0x80000000) >>> 0).toString(16)}`;
                    console.log(`   op '${tlbOpMessage.split(" ")[0]}': '${asQuery}' as query (&0x7fffffff), '${asResponse}' as response (|0x80000000)`);
                }
            }
            else {
                console.log(` - Warning: TL-B file for contract '${tlbFile}' not found, are your op consts according to standard?`);
            }
            // create a merged fc file with source code from all dependencies
            let sourceToCompile = "";
            const importFiles = fast_glob_1.default.sync([`contracts/imports/*.fc`, `contracts/imports/*.func`, `contracts/imports/${contractName}/*.fc`, `contracts/imports/${contractName}/*.func`]);
            for (const importFile of importFiles) {
                console.log(` - Adding import '${importFile}'`);
                sourceToCompile += `${fs_1.default.readFileSync(importFile).toString()}\n`;
            }
            console.log(` - Adding the contract itself '${rootContract}'`);
            sourceToCompile += `${fs_1.default.readFileSync(rootContract).toString()}\n`;
            fs_1.default.writeFileSync(mergedFuncArtifact, sourceToCompile);
            console.log(` - Build artifact created '${mergedFuncArtifact}'`);
            // run the func compiler to create a fif file
            console.log(` - Trying to compile '${mergedFuncArtifact}' with 'func' compiler..`);
            const buildErrors = child_process_1.default.execSync(`func -APS -o build/${contractName}.fif ${mergedFuncArtifact} 2>&1 1>node_modules/.tmpfunc`).toString();
            if (buildErrors.length > 0) {
                console.log(` - OH NO! Compilation Errors! The compiler output was:`);
                console.log(`\n${buildErrors}`);
                process_1.default.exit(1);
            }
            else {
                console.log(` - Compilation successful!`);
            }
            // make sure fif build artifact was created
            if (!fs_1.default.existsSync(fiftArtifact)) {
                console.log(` - For some reason '${fiftArtifact}' was not created!`);
                process_1.default.exit(1);
            }
            else {
                console.log(` - Build artifact created '${fiftArtifact}'`);
            }
            // create a temp cell.fif that will generate the cell
            let fiftCellSource = `"Asm.fif" include\n`;
            fiftCellSource += `${fs_1.default.readFileSync(fiftArtifact).toString()}\n`;
            fiftCellSource += `boc>B "${cellArtifact}" B>file`;
            fs_1.default.writeFileSync(fiftCellArtifact, fiftCellSource);
            // run fift cli to create the cell
            try {
                child_process_1.default.execSync(`fift ${fiftCellArtifact}`);
            }
            catch (e) {
                console.log(`FATAL ERROR: 'fift' executable failed, is FIFTPATH env variable defined?`);
                process_1.default.exit(1);
            }
            // make sure cell build artifact was created
            if (!fs_1.default.existsSync(cellArtifact)) {
                console.log(` - For some reason '${cellArtifact}' was not created!`);
                process_1.default.exit(1);
            }
            else {
                console.log(` - Build artifact created '${cellArtifact}'`);
                fs_1.default.unlinkSync(fiftCellArtifact);
            }
        }
        console.log(``);
    });
}
main();
// helpers
function crc32(r) {
    for (var a, o = [], c = 0; c < 256; c++) {
        a = c;
        for (var f = 0; f < 8; f++)
            a = 1 & a ? 3988292384 ^ (a >>> 1) : a >>> 1;
        o[c] = a;
    }
    for (var n = -1, t = 0; t < r.length; t++)
        n = (n >>> 8) ^ o[255 & (n ^ r.charCodeAt(t))];
    return (-1 ^ n) >>> 0;
}
