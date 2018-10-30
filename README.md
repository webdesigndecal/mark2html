A quick way to generate basic websites with your markdowns

# Usage

Your markdowns stay the same. Here are some exciting macros to enhance your experience,

## Including

```
{.include relative/path/to/src/file}
```

The text from another file will be injected in the page. The file will be searched relative to the markdown file or relative to the build-in resources directory.

## File linking

```
{.link relative/path/to/src/file}
{.link relative/path/to/src/file | optional-text}
```

The file will be **copied** to the output directory & the markdown will be generated `[relative/path/to/dist/file](optional-text)`.

Since the syntax for image embedding is `![relative/path/to/src/image](alt-text)`, we can similarly embed the image with the macro,

```
!{.link relative/path/to/src/image | alt-text}
```

## Variables

To set a variable,

```
{.let variable value}
{.let variable}value{./let}
{.let variable}
<!-- Value can span multiple lines -->
{./let}
```

To inject a variable value

```
{. variable}
```

A powerful action is that you may set the value of a variable as a range of markdown text and replay that range of text with injection.

## Raw

```
{.raw}
<!-- Some HTML -->
{./raw}
```

Some of your text will be pruned while it's transformed into HTML. Wrapping your text with `{.raw}` will preserve its content. When writing some template, you would want to wrap `<!doctype>`, `<head>`, `<body>` with `{.raw}`.

# Development

After cloning the repo, run `npm install`.

You may find some samples demoing the features under `examples/`. To generate a website, run `bin/cli.js path/to/markdown.md`; running `bin/cli.js examples/assignment-sample/instructions.md` will generate a website placed in the file's directory `examples/assignment-sample/instructions_dist/`.
