"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
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
        // Get path to resource on disk
        const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'cat.gif'));
        // And get the special URI to use with the webview
        //const jquerySrc = onDiskPath.with({ scheme: 'vscode-resource' });
        //console.log(jquerySrc);
        panel.webview.html = getWebviewContent();
        function getWebviewContent() {
            return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cat Coding</title>
        </head>
        <body>
          <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300"/>
          <button id="testbtn">stuff</button>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/core.js"></script>
          <script>
            console.log("hi");
          $(document).ready(function(){
            $("#testbtn").on("click", function(){
              console.log("pressed");
            });
          });
          /*(function() {
              const vscode = acquireVsCodeApi();
              const counter = document.getElementById('testbtn');

              let count = 0;
              setInterval(() => {
                  counter.textContent = count++;

                  // Alert the extension when our cat introduces a bug
                  if (Math.random() < 0.001 * count) {
                      vscode.postMessage({
                          command: 'alert',
                          text: '🐛  on line ' + count
                      })
                  }
              }, 100);
          }())*/
        </script>
        </body>
        </html>`;
        }
    });
    let form = vscode.commands.registerCommand('extension.formThing', () => {
        // Create and show a new webview
        const panel = vscode.window.createWebviewPanel('catCoding', // Identifies the type of the webview. Used internally
        'Cat Coding', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
            // Enable scripts in the webview
            enableScripts: true
        } // Webview options. More on these later.
        );
    });
    context.subscriptions.push(disposable);
    //context.subscriptions.push(form);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map