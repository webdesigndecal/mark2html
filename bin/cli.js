#!/usr/bin/env node

"use strict";

const replaceExt = require("replace-ext");

const build = require("../src/index.js");

const args = process.argv.slice(2);

if (args.length < 1) {
    console.log("Usage: mark2html text.md [output-dir]");
    process.exit(0);
}

build(args[0], args[1] ? args[1] : replaceExt(args[0], "-mark2html-output"));
