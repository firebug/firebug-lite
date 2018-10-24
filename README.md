# Firebug Lite

## Why?

Firebug Lite is sometimes the only option to debug the page, especially on some very old embedded
devices like hand scanners running Mobile IE6 or Mobile IE7.

This is unofficial fork!!!

## Local Installation

NOTE: Only `/build/firebug-lite-debug.js` is supported version in this repo (the most stable).

Install these files:

- `build/firebug-lite-debug.js` -> `/firebug-lite/firebug-lite-debug.js`
- `skin/**` -> `/firebug-lite/skin/**`

HTML:

```html
  <!-- This way works well in desktop IE (Windows XP) -->
  <!-- IMPORTANT: skinDir should have trailing / -->
  <script src="/firebug-lite/firebug-lite-debug.js#debug=false,overrideConsole=true,skinDir='/firebug-lite/skin/xp/'"></script>
  <!-- This way works well in mobile IE (Windows CE) -->
  <script src="/firebug-lite/firebug-lite-debug.js">
    { debug: false, overrideConsole: true, skinDir: '/firebug-lite/skin/xp/' }
  </script>
```

Available options:

- skinDir - (unofficial)
- debug - enable/disable default firebug developer debug mode (not needed in most cases)
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
- disableXHRListener

There are other options available... Search for `this.Env =`...
