// This is a simple generic build script in TypeScript that should work for most projects without modification
// It assumes that it is running from the repo root, and the directories are organized this way:
//  ./build/ - directory for build artifacts exists
//  ./contracts/*.fc - root contracts that are deployed separately are here
//  ./contracts/lib/*.fc - utility code that should be imported as compilation dependency is here

import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import * as child_process from "child_process";
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

const rootContracts = fg.sync(["contracts/*.fc", "contracts/*.func"]);
for (const rootContract of rootContracts) {
  // compile a new file
  console.log(`\n* Found root contract '${rootContract}' - let's compile it:`);
  const contractName = path.parse(rootContract).name;

  // delete existing build artifacts
  if (fs.existsSync(`build/${contractName}.fif`)) {
    console.log(` - Deleting old build artifact 'build/${contractName}.fif'`);
    fs.unlinkSync(`build/${contractName}.fif`);
  }

  // create one string with all source code from all merged files
  let sourceToCompile = "";
  const importFiles = fg.sync(["contracts/lib/**/*.fc", "contracts/lib/**/*.func"]);
  for (const importFile of importFiles) {
    console.log(` - Adding import '${importFile}'`);
    sourceToCompile += `${fs.readFileSync(importFile).toString()}\n`;
  }
  console.log(` - Adding the contract itself '${rootContract}'`);
  sourceToCompile += `${fs.readFileSync(rootContract).toString()}\n`;

  // debug - uncomment the next line if you can't understand weird compilation errors
  // fs.writeFileSync(`build/${contractName}.merged.fc`, sourceToCompile);

  // run the compiler
  console.log(` - Trying to compile with 'func' compiler..`);
  const buildErrors = child_process.execSync(`func -APSI -o build/${contractName}.fif 2>&1`, { input: sourceToCompile }).toString();
  if (buildErrors.length > 0) {
    console.log(` - OH NO! Compilation Errors! The compiler output was:`);
    console.log(`\n${buildErrors}`);
    process.exit(1);
  } else {
    console.log(` - Compilation successful!`);
  }

  // make sure build artifact was created
  if (!fs.existsSync(`build/${contractName}.fif`)) {
    console.log(` - For some reason 'build/${contractName}.fif' was not created!`);
    process.exit(1);
  } else {
    console.log(` - Build artifact created 'build/${contractName}.fif'`);
  }
}

console.log(``);
