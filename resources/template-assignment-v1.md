{.raw}
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>{. assignment-title}</title>
    <link rel="stylesheet" type="text/css" href="{.link* assets/styles/atom-one-light.css}">
    <link rel="stylesheet" type="text/css" href="{.link* assets/styles/style.css}">
</head>
<body>
    <div id="container">
        <div id="header">
            <div id="header-caption">
                <img id="header-caption-logo" src="{.link* assets/images/logo.png}">
                <div id="header-caption-name">Web Design DeCal</div>
            </div>
            <div id="header-content">
                <div id="header-title">{. assignment-title}</div>
                <div id="header-due">{. assignment-due}</div>
            </div>
        </div>
        <div class="section">
            <div class="block block-highlight">
{./raw}

                {. assignment-intro}

{.raw}
            </div>
{./raw}

{. body}

{.raw}
        </div>
        <div class="section explorer">
            <h2>{. explorer-title}</h2>
            <div class="block block-highlight">
                <p>{. explorer-preface}</p>
                <input id="explorer-toggle" type="checkbox"/>
                <label for="explorer-toggle" class="btn">{. explorer-open}</label>
                <p></p>
                <div class="block block-unhighlight explorer-text">
{./raw}

{. explorer-footnotes}

{.raw}
                </div>
            </div>
        </div>
        <div class="section">
            <h2>Submission</h2>
            <div class="block block-highlight">
{./raw}

{. submission}

{.raw}
            </div>
        </div>
    </div>
</body>
</html>
{./raw}
