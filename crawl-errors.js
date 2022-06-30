const crawlErrors = {
  "-2": `No search results`,
  "-1": `Cloudflare Protected`,
  "1": `Unknown Error`,
  "2": `Unable to retrieve search results for some reason`,
  "3": `Error occurred when checking if is Cloudflared`,
  "4": `Error occurred when checking if no search results`,
}

Object.entries(crawlErrors).forEach((code, message) => {
  const error = new Error(message)
  error.code = parseInt(code)
  crawlErrors[code] = error
})

module.exports = crawlErrors
