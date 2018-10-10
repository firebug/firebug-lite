# Firebug Lite

## Local Installation

Install these files:

- `build/firebug-lite.js` -> `/firebug-lite/firebug-lite.js`
- `build/firebug-lite-beta.js` -> `/firebug-lite/firebug-lite-beta.js`
- `build/firebug-lite-debug.js` -> `/firebug-lite/firebug-lite-debug.js`
- `skin/**` -> `/firebug-lite/skin/**`

HTML:

```html
  <script src="/firebug-lite/firebug-lite.js#skinDir='firebug-lite/skin'"></script>
  <!-- OR -->
  <script src="/firebug-lite/firebug-lite.js">
    { skinDir: 'firebug-lite/skin' }
  </script>
```

Available options:

- saveCookies
- saveWindowPosition
- saveCommandLineHistory
- startOpened
- startInNewWindow
- showIconWhenHidden
- overrideConsole
- ignoreFirebugElements
- disableWhenFirebugActive
- enableTrace
- enablePersistent

There are other options available... Search for `this.Env =`...
