// This is a simple generic build script in TypeScript that should work for most projects without modification
// It assumes that it is running from the repo root, and the directories are organized this way:
//  ./build/ - directory for build artifacts exists
//  ./contracts/*.fc - root contracts that are deployed separately are here
//  ./contracts/imports/*.fc - utility code that should be imported as compilation dependency is here

import fs from "fs";
import path from "path";
import process from "process";
import child_process from "child_process";
import fg from "fast-glob";

console.log(`=================================================================`);
console.log(`Build script running, let's find some FunC contracts to compile..`);

// make sure func compiler is available
let funcVersion = "";
try {
  funcVersion = child_process.execSync("func -V").toString();
} catch (e) {}
if (!funcVersion.includes(`Func build information`)) {
  console.log(`\nFATAL ERROR: 'func' executable is not found, is it installed and in path?`);
  process.exit(1);
}

// make sure fift cli is available
let fiftVersion = "";
try {
  fiftVersion = child_process.execSync("fift -V").toString();
} catch (e) {}
if (!fiftVersion.includes(`Fift build information`)) {
  console.log(`\nFATAL ERROR: 'fift' executable is not found, is it installed and in path?`);
  process.exit(1);
}

const rootContracts = fg.sync(["contracts/*.fc", "contracts/*.func"]);
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

  // create a merged fc file with source code from all dependencies
  let sourceToCompile = "";
  const importFiles = fg.sync(["contracts/imports/**/*.fc", "contracts/imports/**/*.func"]);
  for (const importFile of importFiles) {
    console.log(` - Adding import '${importFile}'`);
    sourceToCompile += `${fs.readFileSync(importFile).toString()}\n`;
  }
  console.log(` - Adding the contract itself '${rootContract}'`);
  sourceToCompile += `${fs.readFileSync(rootContract).toString()}\n`;
  fs.writeFileSync(mergedFuncArtifact, sourceToCompile);
  console.log(` - Build artifact created '${mergedFuncArtifact}'`);

  // run the func compiler to create a fif file
  console.log(` - Trying to compile '${mergedFuncArtifact}' with 'func' compiler..`);
  const buildErrors = child_process.execSync(`func -APS -o build/${contractName}.fif ${mergedFuncArtifact} 2>&1 >&-`).toString();
  if (buildErrors.length > 0) {
    console.log(` - OH NO! Compilation Errors! The compiler output was:`);
    console.log(`\n${buildErrors}`);
    process.exit(1);
  } else {
    console.log(` - Compilation successful!`);
  }

  // make sure fif build artifact was created
  if (!fs.existsSync(fiftArtifact)) {
    console.log(` - For some reason '${fiftArtifact}' was not created!`);
    process.exit(1);
  } else {
    console.log(` - Build artifact created '${fiftArtifact}'`);
  }

  // create a temp cell.fif that will generate the cell
  let fiftCellSource = `"Asm.fif" include\n`;
  fiftCellSource += `${fs.readFileSync(fiftArtifact).toString()}\n`;
  fiftCellSource += `boc>B "${cellArtifact}" B>file`;
  fs.writeFileSync(fiftCellArtifact, fiftCellSource);

  // run fift cli to create the cell
  try {
    child_process.execSync(`fift ${fiftCellArtifact}`);
  } catch (e) {
    console.log(`FATAL ERROR: 'fift' executable failed, is FIFTPATH env variable defined?`);
    process.exit(1);
  }

  // make sure cell build artifact was created
  if (!fs.existsSync(cellArtifact)) {
    console.log(` - For some reason '${cellArtifact}' was not created!`);
    process.exit(1);
  } else {
    console.log(` - Build artifact created '${cellArtifact}'`);
    fs.unlinkSync(fiftCellArtifact);
  }
}

console.log(``);
