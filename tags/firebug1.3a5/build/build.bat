rd firebug /s /q 
rd pub /s /q 

svn export "../" "./firebug"

md pub
xcopy ".\firebug\skin\." ".\pub\skin" /s /i
copy "..\test\alpha.html" ".\pub\index.html"
copy "..\content\changelog.txt" ".\pub"
copy ".\firebug\build\*.*" ".\pub"
del ".\pub\*.bat"

tar -cv --file=firebug.tar firebug/*
gzip -9 < firebug.tar > ./pub/firebug.tar.tgz

del firebug.tar

rd firebug /s /q 

pause

