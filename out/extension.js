"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise-native");
// To bring other people's ideas into your code.
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "code-prompt" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        //vscode.window.showInformationMessage('Hello Worlds!');
        // Create and show a new webview
        const panel = vscode.window.createWebviewPanel('catCoding', // Identifies the type of the webview. Used internally
        'Cat Coding', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
            enableScripts: true,
            retainContextWhenHidden: true
        } // Webview options. More on these later.
        // And set its HTML content
        );
        let editors = [];
        let newLastEditor = (editorCtx) => {
            editors.unshift(editorCtx);
            if (editors.length > 2) {
                editors.pop();
            }
        };
        let getLastEditor = () => {
            return editors[editors.length - 1];
        };
        let getLanguage = (editor) => {
            return "python";
        };
        let sendCode = (code) => __awaiter(this, void 0, void 0, function* () {
            const baseUrl = 'http://127.0.0.1:5000/';
            var options = {
                method: 'POST',
                uri: baseUrl,
                body: {
                    code: code,
                    language: getLanguage(getLastEditor()),
                    results_num: 3
                },
                json: true // Automatically stringifies the body to JSON
            };
            const result = yield request.get(options);
            console.log(result);
        });
        let highlightTimeout;
        // consider looking at mouse up events:
        // https://code.visualstudio.com/api/references/vscode-api#TextEditorSelectionChangeKind
        vscode.window.onDidChangeTextEditorSelection(() => {
            const editor = getLastEditor();
            var selection = editor.selection;
            var text = editor.document.getText(selection);
            clearTimeout(highlightTimeout);
            highlightTimeout = setTimeout(function () {
                sendCode(text);
            }, 1000);
        });
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    const editor = getLastEditor(); //vscode.window.activeTextEditor;
                    if (editor === undefined) {
                        vscode.window.showErrorMessage("Error: no editor detected");
                    }
                    const fullText = editor.document.getText();
                    vscode.window.showErrorMessage(fullText);
                    /*const fullRange = new vscode.Range(
                        editor.document.positionAt(0),
                        editor.document.positionAt(fullText.length - 1)
                    );*/
                    //vscode.window.showErrorMessage(fullRange);
                    return;
            }
        });
        // onDidChangeActiveTerminal
        // workspace.onDidChangeTextDocument
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor === undefined) {
                return;
            }
            newLastEditor(editor);
            console.log("onDidChangeActiveTextEditor" + editor.document.fileName);
            //console.log(vscode.window.activeTextEditor.document.uri);
        });
        /*console.log(`Did change: ${changeEvent.document.uri}`);
      
        for (const change of changeEvent.contentChanges) {
              console.log(change.range); // range of text being replaced
              console.log(change.text); // text replacement
        }*/
        // And get the special URI to use with the webview
        // const jquerySrc = onDiskPath.with({ scheme: 'vscode-resource' });
        // console.log(jquerySrc);
        let results = [
            {
                "link": "https://stackoverflow.com/questions/35435042/how-can-i-define-an-array-of-objects",
                "code": `let userTestStatus: { id: number, name: string }[] = [
        { "id": 0, "name": "Available" },
        { "id": 1, "name": "Ready" },
        { "id": 2, "name": "Started" }
    ];`
            }, {
                "link": "https://parso.readthedocs.io/en/latest/index.html#docs",
                "code": `this is a sentence that is technically
      a line of code!`
            }
        ];
        panel.webview.html = getWebviewContent(results);
        function getWebviewContent(content) {
            return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cat Coding</title>
      </head>
      <style>
      .codeExample{
        background-color: #1a1e23;
        border-radius: 5px;
        border: 1px solid white;
        padding: 6px;
        margin: 3px;
        margin-top: 10px;
        /*white-space: pre-wrap;*/
        position: relative;
      }
      .codeExampleCon{
        /*background-color: #2c3823;
        border-radius: 10px;*/
        padding: 10px;
        margin: 10px;
        position: relative;
      }
      .codeExampleLink{
        color: white;
        height: 10px;
        margin: 10px;
        position: relative;
        text-decoration: none;
        margin-bottom: 20px;
      }
      .sexyLine{
        position: relative;
        width: 100%;
        height: 1px;
        background: black;
        background: -webkit-gradient(linear, 0 0, 100% 0, from(black), to(black), color-stop(50%, white));
        border: 0px;
        margin-top: 40px;
        margin-bottom: 40px;
      }
      </style>
      <body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.9.1/highlight.min.js"></script>
        <button id="testbtn">stuff</button>
        <div id="codeCon">
        </div>
        <script>
        const vscode = acquireVsCodeApi();
        console.log("hi");

        document.getElementById('testbtn').onclick = function(){
          console.log("pressed");
          vscode.postMessage({
            command: 'alert',
            text: '🐛  on line '
          });
        };

        let createCodeExample = (codeExampleData) => {
          let codeCon = document.getElementById("codeCon");

          var codeExampleCon = document.createElement("div");
          codeExampleCon.classList.add("codeExampleCon");
          codeCon.appendChild(codeExampleCon);

          var codeExampleLink = document.createElement("a");
          codeExampleLink.classList.add("codeExampleLink");
          //codeExampleLink.setAttribute('href', codeExampleData.link);
          codeExampleLink.href = codeExampleData.link;
          codeExampleLink.innerText = codeExampleData.link;
          codeExampleCon.appendChild(codeExampleLink);

          var pre = document.createElement("pre");
          pre.classList.add("codeExample");
          codeExampleCon.appendChild(pre);

          let rawcode = document.createElement("code");
          rawcode.innerHTML = codeExampleData.code;
          rawcode.classList.add("javascript");
          pre.appendChild(rawcode);

          // Add separator line

          var sexyLine = document.createElement("hr");
          sexyLine.classList.add("sexyLine");
          codeCon.appendChild(sexyLine);
        };

        let codeExamples = ${JSON.stringify(content)}
        codeExamples.forEach(function(codeExample) {
          console.log(codeExample);
          createCodeExample(codeExample);
        });
        document.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightBlock(block);
        });
      </script>
      </body>
      </html>`;
        }
    });
    //codeExample.code = codeExample.code.replace(/(?:\r\n|\r|\n)/g, '<br>');
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map