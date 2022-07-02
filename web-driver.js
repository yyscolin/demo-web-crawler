/**
 * Ensure geckodriver.exe and firefox.exe is in environment PATH for Windows
 * Ensure firefox bin path is listed in .env file for Linux
*/
const {Builder, By} = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')

const maxDriversAllowed = process.env.MAX_DRIVERS_COUNT
const webDrivers = []

const seleniumItems = new Map()

const seleniumOptions = new firefox.Options()
if (process.env.FIREFOX_BIN) seleniumOptions.setBinary(process.env.FIREFOX_BIN)

function addMethodsOfFinding(object) {
  object.findElementByClassName = (...args) => findElement(object, `className`, ...args)
  object.findElementByCss = (...args) => findElement(object, `css`, ...args)
  object.findElementById = (...args) => findElement(object, `id`, ...args)
  object.findElementByJs = (...args) => findElement(object, `js`, ...args)
  object.findElementByLinkText = (...args) => findElement(object, `linkText`, ...args)
  object.findElementByName = (...args) => findElement(object, `name`, ...args)
  object.findElementByPartialLinkText = (...args) => findElement(object, `partialLinkText`, ...args)
  object.findElementByXpath = (...args) => findElement(object, `xpath`, ...args)
  object.findElementsByClassName = (...args) => findElements(object, `className`, ...args)
  object.findElementsByCss = (...args) => findElements(object, `css`, ...args)
  object.findElementsById = (...args) => findElements(object, `id`, ...args)
  object.findElementsByJs = (...args) => findElements(object, `js`, ...args)
  object.findElementsByLinkText = (...args) => findElements(object, `linkText`, ...args)
  object.findElementsByName = (...args) => findElements(object, `name`, ...args)
  object.findElementsByPartialLinkText = (...args) => findElements(object, `partialLinkText`, ...args)
  object.findElementsByXpath = (...args) => findElements(object, `xpath`, ...args)
}

function getValue(webObject, getMethod, attribute, modification) {
  const promise = new Promise(async (resolve, reject) => {
    try {
      if (webObject instanceof Promise) webObject = await webObject
      if (!webObject) return resolve(null)
      let value = await seleniumItems.get(webObject)[getMethod](attribute)
      if (value && modification) value = modification(value)
      resolve(value)
    } catch(err) {
      reject(err)
    }
  })
  promise.redirect = () => getWebDriver(promise)
  return promise
}

function findElement(webObject, byMethod, ...args) {
  const promise = new Promise(async (resolve, reject) => {
    try {
      if (webObject instanceof Promise) webObject = await webObject
      if (!webObject) return resolve(null)
      let htmlElement = seleniumItems.get(webObject)
      htmlElement = await htmlElement.findElements(By[byMethod](...args))
      htmlElement = htmlElement[0]
      if (htmlElement) {
        const elementName = `${webObject.name};${byMethod}:${args}`
        htmlElement = new WebElement(elementName, htmlElement)
      }
      resolve(htmlElement)
    } catch(err) {
      reject(err)
    }
  })
  addMethodsOfFinding(promise)
  promise.getAttribute = (...args) => getValue(promise, `getAttribute`, ...args)
  promise.getCssValue = (...args) => getValue(promise, `getCssValue`, ...args)
  promise.hasClass = (...args) => hasClass(promise, ...args)
  return promise
}

function findElements(webObject, byMethod, ...args) {
  const promise = new Promise(async (resolve, reject) => {
    try {
      if (webObject instanceof Promise) await webObject
      if (!webObject) return resolve(null)
      const parentHtml = seleniumItems.get(webObject)
      const childHtmls = await parentHtml.findElements(By[byMethod](...args))
      resolve(childHtmls.map(childHtml => {
        const elementName = `${webObject.name};${byMethod}:${args}`
        return new WebElement(elementName, childHtml)
      }))
    } catch(err) {
      reject(err)
    }
  })
  return promise
}

async function hasClass(webObject, matchingClass) {
  if (webObject instanceof Promise) webObject = await webObject
  if (!webObject) return resolve(null)
  let classList = await seleniumItems.get(webObject).getAttribute(`class`)
  classList = classList.split(` `)
  return classList.includes(matchingClass)
}

