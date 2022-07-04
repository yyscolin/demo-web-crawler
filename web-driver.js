/**
 * Ensure geckodriver.exe and firefox.exe is in environment PATH for Windows
 * Ensure firefox bin path is listed in .env file for Linux
*/
const {Builder, By} = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')

const maxDriversAllowed = parseInt(process.env.MAX_DRIVERS_COUNT || 1)
const webDrivers = []

const seleniumItems = new Map()

const seleniumOptions = new firefox.Options()
if (process.env.FIREFOX_BIN) seleniumOptions.setBinary(process.env.FIREFOX_BIN)

function extendCommonMethods(webObject) {
  function findElement(byMethod, ...args) {
    return new WebElementPromise(async (resolve, reject) => {
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
        resolve(htmlElement || null)
      } catch(err) {
        reject(err)
      }
    })
  }

  function findElements(byMethod, ...args) {
    const promise = new Promise(async (resolve, reject) => {
      try {
        if (webObject instanceof Promise) webObject = await webObject
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

  webObject.findElementByClassName = function(name) {
    return findElement(`className`, name)
  }

  webObject.findElementByCss = function(selector) {
    return findElement(`css`, selector)
  }

  webObject.findElementById = function(id) {
    return findElement(`id`, id)
  }

  webObject.findElementByJs = function(script, ...var_args) {
    return findElement(`js`, script, ...var_args)
  }

  webObject.findElementByLinkText = function(text) {
    return findElement(`linkText`, text)
  }

  webObject.findElementByName = function(name) {
    return findElement(`name`, name)
  }

  webObject.findElementByPartialLinkText = function(text) {
    return findElement(`partialLinkText`, text)
  }

  webObject.findElementByXpath = function(xpath) {
    return findElement(`xpath`, xpath)
  }

  webObject.findElementsByClassName = function(name) {
    return findElements(`className`, name)
  }

  webObject.findElementsByCss = function(selector) {
    return findElements(`css`, selector)
  }

  webObject.findElementsById = function(id) {
    return findElements(`id`, id)
  }

  webObject.findElementsByJs = function(script, ...var_args) {
    return findElements(`js`, script, ...var_args)
  }

  webObject.findElementsByLinkText = function(text) {
    return findElements(`linkText`, text)
  }

  webObject.findElementsByName = function(name) {
    return findElements(`name`, name)
  }

  webObject.findElementsByPartialLinkText = function(text) {
    return findElements(`partialLinkText`, text)
  }

  webObject.findElementsByXpath = function(xpath) {
    return findElements(`xpath`, xpath)
  }
}

function extendWebDriverMethods(webDriver) {
  webDriver.quit = async function() {
    try {
      if (webDriver instanceof Promise) webDriver = await webDriver
      if (webDriver.isCompleted) {
        console.log(`quitWebDriver(${webDriver.name}); Skipping this task as webdriver is already quitted`)
        return
      }
      webDriver.isCompleted = true
      await seleniumItems.get(webDriver).quit()
      seleniumItems.delete(webDriver)
      if (webDrivers.length > maxDriversAllowed)
        webDrivers[maxDriversAllowed].carryOn()
      webDrivers.splice(webDrivers.indexOf(webDriver), 1)
      console.log(`quitWebDriver(${webDriver.name}); Completed; Current webdrivers count: ${webDrivers.length}`)
    } catch(error) {
      console.error(`quitWebDriver(${webDriver.name})\n${error}`)
      throw error
    }
  }
}

function extendWebElementMethods(webElement) {
  async function getValue(getMethod, modification, attribute) {
    if (webElement instanceof Promise) webElement = await webElement
    if (!webElement) return null
    let value = await seleniumItems.get(webElement)[getMethod](attribute)
    if (value && modification) value = modification(value)
    return value
  }

  async function hasClass(className) {
    if (webElement instanceof Promise) webElement = await webElement
    if (!webElement) return null
    let classList = await seleniumItems.get(webElement).getAttribute(`class`)
    classList = classList ? classList.split(` `) : []
    return classList.includes(className)
  }

  webElement.getAttribute = function(attributeName, modification) {
    return getValue(`getAttribute`, modification, attributeName)
  }

  webElement.getCssValue = function(cssStyleProperty, modification) {
    return getValue(`getCssValue`, modification, cssStyleProperty)
  }

  webElement.getId = function(modification) {
    return getValue(`getId`, modification)
  }

  webElement.getRect = function(modification) {
    return getValue(`getRect`, modification)
  }

  webElement.getTagName = function(modification) {
    return getValue(`getTagName`, modification)
  }

  webElement.getText = function(modification) {
    return getValue(`getText`, modification)
  }

  webElement.hasClass = function(className) {
    return hasClass(className)
  }
}

class WebDriver {
  constructor(url, cookies) {
    webDrivers.push(this)
    extendCommonMethods(this)
    extendWebDriverMethods(this)
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
}

class WebElement {
  constructor(name, seleniumItem) {
    extendCommonMethods(this)
    extendWebElementMethods(this)
    this.name = name
    seleniumItems.set(this, seleniumItem)
  }
}

class WebDriverPromise extends Promise {
  constructor(...args) {
    super(...args)
    extendCommonMethods(this)
    extendWebDriverMethods(this)
  }
}

class WebElementPromise extends Promise {
  constructor(...args) {
    super(...args)
    extendCommonMethods(this)
    extendWebElementMethods(this)
  }
}

function getWebDriver(url, cookies=[]) {
  return new WebDriverPromise(async (resolve, reject) => {
    try {
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
}

module.exports = getWebDriver
