# Complete
Complete is a VSCode extension that introduces other people's ideas into your code. Written by [Curtis Chong](https://github.com/curtischong), [Akshay Saxena](https://github.com/akshay2000saxena), [Mayank Kanoria](https://github.com/mkanoria), and [Vikram Subramanian](https://github.com/vikramsubramanian).

<p align="center">
  <img src="https://chongcurtis.com/file_hosting/complete_func_gen.gif" alt="A photo of the proposed locations."/>
  <img src="https://chongcurtis.com/file_hosting/complete_search.gif" alt="A photo of the proposed locations."/>
</p>

###  Features:
- Automatic Code Generation from pseudocode (Only Python)
- Search for similar functions found on public repos (Only Python)

### Why should you use this?
- You can generate entire programs just by writing pseudocode - competitive programmers watch out!
- You can search for similar functions by other developers - Improve your implimentation by copying code from others!

### Installation:
- Make sure you have [complete-server](https://github.com/curtischong/complete-server) running.
- Open this reposity within VSCode then `hit F5`. This will launch another VSCode window that will has the extension loaded within it.
- Now open the VSCode command palette ( by hitting `cmd + shift + p` at the same time)
- Next type in the command `Code Search`. This will open up a new panel with the Complete search bar on it.
  - Feel free to put VSCode in splitscreen and place the side panel to the side!

### Pseudocode -> function Usage
- Go into a file you're working in and type a description of what you want your function to do. The longer it is the better.
  - Ex: `Calculate the L2 Norm of 2 vectors.`
- Now surround your Pseudocode with `@S` (start) and `@E` (end)
  - Ex: `@SCalculate the L2 Norm of 2 vectors.@E` (spaces don't really matter)
- The Complete extension will now send your pseudocode to a Neural Net trained by Github and will await a response.
- Feel free to chain multiple pieces of Pseudocode together like you're scoping out the steps of your program. You don't need to wait until each function is generated before starting to write another. The requests are queued :)
- Note: If the function generated is `undefined`, then no suitable function was close enough to match your description

### Similar function search Usage
- Type into the search box a piece of code you're interested in looking in. Library functions are typically the most useful.
- Highlight a section of code. We will search for other sections of code that are similar to your code.

### How does the pseudocode generator work?
- None of us are qualified to explain this. However, Github, the ones that trained the model, is: [github.blog/2018-09-18-towards-natural-lan: guage-semantic-code-search](https://github.blog/2018-09-18-towards-natural-language-semantic-code-search/)
- Just understand that the model represents your pseudocode description as vector. You can read more about how a vector represents a word [here](https://towardsdatascience.com/introduction-to-word-embedding-and-word2vec-652d0c2060fa). It then takes the vector representation of your pseduocode and will search for a function description that has a similar vector representation. This function description is mapped to the function it describes. So all it needs to do is to find the most similar function description vector that looks like your pseudocode vector, then return the corresponding function of the function description.

### How the function search work?
- We found an API ([searchcode.com](https://searchcode.com/)) that allows you to search for code within public repos on Github, Bitbucket, Google Code, SourceForge, Fedora Project, and Gitlab.
- For every function you highlight, we first parse away syntactic nuances and pick out key terms, particularly function names (from packages) and other variables. Then we construct a list of terms to send to the API. This includes the names of the functions from the packages and a TF-IDF weighted score of your variable names.
- After we get the search, we highlight the package names returned and send it off to the client!

##### Why is the code so bad?
- We built this over Hack the North 2019...  ¯\\_(ツ)_/¯

##### When can I download it on the VSCode Extensions store?
- I (Curtis) will fix it up and release it as a proper extension on the store if school takes a step back and cuts me some slack :)