/** @type {import('next').NextConfig} */
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  reactStrictMode: false,
  //distDir: 'build',
  //basePath: '/web-gnn-vis',
  //assetPrefix: '/web-gnn-vis/',
  //trailingSlash: true,  // This option is required for static export to work correctly
  //output: 'standalone',     // Add this line to enable static export
  //output:"export",
  webpack: (config, {}) => {
    config.resolve.extensions.push(".ts", ".tsx");
    config.resolve.fallback = { fs: false };
    config.optimization.minimizer = [
      new TerserPlugin({
        terserOptions: {
          compress: {
            unused: false,
          },
        },
      }),
    ];

    config.plugins.push(
      new NodePolyfillPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: "./node_modules/onnxruntime-web/dist/ort-wasm.wasm",
            to: "static/chunks/pages",
          },
          {
            from: "./node_modules/onnxruntime-web/dist/ort-wasm-simd.wasm",
            to: "static/chunks/pages",
          },
          {
            from: "./model",
            to: "static/chunks/pages",
          },
        ],
      })
    );

    return config;
  },
};