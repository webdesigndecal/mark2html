{.raw}
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>{. assignment-title}</title>
    <link rel="stylesheet" type="text/css" href="assets/styles/atom-one-light.css">
    <link rel="stylesheet" type="text/css" href="assets/styles/style.css">
</head>
<body>
    <div id="container">
        <div id="header">
            <div id="header-caption">
                <img id="header-caption-logo" src="assets/images/logo.png">
                <div id="header-caption-name">Web Design DeCal</div>
            </div>
            <div id="header-content">
                <div id="header-title">{. assignment-title}</div>
                <div id="header-due">{. assignment-due}</div>
            </div>
        </div>
        <div class="section">
            <div class="block-highlight">
{./raw}

                {. assignment-intro}

{.raw}
            </div>
{./raw}

{. body}

{.raw}
        </div>
        <div class="section">
            <h2>Submission</h2>
            <div class="block-highlight">
{./raw}

{. submission}

{.raw}
            </div>
        </div>
    </div>
</body>
</html>
{./raw}
