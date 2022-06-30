This is a very basic nodejs app demonstrating the web-crawling capabilities with Selenium.

Given a search keyword(s), the program will visit several pages looking for search results and returning an array of URLs.
Then for each URL, the app will crawl through the page looking for specified information.

### Remember to:
- Download geckodriver
- Add geckodriver's directory to system's PATH
- Run the `npm i` command in the code's directory

### How to run?
1. Create a web profile following web-profiles/_template.js
2. `node app.js [keyword#1 [keyword#2...]]`

node version: v16.13.0
firefox version: v102.0
geckodriver version: v0.30.0
