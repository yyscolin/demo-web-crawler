/** Web profiles starting with an underscore will be ignored */


const HOSTNAME = `https://www.example.com`

async function getLandingUrl(hostname, searchQuery) {
  /**
   * This is merely a sample, you need to write your own code to determine
   * the URL to find the results of the search query.
   */
  return `${hostname}/search?keyword=${searchQuery}`
}

async function isCloudflared(webDriver) {
  /** This function can be left unchanged. */
  const cfContent = await webDriver.findElementById(`cf-content`)
  return cfContent ? true : false
}

async function hasResults(webDriver, searchQuery) {
  /**
   * This is merely a sample, you need to write your own code to determine
   * if there are any search results returned.
   */
  const noResultsHtml = await webDriver.findElementById(`search-results`)
    .getAttribute(`innerHTML`)
  return noResultsHtml != `Search returned no result.`
}

async function getSearchResults(webDriver, searchQuery) {
  /**
   * This is merely a sample, you need to write your own code to determine
   * which URLs to crawl.
   */
  const results = await webDriver.findElementsByCss(`#search-results .results`)
  const urlsToCrawl = results.map(_ => _.getAttribute(`href`))
  return urlsToCrawl
}

async function startCrawling(webDriver) {
  /**
   * This is merely a sample, you need to write your own code to determine
   * what information are to be collected.
   */
  const requiredInfo = await webDriver.getObject({
    column1: _ => _.findElementByCss(`example-1`)
      .getAttribute(`innerHTML`),
    column2: _ => _.findElementByCss(`example-2`)
      .getAttribute(`innerHTML`),
    column3: _ => _.findElementByCss(`example-3`)
      .getAttribute(`innerHTML`),
    column4: _ => _.findElementByCss(`example-4`)
      .getAttribute(`innerHTML`),
  })
  return requiredInfo
}

module.exports = {
  hostname: HOSTNAME,
  getLandingUrl,
  isCloudflared,
  hasResults,
  getSearchResults,
  startCrawling,
}

