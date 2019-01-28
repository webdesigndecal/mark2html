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
let regexLink = /{\.link([!\*]*)((?::[^\s]+)*?)\s+([^|}]+)(?:\s+\|\s+([^}]+))?\s*}/g;
let regexInclude = /{\.include\s+([^}]*)\s*}/g;
let regexHeading = /{\.#([^}]*)\s*([^}]*)\s*}/g;
let regexVariable = /{\.(let)?\s+([^}\s]+)(\s+([^}]+)\s*|\s*}([\s\S]*?){\.\/let|)}/g;
let regexRaw = /{\.raw\s*}([\s\S]*?){\.\/raw}/g;

const builtInResourcePrefix = '-mark2html-resources';

function isBuiltinResource(filepath) {
    return filepath.slice(0, builtInResourcePrefix.length) == builtInResourcePrefix;
}

function resolveFilepath(canonicalFilepath) {
    return canonicalFilepath.replace(builtInResourcePrefix, path.join(__dirname, '../resources'));
}

function getCanonicalFilepath(baseCanonicalFileDir, filepath) {
    function tryFilepath(filepath) {
        if (fs.existsSync(resolveFilepath(filepath))) return filepath;
    }
    return tryFilepath(path.join(baseCanonicalFileDir, filepath)) ||
        tryFilepath(path.join(builtInResourcePrefix, filepath));
}

// Preprocessor to expand all file includes and resolve relative links
let preprocess = (function () {

    let filestack = [];

    function preprocess(canonicalFilepath) {
        filestack.push(canonicalFilepath);

        const baseCanonicalFileDir = path.dirname(canonicalFilepath);
        const resolvedFilepath = resolveFilepath(canonicalFilepath);

        // Dynamic content flag, require page rebuilding
        let dynamic = false;

        let text = "";

        // Fetch raw text

        switch (path.extname(canonicalFilepath)) {
            case ".js":
                text = require(path.join(process.cwd(), resolvedFilepath))();
                dynamic = true;
                break;
            default:
                text = fs.readFileSync(resolvedFilepath, "utf8");
        }

        // Resolve relative links to canonical

        text = text.replace(regexLink, function (match, modes, modifiers, linkedFilepath, name) {
            const canonicalFilepath = getCanonicalFilepath(baseCanonicalFileDir, linkedFilepath);
            if (!canonicalFilepath) {
                // File not found, remove {.link}
                console.log("Preprocessor: File not found, skipped link to", linkedFilepath);
                return name;
            }
            return `{.link${modes}${modifiers} ${canonicalFilepath}${name ? ` | ${name}` : ""}}`;
        });

        // Include text fragments

        let includes = [];
        text = text.replace(regexInclude, function (match, includedFilepath) {
            const includedCanonicalFilepath = getCanonicalFilepath(baseCanonicalFileDir, includedFilepath);
            if (!includedCanonicalFilepath) {
                // File not found, skip including
                console.log("Preprocessor: File not found, skipped including", includedFilepath);
                return "";
            }

            console.log("Including", includedCanonicalFilepath);

            let preprocessed = preprocess(includedCanonicalFilepath);

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
function build(entry, destBaseDir) {
    function recursiveBuild(canonicalFilepath, needPreprocess = true) {
        if (!needPreprocess || preprocess.supportedExt.indexOf(path.extname(canonicalFilepath).toLowerCase()) < 0) {
            // Only preprocess & convert supported files
            const resolvedFilepath = resolveFilepath(canonicalFilepath);

            let destFilepath = path.join(destBaseDir,
                isBuiltinResource(canonicalFilepath) ? canonicalFilepath :
                path.relative(path.dirname(entry), canonicalFilepath));
            let destFileDir = path.dirname(destFilepath);

            console.log("Copying", canonicalFilepath, "->", destFilepath);

            fs.ensureDirSync(destFileDir);

            fs.copySync(resolvedFilepath, destFilepath);

            return {
                src: canonicalFilepath,
                dest: destFilepath,
                time: new Date().valueOf()
            };
        }

        // Preprocess the text
        // Build & link related documents

        // Output path & dir
        let destFilepath = path.join(destBaseDir,
            isBuiltinResource(canonicalFilepath) ? canonicalFilepath :
            path.relative(path.dirname(entry), canonicalFilepath === entry ? path.join(path.dirname(canonicalFilepath), 'index.html') : replaceExt(canonicalFilepath, ".html")));
        let destFileDir = path.dirname(destFilepath);

        console.log("Building", canonicalFilepath, "->", destFilepath);

        // Input text
        let preprocessed = preprocess(canonicalFilepath);
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

        text = text.replace(regexLink, function (match, modes, modifiers, linkedCanonicalFilepath, name) {
            links.push(linkedCanonicalFilepath);

            let linkedDestFilepath = recursiveBuild(linkedCanonicalFilepath, !modes.includes('!')).dest;

            modifiers.split(":").slice(1).forEach((modifier) => {
                switch (modifier) {
                    case "zip":

                        let linkedZipFilepath = replaceExt(linkedDestFilepath, ".zip");

                        // TODO: Use async replace so the zipping error can be caught and passed down
                        console.log(`Zipping ${linkedDestFilepath} ~> ${linkedZipFilepath}`);
                        compressing.zip.compressDir(linkedDestFilepath, linkedZipFilepath)
                            .then(() => console.log(`Zipped ${linkedDestFilepath} ~> ${linkedZipFilepath}`))
                            .catch((error) => console.log(`Failed to zip ${linkedDestFilepath}:`, error));

                        linkedDestFilepath = linkedZipFilepath;

                        break;
                }
            });

            let url = path.relative(
                destFileDir,
                path.basename(linkedDestFilepath) === "index.html"
                    ? path.dirname(linkedDestFilepath) // Avoid index.html
                    : linkedDestFilepath
            );

            if (modes.includes('*')) return url;
            return `[${name || url}](${url})`;
        });

        // Variables

        let variables = {};

        function handleTextVariables(text) {
            return text.replace(regexVariable, function (match, op, name, _, _value1, _value2) {
                const value = _value1 || _value2;
                switch (op) {
                    case "let":
                        variables[name] = value;
                        return "";
                    default:
                        return handleTextVariables(variables[name]);
                }
            });
        }

        text = handleTextVariables(text);

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

        fs.ensureDirSync(destFileDir);

        fs.writeFileSync(destFilepath, html);

        return {
            src: canonicalFilepath,
            dest: destFilepath,
            time: new Date().valueOf(),
            dynamic: preprocessed.dynamic,
            links,
            includes: preprocessed.includes
        };
    }

    fs.copySync(require.resolve("highlight.js/styles/atom-one-light.css"), path.join(__dirname, "../resources/assets/styles/atom-one-light.css"));

    recursiveBuild(entry);
}

module.exports = build;
