const getWebDriver = require('./web-driver')


async function findUrlsToCrawl(webProfile, searchQuery) {
  const retries_limit = 3
  let errorCode = 2

  for (let i = 0; i < retries_limit; i++) {
    const {hostname, getLandingUrl, getSearchResults} = webProfile
    let webDriver

    try {
      const landingUrl = await getLandingUrl(hostname, searchQuery)
      webDriver = await getWebDriver(landingUrl)
    } catch(error) {
      console.log(error)
      return [2, []]
    }

    try {
      const isCloudflared = await webProfile.isCloudflared(webDriver)
      if (isCloudflared) {
        await webDriver.quit()
        return [-1, []]
      }
    } catch(error) {
      console.log(error)
      errorCode = 3
      await webDriver.quit()
      continue
    }

    try {
      const hasResults = await webProfile.hasResults(webDriver, searchQuery)
      if (!hasResults) {
        await webDriver.quit()
        return [-2, []]
      }
    } catch(error) {
      console.log(error)
      errorCode = 4
      await webDriver.quit()
      continue
    }

    try {
      const urlsToCrawl = await getSearchResults(webDriver, searchQuery)

      if (!Array.isArray(urlsToCrawl)) {
        console.log(`Error: getSearchResults() must return an array`)
        await webDriver.quit()
        return [5, []]
      }

      if (!urlsToCrawl.length) {
        await webDriver.quit()
        return [-3, []]
      }

      if (!urlsToCrawl.includes(webDriver.currentUrl))
        await webDriver.quit()

      return [0, urlsToCrawl]
    } catch(error) {
      console.log(error)
      errorCode = 5
      await webDriver.quit()
    }
  }

  return [errorCode, []]
}

async function handleSearchQuery(searchQuery, webProfile) {
    const crawlResult = {
      query: searchQuery,
      hostname: webProfile.hostname,
      code: 0,
      payload: [],
    }

    try {
      const searchResults = await findUrlsToCrawl(webProfile, searchQuery)
      const [searchCode, urlsToCrawl] = searchResults
      if (searchCode) {
        crawlResult.code = searchCode
        return crawlResult
      }

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
