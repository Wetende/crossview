import { describe, expect, it } from "vitest";

import {
    BABEL_STANDALONE_URL,
    IFRAME_SANDBOX,
    PYODIDE_BASE_URL,
    buildIframeSrcdoc,
    isBrowserRunnable,
    toScriptLiteral,
} from "./codeLabRuntimes";

describe("codeLabRuntimes", () => {
    it("runs HTML, JavaScript, React and Python in the browser only", () => {
        expect(isBrowserRunnable("html_css_js")).toBe(true);
        expect(isBrowserRunnable("javascript")).toBe(true);
        expect(isBrowserRunnable("react")).toBe(true);
        expect(isBrowserRunnable("python")).toBe(true);
        expect(isBrowserRunnable("java")).toBe(false);
        expect(isBrowserRunnable("c_cpp")).toBe(false);
    });

    it("escapes student code so it cannot close the runner script", () => {
        const literal = toScriptLiteral('print("</script><!--")');
        expect(literal).not.toContain("</script>");
        expect(literal).not.toContain("<!--");
        expect(JSON.parse(literal)).toBe('print("</script><!--")');
    });

    it("builds a Pyodide runner for Python that streams stdout to the parent", () => {
        const srcdoc = buildIframeSrcdoc('print("hi")', "python");
        expect(srcdoc).toContain(`${PYODIDE_BASE_URL}pyodide.js`);
        expect(srcdoc).toContain("loadPyodide");
        expect(srcdoc).toContain("runPythonAsync(source)");
        expect(srcdoc).toContain("setStdout");
        expect(srcdoc).toContain('type: \'console\'');
        expect(srcdoc).toContain(toScriptLiteral('print("hi")'));
    });

    it("builds a Babel + esm.sh runner for React that mounts App", () => {
        const srcdoc = buildIframeSrcdoc("function App() { return <p/>; }", "react");
        expect(srcdoc).toContain(BABEL_STANDALONE_URL);
        expect(srcdoc).toContain("https://esm.sh/react@");
        expect(srcdoc).toContain("transform-modules-commonjs");
        expect(srcdoc).toContain('<div id="root"></div>');
        expect(srcdoc).toContain("module.exports.default = App");
        expect(srcdoc).toContain(toScriptLiteral("function App() { return <p/>; }"));
    });

    it("keeps the placeholder for languages that need a server", () => {
        expect(buildIframeSrcdoc("int main() {}", "c_cpp")).toContain("Server execution required");
        expect(buildIframeSrcdoc("class Main {}", "java")).toContain("Server execution required");
    });

    it("keeps the existing HTML and JavaScript shells", () => {
        expect(buildIframeSrcdoc("<head></head>", "html_css_js")).toContain("window.parent.postMessage");
        expect(buildIframeSrcdoc("console.log(1)", "javascript")).toContain("console.log(1)");
    });

    it("allows modals so Python input() and alert() work inside the sandbox", () => {
        expect(IFRAME_SANDBOX.split(" ")).toEqual(
            expect.arrayContaining(["allow-scripts", "allow-modals"]),
        );
        expect(IFRAME_SANDBOX).not.toContain("allow-same-origin");
    });
});
