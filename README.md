# Language Translator MCP Server

My mcp server is a tool that helps detect what language a paragraph of text is written in and then translate it into another foreign language. It is very useful because it lets an AI agent quickly figure out what a user is saying and respond in the correct language without needing a bunch of extra setup. It can identify that "Hola, cómo estás" is Spanish, or translate something like "Je suis fatigué" into English. It could also be used to automatically detect a language before translating it. One limitation I ran into is that the server looks like it's doing nothing when it's running, which confused me at first. I also didn't realize it wouldn't show any activity until Claude Code actually connected and called one of the tools.

## Installation Instructions

So basically to get this project running, you first need to clone the repository from GitHub and move (cd) into the folder. Then just run npm install to grab all the dependencies. After that, you have to add the server config to your .mcp.json file so Claude Code knows where to find it. Then, you will have to point it to your index.js path and you're good to go. Run npm start to get it up and running.
