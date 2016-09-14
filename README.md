# lacona-api
Cross-platform API for use with Lacona commands

## Environment Detection

### isOSX

```js
isOSX -> Boolean
```

Returns `true` if the system is running on Mac OSX.

### isDemo

```js
isDemo -> Boolean
```

Returns `true` if the system is running in a Demo environment.

## Javascript Helpers

The Lacona Javascript execution environment does not include a few common
JS features - Lacona reimplements them.

### setTimeout

```js
setTimeout(done: Callback<Any>, ms: Number) -> Any
```

Calls `done` after `ms` ms.
Returns an opaque value which can be passed to `clearTimeout`.

### clearTimeout

```js
clearTimeout(opaque: Any)
```

Cancels a timeout started by `setTimeout`.

## Low-level functions

Use these for implementing new functionality that is not provided by lacona-api.
If you have functionality that you believe would be useful to other commands,
please open an issue and work toward adding it to the core - that will provide
improved performance and reliability across platforms.

### runApplescript

```js
runApplescript({script: String}, done: Callback<Any>)
```

Run `script` as an applescript script. Any value returned will be exported
as a JSON object and provided to `done`.

=======
This function does nothing if run on non-OSX environments.

### fetchSpotlight

```js
fetchSpotlight({
  query: String,
  attributes: Array<String>,
  directories: Array<String>,
  limit: Integer
}) -> Promise<Array<Object>>
=======
```

Queries Spotlight once and closes the query. Returns an Promise.

### watchSpotlight

```js
watchSpotlight({
  query: String,
  attributes: Array<String>,
  directories: Array<String>,
  limit: Integer
}) -> Observable<Array<Object>>
```

Queries Spotlight, and returns an Observable, which emits
the entire query results everytime new data is found.

Cancels the query when unsubscribed.

### callNode

**No longer used, as all Lacona commands now have access to a full node.js environment**

### callSystem

**No longer use - use `child_process` instead**

### showNotification

```js
showNotification({
  title: String,
  subtitle: String,
  content: String
}, done: Callback<void>)
```

Displays an OS notification (using Notification Center, on OSX).

### fetchUserDefaults

```js
fetchUserDefaults({
  domain: String,
  key: String
}, done: Callback<Any>)
```

Fetch system defaults. If no `key` is provided, it will fetch an Object
representing the entire domain. Equivalent to using `defaults read`.

## Opening Things

### openURL

```js
openURL({url: String}) -> void
```

Opens a given URL (with a protocol) in the default handler.

### openFile

```js
openFile({path: String}) -> void
```

Opens a given file in the default handler. Leading `~` will be expanded.

## Working with Applications

### fetchApplications

```js
fetchApplications({
  directories: Array<String>,
  appPaths: Array<String>
}) -> Observable<{name: String, bundleId: String}>
```

Creates a live spotlight query for Applications - recursively
searching the given `directories`, and adding the apps at `appPaths`

### launchApplication

```js
launchApplication({bundleId: String})
```

### openURLInApplication

```js
openURLInApplication({url: String, bundleId: String})
```

### openFileInApplication

```js
openFileInApplication({path: String, bundleId: String})
```

### bundleIdForApplication

```js 
bundleIdForApplication({name}) -> String
```

Syncronously returns the Bundle ID for a given application name.

> bundleIdForApplication({name: "Safari"}) === "com.apple.safari"

## Contacts, Calendars, and Reminders

### createEvent

```js
createEvent({
  title: String,
  start: Date,
  end: Date,
  allDay: Boolean
}, done: Callback<void>)
```

Creates an event on the default calendar. Calls `done` with an error or nothing.

### createReminder

```js
createReminder({
  title: String,
  date: Date
}) -> void

Creates a reminder on the default list. Calls `done` with an error or nothing.

### fetchUserContact

```js
fetchUserContact(Callback<Object>)
```

Returns the contact that the user has set as their own.

### fetchContacts

```js
fetchContacts(Callback<Object>)

Returns all contacts on the system.

## Working with Bookmarks

### fetchBookmarks

```js
fetchBookmarks() -> Observable<{name:String, url: String}>
```

Creates a live spotlight query for Bookmarks. `url` can be opened using
`openUrl({url})`.

## Working with Files

### searchFiles

```js
searchFiles({
  query: String
}) -> Observable<{path: String, contentType: String}>
```

Creates a non-live spotlight query that searches filenames for a given string.
This search is case- and diacritic-insensitive. It does not search
applications, system files, bookmarks, contacts, browser history, calendar
events, or chat transcripts.

### fetchDirectoryContents

```js
fetchDirectoryContents({path: String}, done: Callback<Array<Object>>)
```

Returns the contents of a given directory.

### userHome

```js
userHome() -> String
```

Returns the user's home directory.

## Working with Mounted Volumes

### fetchMountedVolumes

### unmountVolume

### unmountAllVolumes

## Working with Running Applications

### fetchRunningApplications

### activateApplication

### hideApplication

### quitApplication

## Working with Application Windows

### closeApplicationWindows

### fetchOpenWindows

### closeOpenWindow

### activateOpenWindow

## Working with Browser Tabs

### fetchBrowserTabs

### activateBrowserTab

### closeBrowserTab

## Working with Preference Panes

### fetchPreferencePanes

## Working with iTunes

### fetchMusic

### playSongIds

### musicPlay

### musicPause

### musicNext

### musicPrevious

### musicStop

## Working with System Settings

### setBluetooth

### checkBluetooth

### setDarkMode

### checkDarkMode

### setWifi

### checkWifi

### setDoNotDisturb

### checkDoNotDisturb

### setVolume

### checkVolume

## System Events

### shutdown

### restart

### logOut

### sleep

### lock

### hibernate

### turnOffDisplay

### turnOnScreensaver

### emptyTrash

### openLaconaPreferences

### reloadAddons
