"use strict";

const fs = require("fs-extra");
const path = require("path");

const compressing = require("compressing");
const showdown = require("showdown");
const replaceExt = require("replace-ext");
const highlight = require("highlight.js");
const decodeHTML = require("html-encoder-decoder").decode;

const pjson = require(path.join(__dirname, '..', 'package.json'));

// Regex's
let regexLink = /{\.link(\*?)((?::[^\s]+)*?)\s+([^|}]+)(?:\s+\|\s+([^}]+))?\s*}/g;
let regexInclude = /{\.include\s+([^}]*)\s*}/g;
let regexHeading = /{\.#([^}]*)\s*([^}]*)\s*}/g;
let regexVariable = /{\.(let)?\s+([^}\s]+)(\s+([^}]+)\s*|\s*}([\s\S]*?){\.\/let|)}/g;
let regexRaw = /{\.raw\s*}([\s\S]*?){\.\/raw}/g;

const builtInResourcePrefix = '-mark2html-resources';

function isBuiltinResource(filepath) {
    return filepath.slice(0, builtInResourcePrefix.length) == builtInResourcePrefix;
}

function resolveFile(filepath) {
    return filepath.replace(builtInResourcePrefix, path.join(__dirname, '../resources'));
}

function resolve(dir, filepath) {
    function tryFilepath(filepath) {
        if (fs.existsSync(resolveFile(filepath))) return filepath;
    }
    return tryFilepath(path.join(dir, filepath)) || tryFilepath(path.join(builtInResourcePrefix, filepath));
}

// Preprocessor to expand all file includes and resolve relative links
let preprocess = (function () {

    let filestack = [];

    function preprocess(file) {
        filestack.push(file);

        const dir = path.dirname(file);
        const resolvedFile = resolveFile(file);

        let text;

        // Dynamic content flag, require page rebuilding
        let dynamic = false;

        // Fetch raw text

        switch (path.extname(file)) {
            case ".js":
                text = require("./" + path.join(path.dirname(resolvedFile), path.basename(resolvedFile, ".js")))();
                dynamic = true;
                break;
            default:
                text = fs.readFileSync(resolvedFile, "utf8");
        }

        // Resolve relative links

        text = text.replace(regexLink, function (match, mode, modifiers, filepath, name) {
            return `{.link${mode}${modifiers} ${resolve(dir, filepath)}${name ? ` | ${name}` : ""}}`;
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
            const resolvedFile = resolveFile(file);

            console.log("Copying", file);

            let filepath = path.join(dist, isBuiltinResource(file) ? file : path.relative(base, file));
            let filedir = path.dirname(filepath);

            fs.ensureDirSync(filedir);

            fs.copySync(resolvedFile, filepath);

            return {
                src: file,
                dest: filepath,
                time: new Date().valueOf()
            };
        }

        // Preprocess the text
        // Build & link related documents

        console.log("Building", file);

        // Output path & dir
        let filepath = path.join(dist,
            path.relative(base, file === entry ? path.join(path.dirname(file), 'index.html') : replaceExt(file, ".html")));
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

        text = text.replace(regexLink, function (match, mode, modifiers, entry, name) {
            links.push(entry);

            let linkedFilepath = _build(entry, dist, base).dest;

            modifiers.split(":").slice(1).forEach((modifier) => {
                switch (modifier) {
                    case "zip":

                        let linkedZipFilepath = replaceExt(linkedFilepath, ".zip");

                        // TODO: Use async replace so the zipping error can be caught and passed down
                        console.log(`Zipping ${linkedFilepath} ~> ${linkedZipFilepath}`);
                        compressing.zip.compressDir(linkedFilepath, linkedZipFilepath)
                            .then(() => console.log(`Zipped ${linkedFilepath} ~> ${linkedZipFilepath}`))
                            .catch((error) => console.log(`Failed to zip ${linkedFilepath}:`, error));

                        linkedFilepath = linkedZipFilepath;

                        break;
                }
            });

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

        // Stamp versions

        html += `<!-- ${pjson.name}@${pjson.version} -->`

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

    fs.copySync(require.resolve("highlight.js/styles/atom-one-light.css"), path.join(__dirname, "../resources/assets/styles/atom-one-light.css"));

    _build(entry, dist, path.dirname(entry));
}

module.exports = build;
