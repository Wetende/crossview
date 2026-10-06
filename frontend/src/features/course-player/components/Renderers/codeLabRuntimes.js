/**
 * Browser runtimes for Code Lab languages.
 *
 * Every runnable language is executed inside a sandboxed iframe built from a
 * srcdoc string. Nothing runs on the server: the host only serves the page and
 * the browser fetches interpreters from a CDN, which keeps shared hosting safe.
 *
 *   html_css_js  rendered directly, console captured
 *   javascript   wrapped in an HTML shell, console captured
 *   react        JSX transpiled in the iframe by Babel standalone, React from esm.sh
 *   python       CPython compiled to WebAssembly (Pyodide) from jsDelivr
 *
 * Keep LANG_LABELS in sync with the builder's LANGUAGE_CONFIG.
 */

export const PYODIDE_VERSION = "314.0.7";
export const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const REACT_VERSION = "19.1.0";
export const BABEL_STANDALONE_URL =
    "https://cdn.jsdelivr.net/npm/@babel/standalone@7.29.9/babel.min.js";

export const LANG_LABELS = {
    html_css_js: "HTML / CSS / JS",
    javascript: "JavaScript",
    react: "React",
    python: "Python",
    java: "Java",
    c_cpp: "C / C++",
};

export const BROWSER_RUNNABLE_LANGUAGES = new Set([
    "html_css_js",
    "javascript",
    "react",
    "python",
]);

export const isBrowserRunnable = (language) =>
    BROWSER_RUNNABLE_LANGUAGES.has(language);

/**
 * Serialise student code as a JS string literal that is safe to inline in a
 * <script> element: "<" is escaped so "</script>" and "<!--" cannot break out.
 */
export const toScriptLiteral = (code) =>
    JSON.stringify(String(code ?? "")).replace(/</g, "\\u003c");

const CONSOLE_CAPTURE = `
<script>
(function() {
    var _origLog = console.log;
    var _origWarn = console.warn;
    var _origError = console.error;
    function send(level, args) {
        try {
            window.parent.postMessage({
                type: 'console',
                level: level,
                data: Array.from(args).map(function(a) {
                    if (typeof a === 'object') return JSON.stringify(a, null, 2);
                    return String(a);
                }).join(' ')
            }, '*');
        } catch(e) {}
    }
    console.log = function() { send('log', arguments); _origLog.apply(console, arguments); };
    console.warn = function() { send('warn', arguments); _origWarn.apply(console, arguments); };
    console.error = function() { send('error', arguments); _origError.apply(console, arguments); };
    window.addEventListener('error', function(e) {
        send('error', [e.message + ' (line ' + e.lineno + ')']);
    });
})();
</script>`;

const DARK_SHELL_STYLE = `
    body { font-family: monospace; padding: 1rem; background: #1e1e1e; color: #d4d4d4; white-space: pre-wrap; }
    #status { color: #888; font-family: sans-serif; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .err { color: #f44336; }
    .warn { color: #ff9800; }`;

/** Shared output helper: appends to #output and mirrors to the parent console. */
const OUTPUT_HELPER = `
    var outputEl = document.getElementById('output');
    function send(level, text) {
        var line = document.createElement('div');
        if (level === 'error') line.className = 'err';
        if (level === 'warn') line.className = 'warn';
        line.textContent = text;
        outputEl.appendChild(line);
        try {
            window.parent.postMessage({ type: 'console', level: level, data: text }, '*');
        } catch (e) {}
    }
    var _origLog = console.log;
    console.log = function() { send('log', Array.from(arguments).map(String).join(' ')); _origLog.apply(console, arguments); };
    console.warn = function() { send('warn', Array.from(arguments).map(String).join(' ')); };
    console.error = function() { send('error', Array.from(arguments).map(String).join(' ')); };
    window.addEventListener('error', function(e) {
        send('error', e.message + (e.lineno ? ' (line ' + e.lineno + ')' : ''));
    });
    window.addEventListener('unhandledrejection', function(e) {
        send('error', String(e.reason && e.reason.message ? e.reason.message : e.reason));
    });`;

