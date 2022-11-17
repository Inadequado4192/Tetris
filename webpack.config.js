const path = require("path");

module.exports = {
    entry: path.join(__dirname, "view/index.ts"),
    output: {
        path: path.join(__dirname, "view"),
        filename: "index.js"
    },
    mode: "production",
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    }
}