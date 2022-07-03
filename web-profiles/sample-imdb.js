/** Web profiles starting with an underscore will be ignored */


const HOSTNAME = `https://www.imdb.com`
const PG_RATINGS = [
  `PG`, `PG-13`, `MA15+`, `Not Rated`, `R`, `TV-14`, `TV-PG`, `TV-MA`
]

async function getLandingUrl(hostname, searchQuery) {
  /**
   * This is merely a sample, you need to write your own code to determine
   * the URL to find the results of the search query.
   */
  return `${hostname}/find?s=tt&q=${searchQuery}`
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
  const noResultsHtml = await webDriver.findElementByClassName(`findHeader`)
    .getAttribute(`innerHTML`)
  return noResultsHtml.substring(0, 20) != `No results found for`
}

async function getSearchResults(webDriver, searchQuery) {
  /**
   * This is merely a sample, you need to write your own code to determine
   * which URLs to crawl.
   */
  const results = await webDriver.findElementsByCss(`.result_text`)
  const urlsToCrawl = []
  for (const result of results) {
    if (await result.findElementByCss(`small`)) continue
    const urlToCrawl = await result.findElementByCss(`a`)
      .getAttribute(`href`, _ => _.split(`?`)[0])
    urlsToCrawl.push(urlToCrawl)
    if (urlsToCrawl.length >= 5) break
  }
  return urlsToCrawl
}

async function startCrawling(webDriver) {
  /**
   * This is merely a sample, you need to write your own code to determine
   * what information are to be collected.
   */
  const movieTitle = await webDriver.findElementByCss(`h1[data-testid]`)
    .getAttribute(`innerHTML`)

  let averageScore = await webDriver.findElementByCss(`.sc-7ab21ed2-1`)
    .getAttribute(`innerHTML`)
  averageScore = averageScore ? parseInt(averageScore) : null

  let movieYear = null
  let pgRating = null
  let movieDuration = null
  const movieInfos = await webDriver.findElementsByCss(`.sc-94726ce4-3 li`)
  for (let movieInfo of movieInfos) {
    movieInfo = await movieInfo.getAttribute(`innerText`)
    if (movieInfo.match(/^\d{4}$/)) movieYear = parseInt(movieInfo)
    else if (movieInfo.match(/^(\d+h )?\d+m$/)) {
      const [movieHours, movieMins] = movieInfo.replace(`m`, ``).split(`h `)
      movieDuration = parseInt(movieHours) * 60 + parseInt(movieMins)
    }
    else if (PG_RATINGS.includes(movieInfo)) pgRating = movieInfo
  }

  let movieGenres = await webDriver.findElementsByCss(`.bYNgQ .ipc-chip__text`)
  if (movieGenres.length) movieGenres = await Promise.all(
    movieGenres.map(tag => tag.getAttribute(`innerHTML`))
  )

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

