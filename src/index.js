/** @jsx createElement */
import _ from 'lodash'
import {map} from 'rxjs/operator/map'
import {Observable} from 'rxjs/Observable'

const demoConfig = {
  webSearch: {
    searchEngines: [
      {name: 'Google', url: 'https://www.google.com/search?q=${query}'},
      {name: 'Google Images', url: 'https://www.google.com/search?q=${query}&tbm=isch'},
      {name: 'Google Maps', url: 'https://www.google.com/maps?q=${query}'},
      {name: 'Gmail', url: 'https://www.google.com/search?q=${query}'},
      {name: 'Google Mail', url: 'http://mail.google.com/mail/u/0/#search/${query}'},
      {name: 'Google Inbox', url: 'https://inbox.google.com/search/${query}'},
      {name: 'Google Drive', url: 'https://drive.google.com/drive/u/0/#search?q=${query}'},
      {name: 'Maps', url: 'http://maps.apple.com/?q=${query}'},
      {name: 'Twitter', url: 'https://twitter.com/search?q=${query}'},
      {name: 'Facebook', url: 'https://www.facebook.com/search/results.php?q=${query}'},
      {name: 'LinkedIn', url: 'https://www.linkedin.com/vsearch/p?keywords=${query}'},
      {name: 'Youtube', url: 'https://www.youtube.com/results?search_query=${query}'},
      {name: 'Wikipedia', url: 'https://wikipedia.org/wiki/Special:Search/${query}'},
      {name: 'Amazon', url: 'http://www.amazon.com/s?url=search-alias=aps&field-keywords=${query}&tag=lacona-20'},
      {name: 'eBay', url: 'http://shop.ebay.com/?_nkw=${query}'},
      {name: 'IMDb', url: 'http://www.imdb.com/find?s=all&q=${query}'},
      {name: 'Rotten Tomatoes', url: 'http://www.rottentomatoes.com/search/?search=${query}'},
      {name: 'Bing', url: 'http://www.bing.com/search?q=${query}'},
      {name: 'Yahoo', url: 'https://search.yahoo.com/search?p=${query}'},
      {name: 'Ask', url: 'http://www.ask.com/web?q=${query}'},
      {name: 'Flickr', url: 'https://www.flickr.com/search/?q=${query}&w=all'},
      {name: 'Wolfram|Alpha', url: 'http://www.wolframalpha.com/input/?i=${query}'},
      {name: 'Yubnub', url: 'http://www.yubnub.org/parser/parse?command=${query}'},
      {name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=${query}'}
    ]
  },
  applications: {
    searchDirectories: [],
    applications: []
  }
}

export function isOSX () {
  return process.platform === 'darwin' || !isDemo()
}

export function isDemo () {
  return process.env.LACONA_ENV === 'demo'
}

/* Open */

export function openURL ({url}) {
  if (isOSX())  {
    global.openURL(url)
  }
}

export function openFile ({path}) {
  if (isOSX())  {
    global.openFile(path)
  }
}

/* Events */

export function createEvent ({title, start, end, allDay}, done = () => {}) {
  if (isOSX())  {
    global.createEvent(title, start, end, allDay, done)
  }
}

export function createReminder ({title, date}, done = () => {}) {
  if (isOSX())  {
    global.createReminder(title, date, done)
  }
}

/* Notifications */

export function showNotification ({title, subtitle, content}, done = () => {}) {
  if (isOSX())  {
    global.notify(title, subtitle, content, done)
  }
}

/* Applications */

export function fetchApplications ({directories, appPaths}) {
  if (isDemo()) {
    return new Observable(observer => {
      observer.next(demoData.applications)
    })
  }

  if (isOSX()) {
    const tilde = userHome()
    const trueDirectories = _.map(directories, dir => dir.replace(/^~/, tilde))
    const truePaths = _.map(appPaths, path => path.replace(/^~/, tilde))
    return querySpotlight({
      directories: trueDirectories,
      query: "kMDItemContentTypeTree == 'com.apple.application'",
      attributes: ['kMDItemDisplayName', 'kMDItemCFBundleIdentifier']
    })::map((data) => {
      return _.map(data, ({kMDItemDisplayName, kMDItemCFBundleIdentifier}) => ({
        name: kMDItemDisplayName,
        bundleId: kMDItemCFBundleIdentifier
      }))
    })
  }
}

export function launchApplication ({bundleId}, done = () => {}) {
  if (isOSX()) {
    global.launchApplication(bundleId, done)
  }
}

export function openURLInApplication ({url, bundleId}, done = () => {}) {
  if (isOSX()) {
    global.openURLInApplication(url, bundleId, done)
  }
}

export function openFileInApplication ({path, bundleId}, done = () => {}) {
  if (isOSX()) {
    global.openFileInApplication(path, bundleId, done)
  }
}

export function bundleIdForApplication({name}) {
  return global.bundleIdForApplicationName(name)
}

/* Bookmarks */

export function fetchBookmarks () {
  if (isDemo()) {
    return new Observable(observer => {
      observer.next(demoData.bookmarks)
    })
  }

  if (isOSX()) {
    return querySpotlight({
      query: "kMDItemContentTypeTree = 'com.apple.safari.bookmark'",
      attributes: ['kMDItemDisplayName', 'kMDItemURL']
    })::map((data) => {
      return _.map(data, ({kMDItemDisplayName, kMDItemURL}) => ({
        name: kMDItemDisplayName,
        url: kMDItemURL
      }))
    })
  }
}

/* Contacts */

export function fetchUserContact (done = () => {}) {
  if (isDemo()) {
    return done(null, global.demoData.userContact)
  }

  if (isOSX()) {
    return global.userContact(done)
  }
}

export function fetchContacts (done = () => {}) {
  if (isDemo()) {
    return done(null, global.demoData.contacts)
  }

  if (isOSX()) {
    return global.allContacts(done)
  }
}

/* Files */

export function searchFiles ({query}) {
  if (isDemo()) {
    return new Observable(observer => {
      observer.next(demoData.spotlightFiles)
    })
  }

  if (isOSX()) {
    const escapedQuery = query.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

    return querySpotlight({
      query: `kMDItemFSName BEGINSWITH[cd] "${escapedQuery}" AND ` +
        'kMDItemSupportFileType != "MDSystemFile" AND ' +
        'kMDItemContentTypeTree != "com.apple.application" AND ' +
        'kMDItemContentTypeTree != "com.apple.application-bundle" AND ' +
        'kMDItemContentTypeTree != "com.apple.safari.bookmark" AND ' +
        'kMDItemContentTypeTree != "public.contact" AND ' +
        'kMDItemContentTypeTree != "com.apple.safari.history" AND ' +
        'kMDItemContentTypeTree != "public.calendar-event" AND ' +
        'kMDItemContentTypeTree != "com.apple.ichat.transcript"',
      attributes: ['kMDItemPath', 'kMDItemContentType'],
      limit: 10
    })::map((data) => {
      return _.map(data, ({kMDItemPath, kMDItemContentType}) => ({
        path: kMDItemPath,
        contentType: kMDItemContentType
      }))
    })
  }
}

export function fetchDirectoryContents ({path}, done = () => {}) {
  if (isDemo()) {
    if (_.startsWith(path, '~')) {
      return done(null, global.demoData.rootFiles[`/Users/LaconaUser${path.slice(1)}`])
    } else {
      return done(null, global.demoData.rootFiles[path])
    }
  }

  if (isOSX()) {
    global.getDirectoryContents(path, done)
  }
}

export function userHome () {
  if (isDemo()) {
    return '/Users/LaconaUser'
  }

  if (isOSX()) {
    return global.getUserHome()
  }
}

/* Running Apps */

export function fetchRunningApplications (done = () => {}) {
  if (isDemo()) {
    return done(null, global.demoData.applications)
  }

  if (isOSX()) {
    return global.allRunningApps(done)
  }
}

export function activateApplication ({bundleId}, done = () => {}) {
  if (isOSX()) {
    return global.launchApplication(bundleId, done)
  }
}

export function hideApplication ({bundleId}, done = () => {}) {
  if (isOSX()) {
    return global.hideApplication(bundleId, done)
  }
}

export function closeApplicationWindows ({bundleId}, done = () => {}) {
  if (isOSX()) {
    const script = `
      tell application "System Events"
        set proc to first process whose background only is false and bundle identifier is "${bundleId}"
        repeat with win in proc's windows
          set butt to (win's first button whose subrole is "AXCloseButton")
          click butt
        end repeat
      end tell
    `
    runApplescript({script}, done)
  }
}

export function quitApplication ({bundleId}, done = () => {}) {
  if (isOSX()) {
    global.quitApplication(bundleId, () => {})
  }
}

/* Open Windows */

const openWindowFetchScript = `
  on run
  	tell application "System Events"
  		set allWindows to {}
  		repeat with proc in (processes where background only is false)
  			repeat with win in proc's windows
  				if win's subrole is "AXStandardWindow" then
  					set end of allWindows to {{proc's id, win's name}, win's title, my hasCloseButton(win)}
  				end if
  			end repeat
  		end repeat
  	end tell
  	return allWindows
  end run

  on hasCloseButton(win)
  	tell application "System Events"
  		if win's subrole is "AXStandardWindow" then
  			repeat with butt in win's buttons
  				if butt's subrole is "AXCloseButton" then
  					return true
  				end if
  			end repeat
  		end if
  		return false
  	end tell
  end hasCloseButton
`

export function fetchOpenWindows (done = () => {}) {
  if (isDemo()) {
    return done(null, [])
  }

  if (isOSX()) {
    runApplescript({script: openWindowFetchScript}, (err, data) => {
      if (err) {
        return done(err)
      } else {
    		const result = _.map(data, _.partial(_.zipObject, ['id', 'name', 'closeable'], _))
        return done(null, result)
      }
    })
  }
}

export function closeOpenWindow ({id}, done = () => {}) {
  if (isOSX()) {
  }
}

export function activateOpenWindow ({id}, done = () => {}) {
  if (isOSX()) {
    const [procId, name] = id

    const script = `
      tell application "System Events"
        set proc to first process whose background only is false and id is ${procId}
        set win to proc's first window whose name is "${name}"
        perform action "AXRaise" of win
        set proc's frontmost to true
      end tell
    `

    runApplescript({script}, done)
  }
}

/* Browser Tabs */

const browserFetchScript = `
  -- set chromeTabs to {}
  set safariTabs to {}

  -- if is_running("Google Chrome") then
    -- set chromeTabs to run script "
      -- set allTabs to {}
      -- tell application \\"Google Chrome\\"
        -- repeat with win in every window
          -- repeat with t in win's tabs
            -- set end of allTabs to {\\"Google Chrome\\", {\\"Google Chrome\\", t's id}, title of t}
          -- end repeat
        -- end repeat
      -- end tell
      -- return allTabs
    -- "
  -- end if

  if is_running("Safari") then
    set safariTabs to run script "
      set allTabs to {}
      tell application \\"Safari\\"
        repeat with win in (windows where visible is true)
          repeat with t in win's tabs
            set end of allTabs to {\\"Safari\\", {\\"Safari\\", {win's index, t's index}}, t's name}
          end repeat
        end repeat
      end tell
      return allTabs
    "
  end if

  on is_running(appName)
    tell application "System Events" to (name of processes) contains appName
  end is_running

  -- return chromeTabs & safariTabs
  return safariTabs
`

export function fetchBrowserTabs (done = () => {}) {
  if (isDemo()) {
    return done(null, [])
  }

  if (isOSX()) {
    runApplescript({script: browserFetchScript}, (err, data) => {
      if (err) {
        return done(err)
      } else {
        const result = _.map(data, _.partial(_.zipObject, ['appName', 'id', 'name'], _))
        return done(null, result)
      }
    })
  }
}

export function activateBrowserTab (id, done = () => {}) {
  if (isOSX()) {
    const [appName, id] = id
    if (appName === 'Google Chrome') {
      script = `
        tell application "Google Chrome"
          repeat with wi from 1 to count windows
            repeat with ti from 1 to count (window wi's tabs)
              if id of window wi's tab ti is ${id} then
                set theTab to ti
                set theWin to wi
              end if
            end repeat
          end repeat

          set window theWin's active tab index to theTab
          set window theWin's index to 1
          activate
        end tell
      `
      runApplescript({script}, done)
    } else if (appName === 'Safari') {
      // TODO THIS DOES NOT WORK

      const [winId, tabId] = id
      script = `
        tell application "Safari"
          activate
          set win to window ${winId}
          set win's current tab to win's tab ${tabId}
          set win's index to 1
        end tell
      `
      runApplescript({script}, done)
    }
  }
}

export function closeBrowserTab ({id}, done = () => {}) {
  if (isOSX()) {

  }
}

/* Preference Panes */

export function fetchPreferencePanes () {
  if (isDemo()) {
    return new Observable(observer => {
      observer.next(demoData.preferencePanes)
    })
  }

  if (isOSX()) {
    return querySpotlight({
      query: "kMDItemContentType == 'com.apple.systempreference.prefpane'",
      attributes: ['kMDItemDisplayName', 'kMDItemPath']
    })::map((data) => {
      return _.map(data, ({kMDItemDisplayName, kMDItemPath}) => ({name: kMDItemDisplayName, path: kMDItemPath}))
    })
  }
}

/* Settings */

export function setBluetooth ({enabled}, done = () => {}) {
  if (isOSX()) {
    global.setBluetoothEnabled(enabled, done)
  }
}

export function checkBluetooth (done = () => {}) {
  if (isOSX()) {
    global.checkBluetoothEnabled((err, enabled) => {
      err ? done(err) : done(null, {enabled})
    })
  }
}

export function setDarkMode ({enabled}, done = () => {}) {
  if (isOSX()) {
    global.setDarkModeEnabled(enabled, done)
  }
}

export function checkDarkMode (done = () => {}) {
  if (isOSX()) {
    global.checkDarkModeEnabled((err, enabled) => {
      err ? done(err) : done(null, {enabled})
    })
  }
}
export function setWifi ({enabled}, done = () => {}) {
  if (isOSX()) {
    callSystem({
      command: '/usr/sbin/networksetup',
      args: ['-setairportpower', 'en0', enabled ? 'on' : 'off']
    }, done)
  }
}

export function checkWifi (done = () => {}) {
  if (isOSX()) {
    callSystem({
      command: '/usr/sbin/networksetup',
      args: ['-getairportpower', 'en0']
    }, (err, results) => {
      if (err) {
        done(err)
      } else {
        const enabled = _.includes(results, 'On')
        done(null, {enabled})
      }
    })
  }
}

export function setDoNotDisturb ({enabled}, done = () => {}) {
  if (isOSX()) {
    if (enabled) {
      callSystem({
        command: '/bin/bash',
        args: ['-c', 'defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean true; defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturbDate -date "`date -u +\\"%Y-%m-%d %H:%M:%S +000\\"`"; killall NotificationCenter']
      }, done)
    } else {
      callSystem({
        command: '/bin/bash',
        args: ['-c', 'defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean false; killall NotificationCenter']
      }, done)
    }
  }
}

export function checkDoNotDisturb (done = () => {}) {
  if (isOSX()) {
    callSystem({
      command: '/usr/bin/defaults',
      args: ['-currentHost', 'read', `${userHome()}/Library/Preferences/ByHost/com.apple.notificationcenterui`, 'doNotDisturb']
    }, (err, results) => {
      if (err) {
        done(err)
      } else {
        const enabled = _.contains(results, '1')
        done(null, {enabled})
      }
    })
  }
}

export function setVolume ({mute}, done = () => {}) {
  if (isOSX()) {
    const script = `set volume ${mute ? 'with' : 'without'} output muted`
    runApplescript({script}, done)
  }
}

export function checkVolume (done = () => {}) {
  if (isOSX()) {
    const script = `output muted of (get volume settings)`
    runApplescript({script}, (err, output) => {
      if (err) {
        done(err)
      } else {
        done(null, {mute: output})
      }
    })
  }
}

export function shutdown (done = () => {}) {
  if (isOSX()) {
    runApplescript({script: 'tell application "System Events" to shut down'}, done)
  }
}

export function restart (done = () => {}) {
  if (isOSX()) {
    runApplescript({script: 'tell application "System Events" to restart'}, done)
  }
}

export function logOut (done = () => {}) {
  if (isOSX()) {
    runApplescript({script: 'tell application "System Events" to log out'}, done)
  }
}

export function sleep (done = () => {}) {
  if (isOSX()) {
    runApplescript({script: 'tell application "System Events" to sleep'}, done)
  }
}

export function lock (done = () => {}) {
  if (isOSX()) {
    callSystem({
      command: '/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession',
      args: ['-suspend']
    }, done)
  }
}

export function hibernate (done = () => {}) {}

export function turnOffDisplay (done = () => {}) {
  if (isOSX()) {
    callSystem({
      command: '/usr/bin/pmset',
      args: ['displaysleepnow']
    }, done)
  }
}

export function turnOnScreensaver (done = () => {}) {
  if (isOSX()) {
    runApplescript({script: 'tell application "System Events" to start current screen saver'}, done)
  }
}

export function emptyTrash (done = () => {}) {
  if (isOSX()) {
    runApplescript({script: 'tell application "Finder" to empty the trash'}, done)
  }
}

/* Mounted Volumes */

export function fetchMountedVolumes(done = () => {}) {
  if (isDemo()) {
    return done(null, global.demoData.volumes)
  }

  if (isOSX()) {
    return global.mountedVolumes(done)
  }
}

export function unmountVolume ({id}, done = () => {}) {
  if (isOSX()) {
    const script = `tell application "Finder" to eject "${id}"`
    runApplescript({script}, done)
  }
}

export function unmountAllVolumes(_, done = () => {}) {
  if (isOSX()) {
    const script = 'tell application "Finder" to eject the disks'
    runApplescript({script}, done)
  }
}

/* Music */

function simplifyArtist(item) {
  const {albumArtist, artist} = item
  item.artist = albumArtist || artist
  delete item.albumArtist
}

function sortStringAsInteger(key) {
  return (item) => parseInt(item[key], 10)
}

function arrangeOSXMusic (arrays) {
  return _.chain(arrays)
    .thru(_.spread(_.zip))
    .map(_.partial(_.zipObject, ['name', 'album', 'artist', 'albumArtist', 'composer', 'genre', 'year', 'discNumber', 'trackNumber', 'id']))
    .tap(items => _.forEach(items, simplifyArtist))
    .sortBy([simplifyArtist, sortStringAsInteger('year'), 'album', sortStringAsInteger('discNumber'), sortStringAsInteger('trackNumber'), sortStringAsInteger('id')])
    .value()
}

export function fetchMusic (done) {
  if (isDemo()) {
    return done(null, global.demoData.music)
  }

  if (isOSX()) {
    const script = 'tell application "iTunes" to get {name, album, artist, album artist, composer, genre, year, disc number, track number, database ID} of every track of first library playlist'

    runApplescript({script}, (err, arrays) => {
      if (err) {
        return done(err)
      }

      const arranged = arrangeOSXMusic(arrays)

      done(null, arranged)
    })
  }
}

export function playSongIds ({ids}) {
  const script = `
    tell application "iTunes"
      if user playlist "Lacona Playlist" exists then
        try
          delete user playlist "Lacona Playlist"
        end try
      end if

      make new user playlist with properties {name:"Lacona Playlist", shuffle: false}

      repeat with tid in {${ids.join(',')}}
        set trk to (some track of first user playlist whose database ID is tid)
        duplicate trk to end of user playlist "Lacona Playlist"
      end repeat

      play user playlist "Lacona Playlist"
    end tell
  `
  runApplescript({script})
}

export function musicPlay () {
  if (isOSX()) {
    runApplescript({script: 'tell application "iTunes" to play'})
  }
}

export function musicPause () {
  if (isOSX()) {
    runApplescript({script: 'tell application "iTunes" to pause'})
  }
}

export function musicNext () {
  if (isOSX()) {
    runApplescript({script: 'tell application "iTunes" to next track'})
  }
}

export function musicPrevious () {
  if (isOSX()) {
    runApplescript({script: 'tell application "iTunes" to previous track'})
  }
}

export function musicStop () {
  if (isOSX()) {
    runApplescript({script: 'tell application "iTunes" to stop'})
  }
}

/* OSX specific */

export function runApplescript ({script}, done = () => {}) {
  if (isOSX()) {
    global.applescript(script, done)
  }
}

export function querySpotlight ({query = '', attributes = [], directories = [],
  limit = 0, liveUpdate = false}) {
  return new Observable(observer => {
    observer.next([])

    const queryId = global.spotlight(query, attributes, directories,
      limit, liveUpdate, (err, data) => {
      if (err) {
        observer.error(err)
      } else {
        observer.next(data)
      }
    })

    return () => global.cancelQuery(queryId)
  })
}

export function callSystem ({command, args = []}, done) {
  global.system(command, args, done)
}

/* Config and Context */

const subscription = new Observable(observer => {
  let subscriptionId

  if (isDemo()) {
    observer.next(global.demoConfig)
  } else if (isOSX()) {
    const {subscriptionId, value} = global.subscribeToChanges((value) => {
      observer.next(value)
    })
    observer.next(value)
    return () => {
      global.removeChangeSubscription(subscriptionId)
    }
  }
})

export function Config ({props}) {
  return subscription::map(x => x.config[props.property])
}