async function quitWebDriver(webObject) {
  try {
    if (webObject instanceof Promise) webObject = await webObject
    if (webObject.isCompleted) {
      console.log(`quitWebDriver(${webObject.name}); Skipping this task as webdriver is already quitted`)
      return
    }
    webObject.isCompleted = true
    await seleniumItems.get(webObject).quit()
    seleniumItems.delete(webObject)
    if (webDrivers.length > maxDriversAllowed)
      webDrivers[maxDriversAllowed].carryOn()
    webDrivers.splice(webDrivers.indexOf(webObject), 1)
    console.log(`quitWebDriver(${webObject.name}); Completed; Current webdrivers count: ${webDrivers.length}`)
  } catch(error) {
    console.error(`quitWebDriver(${webObject.name})\n${error}`)
    throw error
  }
}

async function getObject(webObject, keyFunctions) {
  if (webObject instanceof Promise) webObject = await webObject

  const object = {}
  for (const [key, callback] of Object.entries(keyFunctions))
    object[key] = await callback(webObject)
  return object
}

class WebElement {
  constructor(name, seleniumItem) {
    addMethodsOfFinding(this)
    this.name = name
    seleniumItems.set(this, seleniumItem)
  }

  getAttribute(attribute, callback) {
    return getValue(this, 'getAttribute', attribute, callback)
  }

  getCssValue(attribute, callback) {
    return getValue(this, 'getCssValue', attribute, callback)
  }

  hasClass(matchingClass) {
    return hasClass(this, matchingClass)
  }

  getObject(keyFunctions) {
    return getObject(this, keyFunctions)
  }
}

class WebDriver {
  constructor(url, cookies) {
    webDrivers.push(this)
    addMethodsOfFinding(this)
    this.name = url
    this.initialUrl = url
    this.currentUrl = url
    this.aliasUrls = [url]
    this.dependenciesCount = 0
    this.isCompleted = false
    seleniumItems.set(this, new Promise(async (resolve, reject) => {
      try {
        if (webDrivers.length > maxDriversAllowed) {
          console.log(`queueWebDriver(${url}); Position: ${webDrivers.length - maxDriversAllowed}`)
          await new Promise(resolve => this.carryOn = resolve)
        }
        console.log(`createWebDriver(${url}; Current webdrivers count: ${webDrivers.length})`)
        let webDriver = new Builder()
          .forBrowser(`firefox`)
          .setFirefoxOptions(seleniumOptions)
          .build()
        let webDriverGet = webDriver.get(url)
        if (cookies.length) {
          await Promise.all(cookies.map(cookie => webDriver.manage().addCookie(cookie)))
          webDriverGet = webDriver.get(url)
        }
        await webDriverGet
        await webDriver.wait(async () => {
          const readyState = await webDriver.executeScript(`return document.readyState`)
          return readyState === `complete`
        })
        const currentUrl = await webDriver.getCurrentUrl()
        if (url != currentUrl) {
          this.name = currentUrl
          this.currentUrl = currentUrl
          this.aliasUrls.push(currentUrl)
          console.log(`createWebDriver(${url}); Redirected To: ${currentUrl}`)
        }
        console.log(`createWebDriver(${url}); Completed`)
        resolve(webDriver)
      } catch(err) {
        reject(err)
      }
    }))
  }

  getObject(keyFunctions) {
    return getObject(this, keyFunctions)
  }

  quit() {
    return quitWebDriver(this)
  }
}

function getWebDriver(url, cookies=[]) {
  const promise = new Promise(async (resolve, reject) => {
    try {
      if (url instanceof Promise) url = await url
      let webObject = webDrivers.find(_ => _.aliasUrls.includes(url))
      if (webObject) {
        const seleniumDriver = seleniumItems.get(webObject)
        if (seleniumDriver instanceof Promise) await seleniumDriver
      } else {
        webObject = new WebDriver(url, cookies)
        const seleniumDriver = await seleniumItems.get(webObject)
        seleniumItems.set(webObject, seleniumDriver)
      }
      resolve(webObject)
    } catch(err) {
      reject(err)
    }
  })
  addMethodsOfFinding(promise)
  promise.quit = () => quitWebDriver(promise)
  return promise
}

module.exports = getWebDriver
