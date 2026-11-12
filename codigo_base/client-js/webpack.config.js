// @ts-check

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {

    //arbol de dependencias aca
    entry: './src/index.js',

    //código empaquetado
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },

    module: {
        rules: [
            //test: /\.css$/,
            //use: ['style-loader', 'css-loader'],
        ]
    }

    // plugins: [
    //     new HtmlWebpackPlugin({
    //         template
    //     })

    // ]
}

