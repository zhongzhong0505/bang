import { defineConfig } from '@rspack/cli';
import { rspack, type Configuration } from '@rspack/core';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';
const dist = path.resolve(__dirname, 'dist');

const swcRule = {
  test: /\.tsx?$/,
  exclude: /node_modules/,
  use: {
    loader: 'builtin:swc-loader' as any,
    options: {
      jsc: {
        parser: { syntax: 'typescript' as const, tsx: true },
        transform: { react: { runtime: 'automatic' as const, refresh: isDev } },
      },
    },
  },
  type: 'javascript/auto' as const,
};

const mainConfig: Configuration = {
  name: 'main',
  entry: { main: './src/main/index.ts' },
  output: {
    path: dist,
    filename: '[name].js',
    clean: false,
    library: { type: 'commonjs2' },
  },
  resolve: { extensions: ['.ts', '.js'] },
  module: { rules: [swcRule] },
  plugins: [
    new rspack.CopyRspackPlugin({
      patterns: [{ from: 'skillhub', to: 'skillhub' }],
    }),
  ],
  target: 'node',
  externals: [
    {
      electron: 'commonjs electron',
      ws: 'commonjs ws',
      '@tigeropenapi/tigeropen': 'commonjs @tigeropenapi/tigeropen',
      '@bufbuild/protobuf': 'commonjs @bufbuild/protobuf',
    },
  ],
  optimization: { minimize: false },
  node: { __dirname: false, __filename: false },
};

const preloadConfig: Configuration = {
  name: 'preload',
  entry: { preload: './src/preload/index.ts' },
  output: {
    path: dist,
    filename: '[name].js',
    clean: false,
    library: { type: 'commonjs2' },
  },
  resolve: { extensions: ['.ts', '.js'] },
  module: { rules: [swcRule] },
  target: 'node',
  externals: [
    { electron: 'commonjs electron' },
  ],
  optimization: { minimize: false },
  node: { __dirname: false, __filename: false },
};

const rendererConfig: Configuration = {
  name: 'renderer',
  entry: { renderer: './src/renderer/index.tsx' },
  devtool: 'source-map',
  output: {
    path: dist,
    filename: '[name].js',
    chunkFilename: 'chunks/[name].[contenthash:8].js',
    clean: false,
    publicPath: 'app://./',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  module: {
    rules: [
      swcRule,
      {
        test: /\.css$/,
        use: [{ loader: 'postcss-loader' }],
        type: 'css' as const,
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    isDev && new ReactRefreshPlugin(),
  ].filter(Boolean) as any[],
  target: 'web',
  optimization: {
    minimize: !isDev,
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 20,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          priority: 10,
        },
        charts: {
          test: /[\\/]node_modules[\\/]lightweight-charts[\\/]/,
          name: 'charts-vendor',
          chunks: 'all',
          priority: 20,
        },
      },
    },
    runtimeChunk: 'single',
  },
};

export default defineConfig([mainConfig, preloadConfig, rendererConfig]);
