({
    appDir: "app",
    baseUrl: "modules",
    dir: "app-build",

    // Comment out the optimize line if you want
    // the code minified by Closure Compiler using
    // the "simple" optimizations mode
    //optimize: "simple",
    optimize: "none",

    optimizeCss: "standard",

    modules: [
        {
            name: "dom-tree",
            include: [
            ]
        }
    ]
})
