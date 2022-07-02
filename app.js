const dotenv = require('dotenv')
const path = require(`path`)
const fs = require(`fs`)


dotenv.config({path: path.join(__dirname, `.env`)})
const webCrawl = require(`./web-crawler`)


function getWebProfiles() {
  try {
    const profilesFolder = path.join(__dirname, `web-profiles`)
    const folderItems = fs.readdirSync(profilesFolder)
    const webProfiles = folderItems.filter(folderItem => {
      if (!folderItem.match(/.+\.js$/)) return false
      if (folderItem.match(/^_.*\.js$/)) return false

      const fullPath = path.join(__dirname, `web-profiles`, folderItem)
      if (fs.statSync(fullPath).isDirectory()) return false

      return true
    }).map(webProfile => require(`./web-profiles/${webProfile}`))

    return webProfiles
  } catch(error) {
    console.error(error)
  }
}

async function main() {
  const webProfiles = getWebProfiles()
  const [,, ...searchQueries] = process.argv

  let crawlResults = []
  for (const searchQuery of searchQueries)
    for (const webProfile of webProfiles)
      crawlResults.push(webCrawl(searchQuery, webProfile))

  crawlResults = await Promise.all(crawlResults)
  for (const crawlResult of crawlResults)
      console.log(JSON.stringify(crawlResult, null, 2))

  process.exit()
}

main()
