const dotenv = require('dotenv')
const path = require(`path`)
const fs = require(`fs`)
const webCrawl = require(`./web-crawler`)
dotenv.config({path: path.join(__dirname, `.env`)})



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
  for (const searchQuery of searchQueries) {
    for (const webProfile of webProfiles) {
      const crawlResult = await webCrawl(searchQuery, webProfile)
      console.log(JSON.stringify(crawlResult, null, 2)) 
    }
  }
  process.exit()
}

main()
