const getWebDriver = require('./web-driver')
const ERRORS = require(`./crawl-errors`)


async function getSearchResults(webProfile, searchQuery) {
  const retries_limit = 3
  for (let i = 0; i < retries_limit; i++) {
    try {
      const {hostname, getLandingUrl, getSearchResults} = webProfile
      const landingUrl = await getLandingUrl(hostname, searchQuery)
      const webDriver = await getWebDriver(landingUrl)

      try {
        const isCloudflared = await webProfile.isCloudflared(webDriver)
        if (isCloudflared) throw ERRORS[`-1`]
      } catch(error) {
        console.error(error)
        if (error.code != -1) {
          console.error(error)
          error.code = 3
        }
        throw error
      }

      try {
        const hasResults = await webProfile.hasResults(webDriver, searchQuery)
        if (!hasResults) throw ERRORS[`-2`]
      } catch(error) {
        console.error(error)
        if (error.code != -2) {
          console.error(error)
          error.code = 4
        }
        throw error
      }

      const urlsToCrawl = await getSearchResults(webDriver, searchQuery)
     
      if (!urlsToCrawl.includes(webDriver.currentUrl))
        await webDriver.quit()

      return urlsToCrawl
    } catch(error) {
      if (error.code < 0) throw error
    }
  }
  throw ERRORS[`2`]
}

async function handleSearchQuery(searchQuery, webProfile) {
    const crawlResult = {
      query: searchQuery,
      hostname: webProfile.hostname,
      code: 0,
      payload: [],
    }

    try {
      const urlsToCrawl = await getSearchResults(webProfile, searchQuery)
      crawlResult.payload = await Promise.all(
        urlsToCrawl.map(async urlToCrawl => {
          const webDriver = await getWebDriver(urlToCrawl)
          const crawlData = await webProfile.startCrawling(webDriver)
          if (!webDriver.isCompleted) await webDriver.quit()
          return {url: urlToCrawl, data: crawlData}
        })
      )
    } catch(error) {
      console.error(error)
      crawlResult.code = error.code || 1
    }

    return crawlResult
}

module.exports = handleSearchQuery
