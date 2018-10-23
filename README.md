# Firebug Lite

## Local Installation

Please note, `debug` version is well-known to work well on IE6/7.

Install these files:

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
