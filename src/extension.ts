import * as request from "request-promise-native";

// To bring other people's ideas into your code.
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

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
  const panel = vscode.window.createWebviewPanel(
    'catCoding', // Identifies the type of the webview. Used internally
    'Cat Coding', // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    {
      enableScripts: true,
      retainContextWhenHidden: true
    } // Webview options. More on these later.
    // And set its HTML content
  );
  let editors: vscode.TextEditor[] = [];

  let newLastEditor = (editorCtx: vscode.TextEditor) => {
    editors.unshift(editorCtx);
    if(editors.length > 2){
      editors.pop();
    }
  };

  let getLastEditor = () => {
    return editors[editors.length - 1];
  };

  let getLanguage = (editor: vscode.TextEditor) => {
    return "python";
  };

  let sendCode = async (code: string) => {
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

    const result = await request.get(options);
    console.log(result);
    panel.webview.postMessage({ command: 'loadCodeExamples' , codeExamples: result});
  };

  let highlightTimeout: NodeJS.Timeout;

  // consider looking at mouse up events:
  // https://code.visualstudio.com/api/references/vscode-api#TextEditorSelectionChangeKind
  vscode.window.onDidChangeTextEditorSelection(() => {
    const editor = getLastEditor();
    var selection = editor.selection;
    var text = editor.document.getText(selection);
    clearTimeout(highlightTimeout);
    highlightTimeout = setTimeout(function(){
      sendCode(text);
    }, 1000);
  });

  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'alert':
          vscode.window.showErrorMessage(message.text);
          const editor = getLastEditor(); //vscode.window.activeTextEditor;

          if(editor === undefined){
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
        case 'searchCode':
          sendCode(message.search);
      }
    },
  );

  // onDidChangeActiveTerminal
  // workspace.onDidChangeTextDocument

  vscode.window.onDidChangeActiveTextEditor(editor => {
    if(editor === undefined){
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

  let results: {link: string, code: string}[] = [
    {
      "link": "https://stackoverflow.com/questions/35435042/how-can-i-define-an-array-of-objects",
      "code": `let userTestStatus: { id: number, name: string }[] = [
        { "id": 0, "name": "Available" },
        { "id": 1, "name": "Ready" },
        { "id": 2, "name": "Started" }
    ];`
    },{
      "link": "https://parso.readthedocs.io/en/latest/index.html#docs",
      "code": `this is a sentence that is technically
      a line of code!`
    }
  ];

  panel.webview.html = getWebviewContent(results);
  function getWebviewContent(content: {link: string, code: string}[]) {
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
      textarea:focus, input:focus{
        outline: none;
      }
      #searchCode{
        position: relative;
        width: 90%;
        border: 1px solid white;
        padding: 5px;
        margin: 20px;
      }
      .highlightedLine{
        background-color: #003e8a
      }
      .hljs{display:block;overflow-x:auto;padding:.5em;background:#282a36;border-radius:5px;}.hljs-built_in,.hljs-link,.hljs-section,.hljs-selector-tag{color:#8be9fd}.hljs-keyword{color:#ff79c6}.hljs,.hljs-subst{color:#f8f8f2}.hljs-title{color:#50fa7b}.hljs-addition,.hljs-attr,.hljs-bullet,.hljs-meta,.hljs-name,.hljs-string,.hljs-symbol,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable{color:#f1fa8c}.hljs-comment,.hljs-deletion,.hljs-quote{color:#6272a4}.hljs-doctag,.hljs-keyword,.hljs-literal,.hljs-name,.hljs-section,.hljs-selector-tag,.hljs-strong,.hljs-title,.hljs-type{font-weight:700}.hljs-literal,.hljs-number{color:#bd93f9}.hljs-emphasis{font-style:italic}
      </style>
      <body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.9.1/highlight.min.js"></script>
        <button id="testbtn">stuff</button>
        <div id="windowBody">
          <input id="searchCode" placeholder="Search for code"/>
          <div id="codeCon">
          </div>
        <script>
        const vscode = acquireVsCodeApi();
        let searchCode = document.getElementById("searchCode")
        searchCode.addEventListener("keyup", function(e){
          if(e.keyCode==13){
            console.log(searchCode.value)
            vscode.postMessage({
              command: 'searchCode',
              search: 'searchCode.value'
            });
          }
        });

        document.getElementById('testbtn').onclick = function(){
          console.log("pressed");
          vscode.postMessage({
            command: 'alert',
            text: '🐛  on line '
          });
        };

        window.addEventListener('message', event => {

          const message = event.data; // The JSON data our extension sent

          switch (message.command) {
            case 'loadCodeExamples':
              console.log("asd");
              createCodeExamples(message.codeExamples);
              break;
          }
        });

        let createCodeExamples = (codeExamples) => {
          let codeCon = document.getElementById("codeCon");
          codeCon.innerHTML = "";
          codeExamples.forEach(function(codeExample) {
            console.log(codeExample);
            createCodeExample(codeExample);
          });

          document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
          });
        };

        let createCodeExample = (codeExampleData) => {
          let codeCon = document.getElementById("codeCon");

          var codeExampleCon = document.createElement("div");
          codeExampleCon.classList.add("codeExampleCon");
          codeCon.appendChild(codeExampleCon);

          var codeExampleLink = document.createElement("a");
          codeExampleLink.classList.add("codeExampleLink");
          //codeExampleLink.setAttribute('href', codeExampleData.url);
          codeExampleLink.href = codeExampleData.url;
          codeExampleLink.innerText = codeExampleData.url;
          codeExampleCon.appendChild(codeExampleLink);

          var pre = document.createElement("pre");
          pre.classList.add("codeExample");
          codeExampleCon.appendChild(pre);

          let rawcode = document.createElement("code");
          let minLine = Math.max(parseInt(codeExampleData.minLine) - 3, 0);
          let maxLine = Math.min(parseInt(codeExampleData.maxLine) + 3, codeExampleData.raw.length - 1);

          let lineNums = codeExampleData.lineNums;
          lineNums.forEach(function(num){
            codeExampleData.raw[num] = '<span class="highlightedLine">' + codeExampleData.raw[num] + '</span>';
          });

          let htmlCode = codeExampleData.raw.slice(minLine, maxLine + 1);
          rawcode.innerHTML = htmlCode.join("\\n");
          rawcode.classList.add("javascript");
          pre.appendChild(rawcode);

          // Add separator line

          var sexyLine = document.createElement("hr");
          sexyLine.classList.add("sexyLine");
          codeCon.appendChild(sexyLine);
        };

      </script>
      </body>
      </html>`;
    }
  });
        //let codeExamples = ${JSON.stringify(content)}
  //codeExample.code = codeExample.code.replace(/(?:\r\n|\r|\n)/g, '<br>');

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
