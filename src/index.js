"use strict";

const fs = require("fs-extra");
const path = require("path");

const showdown = require("showdown");
const replaceExt = require("replace-ext");
const highlight = require("highlight.js");
const decodeHTML = require("html-encoder-decoder").decode;

// Regex's
let regexLink = /{\.link(\*?)\s+([^|}]+)(?:\s+\|\s+([^}]+))?\s*}/g;
let regexInclude = /{\.include\s+([^}]*)\s*}/g;
let regexHeading = /{\.#([^}]*)\s*([^}]*)\s*}/g;
let regexVariable = /{\.(let)?\s+([^}\s]+)(\s+([^}]+)\s*|\s*}([\s\S]*?){\.\/let|)}/g;
let regexRaw = /{\.raw\s*}([\s\S]*?){\.\/raw}/g;

function resolve(dir, filepath) {
    function tryFilepath(filepath) {
        if (fs.existsSync(filepath)) return filepath;
    }
    return tryFilepath(path.join(dir, filepath)) || tryFilepath(path.join(__dirname, "../resources", filepath));
}

// Preprocessor to expand all file includes and resolve relative links
let preprocess = (function () {

    let filestack = [];

    function preprocess(file) {
        filestack.push(file);

        let dir = path.dirname(file);
        let text;

        // Dynamic content flag, require page rebuilding
        let dynamic = false;

        // Fetch raw text

        switch (path.extname(file)) {
            case ".js":
                text = require("./" + path.join(path.dirname(file), path.basename(file, ".js")))();
                dynamic = true;
                break;
            default:
                text = fs.readFileSync(file, "utf8");
        }

        // Resolve relative links

        text = text.replace(regexLink, function (match, mode, filepath, name) {
            return `{.link${mode} ${resolve(dir, filepath)}${name ? ` | ${name}` : ""}}`;
        });

        // Include text fragments

        let includes = [];
        text = text.replace(regexInclude, function (match, filepath) {
            filepath = resolve(dir, filepath);

            includes.push(filepath);

            console.log("Including", filepath);

            let preprocessed = preprocess(filepath);

            // Propagate dynamic content flag
            if (preprocessed.dynamic) dynamic = true;
            // Flatten included fragments
            includes.push(...preprocessed.includes);

            return preprocessed.text;
        });

        filestack.pop();

        return {
            text,
            dynamic,
            includes
        };
    }

    preprocess.supportedExt = [".md", ".js"];

    return preprocess;
})();

// Universally used converter
let converter = new showdown.Converter();
converter.setFlavor("github");

// Function to build a Markdown file
function build(entry, dist) {
    function _build(file, dist, base) {
        if (preprocess.supportedExt.indexOf(path.extname(file).toLowerCase()) < 0) {
            // Only preprocess & convert supported files

            console.log("Copying", file);

            let filepath = path.join(dist, path.relative(base, file));
            let filedir = path.dirname(filepath);

            fs.ensureDirSync(filedir);

            fs.copySync(file, filepath);

            return {
                src: file,
                dest: filepath,
                time: new Date().valueOf()
            };
        }

        // Preprocess the text
        // Build & link related documents

        console.log("Building", file);

        // Input dir
        let dir = path.dirname(file);

        // Output path & dir
        let filepath = path.join(dist, path.relative(base, replaceExt(file, ".html")));
        let filedir = path.dirname(filepath);

        // Input text
        let preprocessed = preprocess(file);
        let text = preprocessed.text;

        // Headings

        let headinglevel = 1;

        function makeHeading(headinglevel, heading) {
            return headinglevel >= 1 && headinglevel <= 6
                ? ("#".repeat(headinglevel) + (heading ? ` ${heading}` : ""))
                : "";
        }

        text = text.replace(regexHeading, function (match, op, heading) {
            switch (op) {
                case "++": ++headinglevel; break;
                case "--": --headinglevel; break;
                case "+": return makeHeading(headinglevel + 1, heading);
                case "-": return makeHeading(headinglevel - 1, heading);
                default: return makeHeading(headinglevel, heading);
            }
            return "";
        });

        // Links

        let links = [];

        text = text.replace(regexLink, function (match, mode, entry, name) {
            links.push(entry);

            let linkedFilepath = _build(entry, dist, base).dest;

            let url = path.relative(
                filedir,
                path.basename(linkedFilepath) === "index.html"
                    ? path.dirname(linkedFilepath) // Avoid index.html
                    : linkedFilepath
            );

            if (mode === '*') return url;
            return `[${name || url}](${url})`;
        });

        // Variables

        let variables = {};

        text = text.replace(regexVariable, function (match, op, name, _, _value1, _value2) {
            const value = _value1 || _value2;
            switch (op) {
                case "let":
                    variables[name] = value;
                    return "";
                default:
                    return variables[name];
            }
        });

        // Save raw

        let raws = [];

        text = text.replace(regexRaw, function (match, raw) {
            return `<div data-raw>${raws.push(raw) - 1}</div>`;
        });

        // Convert Markdown to HTML

        let html = converter.makeHtml(text);

        // Load raw back

        html = html.replace(/<div data-raw>(\d+)<\/div>/g, function (match, i) {
            return raws[i];
        });

        // Code coloring

        // Code adapted from: https://github.com/Bloggify/showdown-highlight
        html = showdown.helper.replaceRecursiveRegExp(html, function (wholeMatch, match, left, right) {
            match = decodeHTML(match);
            return left + highlight.highlightAuto(match).value + right;
        }, "<pre><code\\b[^>]*>", "</code></pre>", "g");

        // Editable code

        html = html.replace(/_{10}/g, function (match) {
            return `<span contenteditable spellcheck="false"></span>`;
        });

        // Save the generated HTML

        fs.ensureDirSync(filedir);

        fs.writeFileSync(filepath, html);

        return {
            src: file,
            dest: filepath,
            time: new Date().valueOf(),
            dynamic: preprocessed.dynamic,
            links,
            includes: preprocessed.includes
        };
    }

    _build(entry, dist, path.dirname(entry));

    fs.copySync(require.resolve("highlight.js/styles/atom-one-light.css"), path.join(dist, "assets/styles/atom-one-light.css"));
    fs.copySync(path.join(__dirname, "../resources/assets"), path.join(dist, "assets"));
}

module.exports = build;
