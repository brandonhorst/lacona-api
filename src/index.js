/** @jsx createElement */
import _ from 'lodash'
import {map} from 'rxjs/operator/map'
import {Observable} from 'rxjs/Observable'
import {v4 as guid} from 'node-uuid'
import {exec} from 'child_process'

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

const SEND_KEY = Symbol.for("io.lacona.lacona.api.send");

export function __set_send (send) {
  global[SEND_KEY] = send
}

function send(type, data = {}) {
  return new Promise((resolve, reject) => {
    global[SEND_KEY](type, data, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

export function isOSX () {
  return process.platform === 'darwin' || !isDemo()
}

export function isDemo () {
  return process.env.LACONA_ENV === 'demo'
}

/* Open */

function open ({url, path, bundleId}) {
  if (isOSX()) {
    return send('OPEN', {url, path, bundleId})
  }
}

export function openURL ({url}) {
  return open({url})
}

export function openFile ({path}) {
  return open({path})
}

/* Events */

export function createEvent ({title, start, end, allDay}) {
  if (isOSX())  {
    return send('CREATE_EVENT', {title, start, end, allDay})
  }
}

export function createReminder ({title, date}) {
  if (isOSX())  {
    return send('CREATE_REMINDER', {title, date})
  }
}

/* Notifications */

export function showNotification ({title, subtitle, content}) {
  if (isOSX())  {
    return send('SHOW_NOTIFICATION', {title, subtitle, content})
  }
}

/* Applications */

export function watchApplications ({directories, appPaths}) {
  if (isDemo()) {
    return new Observable(observer => {
      observer.next(demoData.applications)
    })
  }

  if (isOSX()) {
    const tilde = userHome()
    const trueDirectories = _.map(directories, dir => dir.replace(/^~/, tilde))
    const truePaths = _.map(appPaths, path => path.replace(/^~/, tilde))
    return watchSpotlight({
      directories: trueDirectories,
      query: "kMDItemContentTypeTree == 'com.apple.application'",
      attributes: ['kMDItemDisplayName', 'kMDItemCFBundleIdentifier', 'kMDItemAlternateNames']
    })::map((data) => {
      return _.map(data, item => ({
        name: item.kMDItemDisplayName,
        bundleId: item.kMDItemCFBundleIdentifier,
        alternativeNames: item.kMDItemAlternateNames
      }))
    })
  }
}

export function launchApplication ({bundleId}) {
  return open({bundleId})
}

export function openURLInApplication ({url, bundleId}) {
  return open({url, bundleId})
}

export function openFileInApplication ({path, bundleId}) {
  return open({path, bundleId})
}

export function fetchApplication({name}) {
  return send('FETCH_APPLICATION_INFO', {name})
}

/* Bookmarks */

export function watchBookmarks () {
  if (isDemo()) {
    return new Observable(observer => {
      observer.next(demoData.bookmarks)
    })
  }

  if (isOSX()) {
    return watchSpotlight({
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

export function fetchUserContact () {
  if (isDemo()) {
    return Promise.resolve(global.demoData.userContact)
  }

  if (isOSX()) {
    return send('FETCH_USER_CONTACT')
  }
}

export function fetchContacts () {
  if (isDemo()) {
    return Promise.resolve(global.demoData.contacts)
  }

  if (isOSX()) {
    return send('FETCH_ALL_CONTACTS')
  }
}

/* Files */

export async function fetchFiles ({query}) {
  if (isDemo()) {
    return Promise.resolve(demoData.spotlightFiles)
  }

  if (isOSX()) {
    const escapedQuery = _.chain(query.split(''))
      .map(char => {
        return char
          .replace('*', '\\*')
          .replace('\\', '\\\\')
          .replace('"', '\\"')
          // .replace("'", "\\'")
      })
      .join('*')
      .value()


     const data = await fetchSpotlight({
      query: `kMDItemFSName LIKE[cd] "*${escapedQuery}*" AND ` +
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
    })

    return _.map(data, ({kMDItemPath, kMDItemContentType}) => ({
      path: kMDItemPath,
      contentType: kMDItemContentType
    }))
  }
}

export function userHome () {
  if (isDemo()) {
    return '/Users/LaconaUser'
  }

  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']
}

/* Running Apps */

export function fetchRunningApplications () {
  if (isDemo()) {
    return Promise.resolve(global.demoData.applications)
  }

  if (isOSX()) {
    return send('FETCH_RUNNING_APPLICATIONS')
  }
}

export function activateApplication ({bundleId}) {
  if (isOSX()) {
    return open({bundleId})
  }
}

export function hideApplication ({bundleId}) {
  if (isOSX()) {
    return send('HIDE', {bundleId})
  }
}

export function closeApplicationWindows ({bundleId}) {
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
    return runApplescript({script})
  }
}

export function quitApplication ({bundleId}) {
  if (isOSX()) {
    return send('QUIT', {bundleId})
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

export async function fetchOpenWindows () {
  if (isDemo()) {
    return []
  }

  if (isOSX()) {
    const data = await runApplescript({script: openWindowFetchScript})
    return _.map(data, _.partial(_.zipObject, ['id', 'name', 'closeable'], _))
  }
}

export function closeOpenWindow ({id}) {
  if (isOSX()) {
    //NOT IMPLEMENTED
  }
}

export function activateOpenWindow ({id}) {
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

    return runApplescript({script})
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

export async function fetchBrowserTabs () {
  if (isDemo()) {
    return []
  }

  if (isOSX()) {
    const data = await runApplescript({script: browserFetchScript})
    return _.map(data, _.partial(_.zipObject, ['appName', 'id', 'name'], _))
  }
}

export function activateBrowserTab (id) {
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
      return runApplescript({script})
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
      return runApplescript({script})
    }
  }
}

export function closeBrowserTab ({id}) {
  if (isOSX()) {
    //not yet implemented
  }
}

/* Preference Panes */

export function watchPreferencePanes () {
  if (isDemo()) {
    return new Observable(observer => {
      observer.next(demoData.preferencePanes)
    })
  }

  if (isOSX()) {
    return watchSpotlight({
      query: "kMDItemContentType == 'com.apple.systempreference.prefpane'",
      attributes: ['kMDItemDisplayName', 'kMDItemPath']
    })::map((data) => {
      return _.map(data, ({kMDItemDisplayName, kMDItemPath}) => ({name: kMDItemDisplayName, path: kMDItemPath}))
    })
  }
}

/* Settings */

export function setBluetooth ({enabled}) {
  if (isOSX()) {
    return send('SET_BLUETOOTH', {enabled})
  }
}

export function checkBluetooth () {
  if (isOSX()) {
    return send('CHECK_BLUETOOTH')
  }
}

export function setDarkMode ({enabled}) {
  if (isOSX()) {
    return send('SET_DARK_MODE', {enabled})
  }
}

export function checkDarkMode () {
  if (isOSX()) {
    return send('CHECK_DARK_MODE')
  }
}

function callSystem (command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve(stdout)
      }
    })
  })
}

export async function setWifi ({enabled}) {
  if (isOSX()) {
    await callSystem(`/usr/sbin/networksetup -setairportpower en0 ${enabled ? 'on' : 'off'}`)
    return
  }
}
export async function checkWifi () {
  if (isOSX()) {
    const stdout = await callSystem('/usr/sbin/networksetup -getairportpower en0')
    return _.includes(results, 'On')
  }
}

export async function setDoNotDisturb ({enabled}) {
  if (isOSX()) {
    if (enabled) {
      await callSystem('defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean true; defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturbDate -date "`date -u +\\"%Y-%m-%d %H:%M:%S +000\\"`"; killall NotificationCenter')
    } else {
      await callSystem('defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean false; killall NotificationCenter')
    }
    return
  }
}

export async function checkDoNotDisturb () {
  if (isOSX()) {
    const stdout = await callSystem(`/usr/bin/defaults -currentHost read ${userHome()}/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb`)
    return _.includes(results, '1')
  }
}

export function setVolume ({mute}) {
  if (isOSX()) {
    const script = `set volume ${mute ? 'with' : 'without'} output muted`
    return runApplescript({script})
  }
}

export async function checkVolume () {
  if (isOSX()) {
    const script = `output muted of (get volume settings)`
    const output = await runApplescript({script})
    return {mute: output}
  }
}

export function shutdown () {
  if (isOSX()) {
    return runApplescript({script: 'tell application "System Events" to shut down'})
  }
}

export function restart () {
  if (isOSX()) {
    return runApplescript({script: 'tell application "System Events" to restart'})
  }
}

export function logOut () {
  if (isOSX()) {
    return runApplescript({script: 'tell application "System Events" to log out'})
  }
}

export function sleep () {
  if (isOSX()) {
    return runApplescript({script: 'tell application "System Events" to sleep'})
  }
}

export function lock () {
  if (isOSX()) {
    return callSystem('/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession -suspend')
  }
}

export function hibernate () {}

export function turnOffDisplay () {
  if (isOSX()) {
    return callSystem('/usr/bin/pmset displaysleepnow')
  }
}

export function turnOnScreensaver () {
  if (isOSX()) {
    return runApplescript({script: 'tell application "System Events" to start current screen saver'})
  }
}

export function emptyTrash () {
  if (isOSX()) {
    return runApplescript({script: 'tell application "Finder" to empty the trash'})
  }
}

/* Mounted Volumes */

export function fetchMountedVolumes() {
  if (isDemo()) {
    return Promise.resolve(global.demoData.volumes)
  }

  if (isOSX()) {
    return send('FETCH_MOUNTED_VOLUMES')
  }
}

export function unmountVolume ({id}) {
  if (isOSX()) {
    const script = `tell application "Finder" to eject "${id}"`
    return runApplescript({script})
  }
}

export function unmountAllVolumes() {
  if (isOSX()) {
    const script = 'tell application "Finder" to eject the disks'
    return runApplescript({script})
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

export async function fetchMusic () {
  if (isDemo()) {
    return global.demoData.music
  }

  if (isOSX()) {
    const script = 'tell application "iTunes" to get {name, album, artist, album artist, composer, genre, year, disc number, track number, database ID} of every track of first library playlist'

    const arrays = await runApplescript({script})
    return arrangeOSXMusic(arrays)
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
  return runApplescript({script})
}

export function musicPlay () {
  if (isOSX()) {
    return runApplescript({script: 'tell application "iTunes" to play'})
  }
}

export function musicPause () {
  if (isOSX()) {
    return runApplescript({script: 'tell application "iTunes" to pause'})
  }
}

export function musicNext () {
  if (isOSX()) {
    return runApplescript({script: 'tell application "iTunes" to next track'})
  }
}

export function musicPrevious () {
  if (isOSX()) {
    return runApplescript({script: 'tell application "iTunes" to previous track'})
  }
}

export function musicStop () {
  if (isOSX()) {
    return runApplescript({script: 'tell application "iTunes" to stop'})
  }
}

/* OSX specific */

export function runApplescript ({script}) {
  if (isOSX()) {
    return send('RUN_APPLESCRIPT', {script})
  }
}

export function fetchSpotlight ({query = '', attributes = [], directories = [], limit = 0}) {
  const queryId = guid()
  
  return send('QUERY_SPOTLIGHT', {
    query,
    queryId,
    attributes,
    directories,
    limit,
    liveUpdate: false
  })
}

export function watchSpotlight ({query = '', attributes = [], directories = [], limit = 0}) {
  return new Observable(observer => {
    observer.next([])
    const queryId = guid()

    global[SEND_KEY]('QUERY_SPOTLIGHT', {
      query,
      queryId,
      attributes,
      directories,
      limit,
      liveUpdate: true
    }, (err, data) => {
      if (err) {
        console.error(err)
      } else {
        observer.next(data)
      }
    })

    return () => global[SEND_KEY]('CANCEL_SPOTLIGHT_QUERY', {queryId})
  })
}

export function reloadAddons () {
  return send('RELOAD_ADDONS')
}

/* Config and Context */

export function openLaconaPreferences () {
  return send('OPEN_LACONA_PREFERENCES')
}