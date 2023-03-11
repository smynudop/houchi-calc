const path = require("path")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
    // モード値を production に設定すると最適化された状態で、
    // development に設定するとソースマップ有効でJSファイルが出力される
    mode: "development",

    // メイ{となるJavaScriptファイル（エントリーポイント）
    entry: {
        grand: "./src/js/exec_grand.ts",
        normal: "./src/js/exec_normal.ts",
        gachi_grand: "./src/js/gachi_grand.ts",
        houchi: "./src/css/houchi.scss",
    },

    output: {
        path: path.join(__dirname, "dist_old"),
        filename: "js/[name].js",
    },

    module: {
        rules: [
            {
                // 拡張子 .ts の場合
                test: /\.ts$/,
                // TypeScript をコンパイルする
                use: "ts-loader",
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    { loader: "css-loader", options: { url: false } },
                    "sass-loader",
                ],
            },
            {
                test: /\.html$/,
                loader: "html-loader",
            },
        ],
    },
    // import 文で .ts ファイルを解決するため
    // これを定義しないと import 文で拡張子を書く必要が生まれる。
    // フロントエンドの開発では拡張子を省略することが多いので、
    // 記載したほうがトラブルに巻き込まれにくい。
    resolve: {
        // 拡張子を配列で指定
        extensions: [".ts", ".js"],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "css/[name].css",
        }),
        new FixStyleOnlyEntriesPlugin(),
        new HtmlWebpackPlugin({
            inject: "body",
            filename: `skill_normal.html`,
            template: `./src/html/skill_normal.html`,
            chunks: ["normal", "houchi"],
            hash: true,
            minify: {
                removeComments: false
            }
        }),
        new HtmlWebpackPlugin({
            inject: "body",
            filename: `skill_grand.html`,
            template: `./src/html/skill_grand.html`,
            chunks: ["grand", "houchi"],
            hash: true,
            minify: {
                removeComments: false
            }
        }),
        new HtmlWebpackPlugin({
            inject: "body",
            filename: `gachi_grand.html`,
            template: `./src/html/gachi_grand.html`,
            chunks: ["gachi_grand", "houchi"],
            hash: true,
            minify: {
                removeComments: false
            }
        }),
    ],
}