const buildHtmlSrcdoc = (code) => {
    if (code.includes("<head>")) {
        return code.replace("<head>", "<head>" + CONSOLE_CAPTURE);
    }
    return CONSOLE_CAPTURE + code;
};

const buildJavascriptSrcdoc = (code) => `<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: monospace; padding: 1rem; background: #1e1e1e; color: #d4d4d4; white-space: pre-wrap; }
</style>
<script>
(function() {
    var output = [];
    var _origLog = console.log;
    function send(level, args) {
        var text = Array.from(args).map(function(a) {
            if (typeof a === 'object') return JSON.stringify(a, null, 2);
            return String(a);
        }).join(' ');
        output.push(text);
        document.getElementById('output').textContent = output.join('\\n');
        try {
            window.parent.postMessage({ type: 'console', level: level, data: text }, '*');
        } catch(e) {}
    }
    console.log = function() { send('log', arguments); _origLog.apply(console, arguments); };
    console.warn = function() { send('warn', arguments); };
    console.error = function() { send('error', arguments); };
    window.addEventListener('error', function(e) {
        send('error', [e.message + ' (line ' + e.lineno + ')']);
    });
})();
</script>
</head>
<body>
<div id="output"></div>
<script>
${code}
</script>
</body>
</html>`;

/**
 * Python runs on Pyodide. The interpreter is fetched from jsDelivr on first
 * run and served from the browser cache afterwards. stdout/stderr stream to
 * the output pane and the parent console; input() uses window.prompt, so the
 * iframe needs the allow-modals sandbox flag.
 */
