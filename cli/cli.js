"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const program = new commander_1.Command();
program
    .name('jetton-deployer')
    .description('CLI to create jettons')
    .version('0.0.1');
program.command('deploy')
    .description('Deploys a new jetton')
    .argument('<string>', 'jetton name')
    //   .option('--first', 'display just the first substring')
    //   .option('-s, --separator <char>', 'separator character', ',')
    .action((str, options) => {
    const limit = options.first ? 1 : undefined;
    console.log(str.split(options.separator, limit));
});
program.parse();
