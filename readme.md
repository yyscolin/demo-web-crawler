This is a very basic nodejs app demonstrating the web-crawling capabilities with
Selenium.

Given a search keyword(s), the program will visit several pages looking for
search results and returning an array of URLs. Then for each URL, the app will
crawl through the page looking for specified information.

### Remember to:
- Download FireFox
- Download geckodriver
- Add geckodriver's directory to system's PATH
- Run the `npm i` command in the code's directory
- Duplicate the .env_template to .env (and update the file if needed)

### How to run?
1. Create a web profile following web-profiles/_template.js
2. `node app.js [keyword#1 [keyword#2...]]`

### Demonstration
Enter `node app.js minions`<br/>
This command will search IMDB and Rotten Tomatoes for movies related to
"minions" and retrieve the title, year, average score, duration, PG rating, and
tags of the first 5 results.

node version: v16.13.0<br/>
firefox version: v102.0<br/>
geckodriver version: v0.30.0
