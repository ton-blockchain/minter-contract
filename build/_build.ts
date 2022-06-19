// This is a simple generic build script in TypeScript that should work for most projects without modification
// The script assumes that it is running from the repo root, and the directories are organized this way:
//  ./build/ - directory for build artifacts exists
//  ./contracts/*.fc - root contracts that are deployed separately are here
//  ./contracts/imports/*.fc - shared utility code that should be imported as compilation dependency is here
// if you need imports that are dedicated to one contract and aren't shared, place them in a directory with the contract name:
//  ./contracts/import/mycontract/*.fc

import fs from "fs";
import path from "path";
import process from "process";
import child_process from "child_process";
import glob from "fast-glob";
import { Cell } from "ton";
import semver from "semver";

async function main() {
  console.log("=================================================================");
  console.log("Build script running, let's find some FunC contracts to compile..");

  // if we have an explicit bin directory, use the executables there (needed for glitch.com)
  if (fs.existsSync("bin")) {
    process.env.PATH = path.join(__dirname, "..", "bin") + path.delimiter + process.env.PATH;
    process.env.FIFTPATH = path.join(__dirname, "..", "bin", "fiftlib");
  }

  // make sure func compiler is available
  const minSupportFunc = "0.2.0";
  try {
    const funcVersion = child_process
      .execSync("func -V")
      .toString()
      .match(/semantic version: v([0-9.]+)/)?.[1];
    if (!semver.gte(semver.coerce(funcVersion) ?? "", minSupportFunc)) throw new Error("Nonexistent version or outdated");
  } catch (e) {
    console.log(`\nFATAL ERROR: 'func' with version >= ${minSupportFunc} executable is not found, is it installed and in path?`);
    process.exit(1);
  }

  // make sure fift cli is available
  let fiftVersion = "";
  try {
    fiftVersion = child_process.execSync("fift -V").toString();
  } catch (e) {}
  if (!fiftVersion.includes("Fift build information")) {
    console.log("\nFATAL ERROR: 'fift' executable is not found, is it installed and in path?");
    process.exit(1);
  }

  // go over all the root contracts in the contracts directory
  const rootContracts = glob.sync(["contracts/*.fc", "contracts/*.func"]);
  for (const rootContract of rootContracts) {
    // compile a new root contract
    console.log(`\n* Found root contract '${rootContract}' - let's compile it:`);
    const contractName = path.parse(rootContract).name;

    // delete existing build artifacts
    const fiftArtifact = `build/${contractName}.fif`;
    if (fs.existsSync(fiftArtifact)) {
      console.log(` - Deleting old build artifact '${fiftArtifact}'`);
      fs.unlinkSync(fiftArtifact);
    }
    const mergedFuncArtifact = `build/${contractName}.merged.fc`;
    if (fs.existsSync(mergedFuncArtifact)) {
      console.log(` - Deleting old build artifact '${mergedFuncArtifact}'`);
      fs.unlinkSync(mergedFuncArtifact);
    }
    const fiftCellArtifact = `build/${contractName}.cell.fif`;
    if (fs.existsSync(fiftCellArtifact)) {
      console.log(` - Deleting old build artifact '${fiftCellArtifact}'`);
      fs.unlinkSync(fiftCellArtifact);
    }
    const cellArtifact = `build/${contractName}.cell`;
    if (fs.existsSync(cellArtifact)) {
      console.log(` - Deleting old build artifact '${cellArtifact}'`);
      fs.unlinkSync(cellArtifact);
    }
    const hexArtifact = `build/${contractName}.compiled.json`;
    if (fs.existsSync(hexArtifact)) {
      console.log(` - Deleting old build artifact '${hexArtifact}'`);
      fs.unlinkSync(hexArtifact);
    }

    // check if we have a tlb file
    const tlbFile = `contracts/${contractName}.tlb`;
    if (fs.existsSync(tlbFile)) {
      console.log(` - TL-B file '${tlbFile}' found, calculating crc32 on all ops..`);
      const tlbContent = fs.readFileSync(tlbFile).toString();
      const tlbOpMessages = tlbContent.match(/^(\w+).*=\s*InternalMsgBody$/gm) ?? [];
      for (const tlbOpMessage of tlbOpMessages) {
        const crc = crc32(tlbOpMessage);
        const asQuery = `0x${(crc & 0x7fffffff).toString(16)}`;
        const asResponse = `0x${((crc | 0x80000000) >>> 0).toString(16)}`;
        console.log(`   op '${tlbOpMessage.split(" ")[0]}': '${asQuery}' as query (&0x7fffffff), '${asResponse}' as response (|0x80000000)`);
      }
    } else {
      console.log(` - Warning: TL-B file for contract '${tlbFile}' not found, are your op consts according to standard?`);
    }

    // run the func compiler to create a fif file
    console.log(` - Trying to compile '${rootContract}' with 'func' compiler..`);
    let buildErrors: string;
    try {
      buildErrors = child_process.execSync(`func -APS -o build/${contractName}.fif ${rootContract} 2>&1 1>node_modules/.tmpfunc`).toString();
    } catch (e) {
      buildErrors = e.stdout.toString();
    }
    if (buildErrors.length > 0) {
      console.log(" - OH NO! Compilation Errors! The compiler output was:");
      console.log(`\n${buildErrors}`);
      process.exit(1);
    } else {
      console.log(" - Compilation successful!");
    }

    // make sure fif build artifact was created
    if (!fs.existsSync(fiftArtifact)) {
      console.log(` - For some reason '${fiftArtifact}' was not created!`);
      process.exit(1);
    } else {
      console.log(` - Build artifact created '${fiftArtifact}'`);
    }

    // create a temp cell.fif that will generate the cell
    let fiftCellSource = '"Asm.fif" include\n';
    fiftCellSource += `${fs.readFileSync(fiftArtifact).toString()}\n`;
    fiftCellSource += `boc>B "${cellArtifact}" B>file`;
    fs.writeFileSync(fiftCellArtifact, fiftCellSource);

    // run fift cli to create the cell
    try {
      child_process.execSync(`fift ${fiftCellArtifact}`);
    } catch (e) {
      console.log("FATAL ERROR: 'fift' executable failed, is FIFTPATH env variable defined?");
      process.exit(1);
    }

    // Remove intermediary
    fs.unlinkSync(fiftCellArtifact);

    // make sure cell build artifact was created
    if (!fs.existsSync(cellArtifact)) {
      console.log(` - For some reason '${cellArtifact}' was not created!`);
      process.exit(1);
    } else {
      console.log(` - Build artifact created '${cellArtifact}'`);
    }

    fs.writeFileSync(
      hexArtifact,
      JSON.stringify({
        hex: Cell.fromBoc(fs.readFileSync(cellArtifact))[0].toBoc().toString("hex"),
      })
    );

    // Remove intermediary
    fs.unlinkSync(cellArtifact);

    // make sure hex artifact was created
    if (!fs.existsSync(hexArtifact)) {
      console.log(` - For some reason '${hexArtifact}' was not created!`);
      process.exit(1);
    } else {
      console.log(` - Build artifact created '${hexArtifact}'`);
    }
  }

  console.log("");
}

main();

// helpers

function crc32(r: string) {
  for (var a, o = [], c = 0; c < 256; c++) {
    a = c;
    for (let f = 0; f < 8; f++) a = 1 & a ? 3988292384 ^ (a >>> 1) : a >>> 1;
    o[c] = a;
  }
  for (var n = -1, t = 0; t < r.length; t++) n = (n >>> 8) ^ o[255 & (n ^ r.charCodeAt(t))];
  return (-1 ^ n) >>> 0;
}