const buildPythonSrcdoc = (code) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${DARK_SHELL_STYLE}</style>
<script src="${PYODIDE_BASE_URL}pyodide.js"></script>
</head>
<body>
<div id="status">Loading Python runtime… the first run downloads the interpreter, later runs are quicker.</div>
<div id="output"></div>
<script>
(function() {
    ${OUTPUT_HELPER}
    var statusEl = document.getElementById('status');
    var source = ${toScriptLiteral(code)};

    function trimTraceback(message) {
        var lines = String(message || '').split('\\n');
        var start = -1;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].indexOf('File "<exec>"') !== -1) start = i;
        }
        if (start === -1) return lines.join('\\n');
        return ['Traceback (most recent call last):'].concat(lines.slice(start)).join('\\n');
    }

    async function main() {
        if (typeof loadPyodide !== 'function') {
            statusEl.textContent = '';
            send('error', 'Could not load the Python runtime. Check your internet connection and run again.');
            return;
        }
        try {
            var pyodide = await loadPyodide({ indexURL: ${JSON.stringify(PYODIDE_BASE_URL)} });
            pyodide.setStdout({ batched: function(line) { send('log', line); } });
            pyodide.setStderr({ batched: function(line) { send('error', line); } });
            statusEl.textContent = '';
            await pyodide.runPythonAsync(source);
            statusEl.textContent = 'Finished.';
        } catch (e) {
            statusEl.textContent = '';
            send('error', trimTraceback(e && e.message ? e.message : e));
        }
    }
    main();
})();
</script>
</body>
</html>`;

/**
 * React runs the student's JSX through Babel standalone inside the iframe.
 * React itself is loaded as ES modules from esm.sh. Students may either rely
 * on the React globals and hooks that are already in scope, or write normal
 * imports from "react" and "react-dom/client". A component named App (or a
 * default export) is mounted automatically unless the code mounts its own root.
 */
const buildReactSrcdoc = (code) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    body { font-family: sans-serif; margin: 0; padding: 1rem; background: #fff; color: #111; }
    #status { color: #888; font-size: 0.85rem; margin-bottom: 0.5rem; }
    #output { font-family: monospace; white-space: pre-wrap; font-size: 0.85rem; }
    #output .err { color: #d32f2f; }
    #output .warn { color: #ef6c00; }
</style>
<script src="${BABEL_STANDALONE_URL}"></script>
</head>
<body>
<div id="status">Loading React…</div>
<div id="root"></div>
<div id="output"></div>
<script type="module">
    import * as ReactNS from "https://esm.sh/react@${REACT_VERSION}";
    import * as ReactDOMNS from "https://esm.sh/react-dom@${REACT_VERSION}?deps=react@${REACT_VERSION}";
    import * as ClientNS from "https://esm.sh/react-dom@${REACT_VERSION}/client?deps=react@${REACT_VERSION}";
    ${OUTPUT_HELPER}

    var statusEl = document.getElementById('status');
    var rootEl = document.getElementById('root');
    var source = ${toScriptLiteral(code)};

    var React = ReactNS.default || ReactNS;
    var studentMounted = false;
    function asModule(ns) {
        return Object.assign({}, ns, { default: ns.default || ns, __esModule: true });
    }
    var reactModule = asModule(ReactNS);
    var clientModule = asModule(ClientNS);
    clientModule.createRoot = function() {
        studentMounted = true;
        return ClientNS.createRoot.apply(ClientNS, arguments);
    };
    clientModule.default = clientModule;
    var modules = {
        'react': reactModule,
        'react-dom': asModule(ReactDOMNS),
        'react-dom/client': clientModule,
    };
    function require(name) {
        if (Object.prototype.hasOwnProperty.call(modules, name)) return modules[name];
        throw new Error('Only "react", "react-dom" and "react-dom/client" can be imported in this lab (tried "' + name + '").');
    }

    try {
        if (typeof Babel === 'undefined') {
            throw new Error('Could not load the JSX compiler. Check your internet connection and run again.');
        }
        var compiled = Babel.transform(source, {
            presets: [['react', { runtime: 'classic' }]],
            plugins: ['transform-modules-commonjs'],
            filename: 'App.jsx',
            sourceType: 'module',
        }).code;
        var hookNames = ['useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useReducer', 'useContext', 'createContext', 'Fragment'];
        var prelude = 'const { ' + hookNames.join(', ') + ' } = React;\\n';
        var body = prelude +
            'return (function () {\\n' + compiled + '\\n' +
            ';if (typeof App !== "undefined" && module.exports.default === undefined) { module.exports.default = App; }\\n' +
            '})();';
        var moduleRecord = { exports: {} };
        var run = new Function('React', 'require', 'module', 'exports', 'createRoot', body);
        run(React, require, moduleRecord, moduleRecord.exports, clientModule.createRoot);
        statusEl.textContent = '';
        var App = moduleRecord.exports.default;
        if (!studentMounted) {
            if (typeof App === 'function') {
                ClientNS.createRoot(rootEl).render(React.createElement(App));
            } else {
                send('warn', 'Define a component named App (or export default one) and it will be rendered here.');
            }
        }
    } catch (e) {
        statusEl.textContent = '';
        send('error', e && e.message ? e.message : String(e));
    }
</script>
</body>
</html>`;

const buildUnsupportedSrcdoc = (language) => `<!DOCTYPE html>
<html>
<head><style>
body { font-family: sans-serif; padding: 2rem; text-align: center; color: #888; background: #1e1e1e; }
h2 { color: #ccc; }
</style></head>
<body>
<h2>⚙️ Server execution required</h2>
<p>${LANG_LABELS[language] || language} code execution is coming soon.<br/>For now, review your code in the editor.</p>
</body>
</html>`;

/**
 * Build the srcdoc string for the sandboxed iframe.
 * Captures console output into a postMessage to the parent.
 */
export const buildIframeSrcdoc = (code, language) => {
    const source = String(code ?? "");
    switch (language) {
        case "html_css_js":
            return buildHtmlSrcdoc(source);
        case "javascript":
            return buildJavascriptSrcdoc(source);
        case "python":
            return buildPythonSrcdoc(source);
        case "react":
            return buildReactSrcdoc(source);
        default:
            return buildUnsupportedSrcdoc(language);
    }
};

/** Sandbox flags for the output iframe. allow-modals lets Python input() and alert() work. */
export const IFRAME_SANDBOX = "allow-scripts allow-modals";
