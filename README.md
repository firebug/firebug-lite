# Firebug Lite for IE

## Why?

Firebug Lite is sometimes the only option to debug the page, especially on some very old embedded
devices like hand scanners running Mobile IE6 or Mobile IE7.

Forked from `firebug/firebug-lite`, original package is not maintained anymore.

This is unofficial fork!!!

## Installation

NOTE: Only `/build/firebug-lite-debug.js` is supported version in this repo (the most stable).

Install these files:

- `build/firebug-lite-debug.js` -> `/firebug-lite/firebug-lite-debug.js`
- `skin/**` -> `/firebug-lite/skin/**`
- `license.txt` -> `/firebug-lite/license.txt` (license requirement)

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

## Versioning

Original firebug-lite is tagged as 1.5.1 however, build files have references
to 1.4.x and 1.3.x only. I decided to keep 1.5.1 as base and all future versions 
will have a higher minor version starting from 1.5.2.

## TODO

Ideally we need to revive module-based building system and cleanup unused stuff.

## License

BSD-3-Clause with Parakey Inc Copyright.
