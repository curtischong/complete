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
	let disposable = vscode.commands.registerCommand('extension.codeSearch', () => {
  // The code you place here will be executed every time your command is executed

  // Display a message box to the user
  //vscode.window.showInformationMessage('Hello Worlds!');
  // Create and show a new webview
  const baseUrl = 'http://127.0.0.1:5000/';
  const panel = vscode.window.createWebviewPanel(
    'searchForCode', // Identifies the type of the webview. Used internally
    'Search for Code',// Title of the panel displayed to the user
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

  vscode.window.onDidChangeActiveTextEditor(editor => {
    if(editor === undefined){
      return;
    }
    newLastEditor(editor);
    console.log("onDidChangeActiveTextEditor" + editor.document.fileName);
  });


  let getEditor = () => {
    let curEditor = vscode.window.activeTextEditor;
    let editor;
    if(curEditor === undefined){
      // gets the last editor that's valid
      return editors[editors.length - 1];
    }
    return curEditor;
  };

  let getLanguage = (editor: vscode.TextEditor) => {
    return "python";
  };

  let sendCode = async (code: string) => {
    console.log("sendCode");
    console.log(code);
    const editor = getEditor();
    console.log(editor.document.fileName);
    var options = {
      method: 'POST',
      uri: baseUrl,
      body: {
        code: code,
        fullCode: editor.document.getText(),
        language: getLanguage(editor),
        results_num: 3,
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
  vscode.window.onDidChangeTextEditorSelection((event: vscode.TextEditorSelectionChangeEvent) => {
    //console.log(event.kind);
    // kind== 2 is mouse

    const editor = getEditor();
    var selection = editor.selection;
    var text = editor.document.getText(selection);
    if(text.length < 3){
      return;
    }
    clearTimeout(highlightTimeout);
    highlightTimeout = setTimeout(function(){
      sendCode(text);
    }, 1000);
  });

  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'searchCode':
          sendCode(message.search);
          return;
      }
    },
  );

  let docStringQueue:{lineNum: number, docString: string, position: vscode.Position, editor: vscode.TextEditor}[] = [];
  //docStringQueue.push(2);         // queue is now [2]
  //var i = docStringQueue.shift(); // queue is now [5]

  let serverFree = true;
  let workDownDocStringsQueue = async () => {
    console.log(docStringQueue);
    if(docStringQueue.length === 0 || !serverFree){
      return;
    }
    serverFree = false;
    let curDocString = docStringQueue.shift();
    if(curDocString === undefined){
      return;
    }
    let lineNum = curDocString.lineNum;
    let docString = curDocString.docString;
    let position = curDocString.position;
    let editor = curDocString.editor;

    var options = {
      method: 'POST',
      uri: baseUrl + "getCodeFromDocStrings",
      body: {
        docString: docString
      },
      json: true // Automatically stringifies the body to JSON
    };

    const result = await request.get(options);
    editor.edit(edit => {
      console.log(result);
      let replacementCode = result[0];
      replacementCode += "\n";

      /*for(let i = 0; i < replacementCode.split("\n").length - 1; i++){
        edit.insert(new vscode.Position(lineNum+1, 0), "\n");
      }*/


      edit.insert(position, replacementCode);
      //as any [string];
    });
    serverFree = true;
    workDownDocStringsQueue();
  };

  let getCodeFromDocStrings = async (lineNum:number, docString: string, position: vscode.Position, editor: vscode.TextEditor) => {
    docStringQueue.push({
      lineNum: lineNum,
      docString: docString,
      position: position,
      editor: editor
    });
    await workDownDocStringsQueue();
  };

  vscode.workspace.onDidChangeTextDocument(function(TextDocumentChangeEvent) {
    const editor = vscode.window.activeTextEditor;
    if(editor === undefined){
      console.log("rip file changed but editor is not in focus");
      return;
    }
    const position = editor.selection.active;
    let lineNum = position.line;
    let lineRange = editor.document.lineAt(lineNum).range;
    //let lineRange = new vscode.Selection(lineRange.start, lineRange.end);

    let curCode = editor.document.getText(lineRange);
    let startSection = curCode.trimLeft().substring(0, 2);
    let lastSection = curCode.trimLeft().substring(curCode.trimLeft().length - 2);
    if(startSection === "@S" && lastSection ==="@E"){
      editor.edit(edit => {
        let firstToken = curCode.indexOf("@S");
        let deleteRange1Start = new vscode.Position(lineRange.start.line, 0); // delete at 0 so we can format it
        let deleteRange1End = new vscode.Position(lineRange.end.line, firstToken + 2);
        let deleteRange1 = new vscode.Range(deleteRange1Start, deleteRange1End);
        edit.delete(deleteRange1);

        let lastToken = curCode.indexOf("@E");
        let deleteRange2Start = new vscode.Position(lineRange.start.line, lastToken);
        let deleteRange2End = new vscode.Position(lineRange.end.line, lastToken + 2);
        let deleteRange2 = new vscode.Range(deleteRange2Start, deleteRange2End);
        edit.delete(deleteRange2);

        edit.insert(new vscode.Position(lineNum, 0), " # ");

        // we need to add a new line if the cursor is at the end of the file
        if(editor.document.getText().split("\n").length - 1 === lineNum){
          console.log("adding new line!");
          edit.insert(new vscode.Position(lineRange.start.line, curCode.length-2), "\n");
        }

        let docStringLoc = editor.document.lineAt(lineNum).range;
        //let lineRange = new vscode.Selection(lineRange.start, lineRange.end);
        let docStringLine = editor.document.getText(docStringLoc);
        let docString = docStringLine.trimLeft().substring(2, docStringLine.trimLeft().length-2);
        console.log(docString);
        getCodeFromDocStrings(lineNum, docString, new vscode.Position(lineRange.start.line+1, 0), editor);

        //TODO: Move the cursor to the end of the replacement code
        //let newLine = editor.document.getText(lineRange);
      });
    }

  });

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
      input:focus, button:focus{
        outline: none;
      }
      #searchCode{
        width: 78%;
        border: 1px solid white;
        height: 15px;
        padding: 7px;
        padding-left: 10px;
        margin: 20px;
        margin-right: 0px;
        float: left;
        border-top-left-radius: 20px;
        border-bottom-left-radius: 20px;
      }
      #searchCodeBtn{
        background-color: #006dcc;
        color: white;
        cursor: pointer;
        margin: 20px;
        margin-left: 0px;
        padding: 7px;
        height: 31px;
        float: left;
        border: 1px solid #006dcc;
        border-top-right-radius: 20px;
        border-bottom-right-radius: 20px;
      }
      .highlightedLine{
        background-color: #003d9e
      }
      .fullCodeBtn{
        color: white;
        background: none;
        cursor: pointer;
        border: 1ps solid white;
        border-radius: 3px;
        font-size: 12px;
        left: 3px;
        position: relative;
      }
      .fullCodeBackBtn{
        color: white;
        background: none;
        cursor: pointer;
        border: 1ps solid white;
        border-radius: 3px;
        font-size: 12px;
        left: 22px;
        position: relative;
        margin-top: 10px;
      }
      #codeCon{
        position: relative;
      }
      .hidden-code{
        color: #e35f00;
        font-size: 20px;
      }
      .hljs{display:block;overflow-x:auto;padding:.5em;background:#282a36;border-radius:5px;}.hljs-built_in,.hljs-link,.hljs-section,.hljs-selector-tag{color:#8be9fd}.hljs-keyword{color:#ff79c6}.hljs,.hljs-subst{color:#f8f8f2}.hljs-title{color:#50fa7b}.hljs-addition,.hljs-attr,.hljs-bullet,.hljs-meta,.hljs-name,.hljs-string,.hljs-symbol,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable{color:#f1fa8c}.hljs-comment,.hljs-deletion,.hljs-quote{color:#6272a4}.hljs-doctag,.hljs-keyword,.hljs-literal,.hljs-name,.hljs-section,.hljs-selector-tag,.hljs-strong,.hljs-title,.hljs-type{font-weight:700}.hljs-literal,.hljs-number{color:#bd93f9}.hljs-emphasis{font-style:italic}
      </style>
      <body>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.10/highlight.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.15.10/languages/python.min.js"></script>

        <div id="windowBody">
          <div style="position:relative;height: 60px;margin-bottom: 10px;">
            <input id="searchCode" placeholder="Search for code"/>
            <button id="searchCodeBtn">Search!</button>
          </div>
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
              search: searchCode.value
            });
          }
        });

        searchCode.addEventListener("keyup", function(e){
          if(e.keyCode==13){
            console.log(searchCode.value)
            vscode.postMessage({
              command: 'searchCode',
              search: searchCode.value
            });
          }
        });

        let searchCodeBtn = document.getElementById("searchCodeBtn")
        searchCodeBtn.onclick = function(){
          vscode.postMessage({
            command: 'searchCode',
            search: searchCode.value
          });
        };

        let showFullCode = (codeExampleData, codeExamples) => {
          console.log("showing the entire code")
          const Http = new XMLHttpRequest();
          const url = codeExampleData.url;
          Http.open("GET", url);
          Http.send();

          Http.onreadystatechange = (e) => {
            let codeCon = document.getElementById("codeCon");
            codeCon.innerHTML = "";

            var fullCodeBackBtn = document.createElement("button");
            fullCodeBackBtn.classList.add("fullCodeBackBtn");
            fullCodeBackBtn.innerHTML = "< Back";
            fullCodeBackBtn.onclick = function(){
              createCodeExamples(codeExamples);
            };
            codeCon.appendChild(fullCodeBackBtn);

            var codeExampleCon = document.createElement("div");
            codeExampleCon.classList.add("codeExampleCon");
            codeCon.appendChild(codeExampleCon);

            var pre = document.createElement("pre");
            pre.classList.add("codeExample");
            codeExampleCon.appendChild(pre);

            let rawcode = document.createElement("code");
            let code = Http.responseText.split("\\n");

            let lineNums = codeExampleData.lineNums;
            lineNums.forEach(function(lineNum){
              let num = parseInt(lineNum);
              code[num] = '<span class="highlightedLine">' + code[num] + '</span>';
            });

            rawcode.innerHTML = code.join("\\n");
            rawcode.classList.add("language-python");
            pre.appendChild(rawcode);

            document.querySelectorAll('pre code').forEach((block) => {
              hljs.highlightBlock(block);
            });
          }
        };


        window.addEventListener('message', event => {
          const message = event.data; // The JSON data our extension sent

          switch (message.command) {
            case 'loadCodeExamples':
              createCodeExamples(message.codeExamples);
              break;
          }
        });

        let createCodeExamples = (codeExamples) => {
          let codeCon = document.getElementById("codeCon");
          codeCon.innerHTML = "";

          for(let i = 0; i < codeExamples.length; i++){
            let codeExample = codeExamples[i];
            createCodeExample(codeExample, codeExamples);

            // Add separator line

            /*if(i < codeExamples - 1){
              var sexyLine = document.createElement("hr");
              sexyLine.classList.add("sexyLine");
              codeCon.appendChild(sexyLine);
            }*/
          }

          document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
          });
        };

        let createCodeExample = (codeExampleData, codeExamples) => {
          let codeCon = document.getElementById("codeCon");

          var codeExampleCon = document.createElement("div");
          codeExampleCon.classList.add("codeExampleCon");
          codeCon.appendChild(codeExampleCon);

          var fullCodeBtn = document.createElement("button")
          fullCodeBtn.classList.add("fullCodeBtn");
          fullCodeBtn.innerHTML = "Show Full Code >";
          fullCodeBtn.onclick = function(){
            showFullCode(codeExampleData, codeExamples);
          };
          codeExampleCon.appendChild(fullCodeBtn);

          var pre = document.createElement("pre");
          pre.classList.add("codeExample");
          codeExampleCon.appendChild(pre);

          let rawcode = document.createElement("code");
          //let minLine = Math.max(parseInt(codeExampleData.minLine) - 3, 0);
          //let maxLine = Math.min(parseInt(codeExampleData.maxLine) + 3, codeExampleData.raw.length - 1);

          let lineNums = codeExampleData.lineNums;
          let codeLines = codeExampleData.codeLines;
          let moduleLines = codeExampleData.moduleLines;
          console.log("moduleLines");
          console.log(moduleLines);
          if(moduleLines !== undefined){
            for(let i = 0; i < moduleLines.length;i++){
              if(moduleLines[i]){
                // codeLines[i] = '<span class="highlightedLine">' + codeLines[i] + '</span>';
              }
            }
          }

          let finalCodeLines = [];
          let lastLine = -1;
          for(let i = 0; i < lineNums.length; i++){
            let lineNum = parseInt(lineNums[i]);
            if(lastLine != -1 && lineNum > lastLine + 1){
              finalCodeLines.push('<span class="hidden-code">...</span>');
            }
            finalCodeLines.push(codeLines[i]);
            lastLine = lineNum;
          }

          //let htmlCode = finalCodeLines.slice(minLine, maxLine + 1);
          rawcode.innerHTML = finalCodeLines.join("\\n");
          rawcode.classList.add("javascript");
          pre.appendChild(rawcode);
        };

      </script>
      </body>
      </html>`;
      // <script>hljs.registerLanguage("python",function(e){var r={keyword:"and elif is global as in if from raise for except finally print import pass return exec else break not with class assert yield try while continue del or def lambda async await nonlocal|10",built_in:"Ellipsis NotImplemented",literal:"False None True"},b={cN:"meta",b:/^(>>>|\\.\\.\\.) /},c={cN:"subst",b:/\\{/,e:/\\}/,k:r,i:/#/},a={cN:"string",c:[e.BE],v:[{b:/(u|b)?r?'''/,e:/'''/,c:[e.BE,b],r:10},{b:/(u|b)?r?"""/,e:/"""/,c:[e.BE,b],r:10},{b:/(fr|rf|f)'''/,e:/'''/,c:[e.BE,b,c]},{b:/(fr|rf|f)"""/,e:/"""/,c:[e.BE,b,c]},{b:/(u|r|ur)'/,e:/'/,r:10},{b:/(u|r|ur)"/,e:/"/,r:10},{b:/(b|br)'/,e:/'/},{b:/(b|br)"/,e:/"/},{b:/(fr|rf|f)'/,e:/'/,c:[e.BE,c]},{b:/(fr|rf|f)"/,e:/"/,c:[e.BE,c]},e.ASM,e.QSM]},i={cN:"number",r:0,v:[{b:e.BNR+"[lLjJ]?"},{b:"\\b(0o[0-7]+)[lLjJ]?"},{b:e.CNR+"[lLjJ]?"}]},l={cN:"params",b:/\\(/,e:/\\)/,c:["self",b,i,a]};return c.c=[a,i,b],{aliases:["py","gyp","ipython"],k:r,i:/(<\\/|->|\\?)|=>/,c:[b,i,a,e.HCM,{v:[{cN:"function",bK:"def"},{cN:"class",bK:"class"}],e:/:/,i:/[\${=;\\n,]/,c:[e.UTM,l,{b:/->/,eW:!0,k:"None"}]},{cN:"meta",b:/^[\\t ]*@/,e:/$/},{b:/\\b(print|exec)\\(/}]}});</script>
    }
  });
        //let codeExamples = ${JSON.stringify(content)}
  //codeExample.code = codeExample.code.replace(/(?:\r\n|\r|\n)/g, '<br>');

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
