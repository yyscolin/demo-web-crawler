/** Web profiles starting with an underscore will be ignored */


const HOSTNAME = `https://www.rottentomatoes.com`

async function getLandingUrl(hostname, searchQuery) {
  /**
   * This is merely a sample, you need to write your own code to determine
   * the URL to find the results of the search query.
   */
  return `${hostname}/search?search=${searchQuery}`
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
  const noResultsHtml = await webDriver.findElementByClassName(
    `js-search-no-results-title`
  )
  return !noResultsHtml
}

async function getSearchResults(webDriver, searchQuery) {
  /**
   * This is merely a sample, you need to write your own code to determine
   * which URLs to crawl.
   */
  const dataRows = await webDriver.findElementsByCss(`a.unset:first-child`)
  return Promise.all(dataRows.slice(0, 5).map(_ => _.getAttribute(`href`)))
}

async function startCrawling(webDriver) {
  /**
   * This is merely a sample, you need to write your own code to determine
   * what information are to be collected.
   */
  const movieTitle = await webDriver.findElementByCss(`h1[slot=title]`)
    .getAttribute(`innerHTML`)

  let averageScore = null
  let pgRating = null
  const audienceScoreHtml = await webDriver.findElementByCss(`[audiencescore]`)
  if (audienceScoreHtml) {
    averageScore = await audienceScoreHtml.getAttribute(`audiencescore`)
    averageScore = averageScore ? parseInt(averageScore) / 10 : null
    pgRating = await audienceScoreHtml.getAttribute(`rating`)
    if (!pgRating) pgRating = null
  }

  let movieGenres = []
  let movieYear = null
  let movieDuration = null
  const movieInfo = await webDriver.findElementByCss(`[slot=info]`)
    .getAttribute(`innerHTML`)
  if (movieInfo) {
    [movieYear, movieGenres, movieDuration] = movieInfo.split(`, `)
    if (movieYear) movieYear = parseInt(movieYear)
    if (movieGenres) movieGenres = movieGenres.split(`/`)
    if (movieDuration) {
      const [movieHours, movieMins] = movieDuration.replace(`m`, ``).split(`h `)
      movieDuration = parseInt(movieHours) * 60 + parseInt(movieMins)
    }
  }

  return {
    title: movieTitle,
    year: movieYear,
    averageScore: averageScore,
    duration: movieDuration,
    pgRating: pgRating,
    tags: movieGenres,
  }
}

module.exports = {
  hostname: HOSTNAME,
  getLandingUrl,
  isCloudflared,
  hasResults,
  getSearchResults,
  startCrawling,
}

