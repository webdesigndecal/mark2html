#!/usr/bin/env node

"use strict";

const replaceExt = require("replace-ext");

const build = require("../src/index.js");

const args = process.argv.slice(2);

if (args.length != 1) {
    console.log("Usage: mark2html text.md");
    process.exit(0);
}

build(args[0], replaceExt(args[0], "_dist"));
