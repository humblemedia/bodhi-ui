#!/usr/bin/env node

/**
 * Bodhi CLI
 *
 * Commands:
 *   bodhi init                    Scaffold a Bodhi project
 *   bodhi lint [files...]         Run design ethics linting
 *   bodhi token compile [file]    Compile Rūpa tokens to CSS
 *   bodhi report [files...]       Generate marker violation report
 */

import { Command } from 'commander';
import { init } from './commands/init.js';
import { lint } from './commands/lint.js';
import { tokenCompile } from './commands/token.js';
import { report } from './commands/report.js';

const program = new Command();

program
  .name('bodhi')
  .description('Design ethics enforcement for the web')
  .version('0.1.0');

program
  .command('init')
  .description('Scaffold a Bodhi project with config and default brand Rūpa')
  .option('-d, --dir <path>', 'Target directory', '.')
  .action(init);

program
  .command('lint')
  .description('Run the nine design ethics markers against your code')
  .argument('[files...]', 'Files or globs to lint', ['src/**/*.jsx', 'src/**/*.tsx'])
  .option('-m, --mode <mode>', 'Enforcement mode: dogmatic or lenient', 'dogmatic')
  .option('-i, --interface <mode>', 'Message mode: poetic, semantic, or raw', 'poetic')
  .option('--fix', 'Automatically fix problems where possible')
  .action(lint);

program
  .command('token')
  .description('Token operations')
  .command('compile')
  .description('Compile a brand Rūpa file to CSS custom properties')
  .argument('[file]', 'Path to brand Rūpa JSON file', 'bodhi.rupa.json')
  .option('-o, --output <path>', 'Output CSS file path', 'bodhi-tokens.css')
  .option('--verbose', 'Show poetic token resolution details')
  .action(tokenCompile);

program
  .command('report')
  .description('Generate a full marker violation report')
  .argument('[files...]', 'Files or globs to scan', ['src/**/*.jsx', 'src/**/*.tsx'])
  .option('-f, --format <format>', 'Report format: text, json, or html', 'text')
  .option('-o, --output <path>', 'Output file path (stdout if omitted)')
  .action(report);

program.parse();
