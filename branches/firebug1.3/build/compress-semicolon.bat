java -jar yuicompressor-2.4.2.jar --line-break 0 -o firebug.min.js firebug.full.js

gzip -c firebug.min.js > firebug.min.js.gz