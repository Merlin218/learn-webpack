const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader')
const { IgnorePlugin } = require('webpack')
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const PurgecssWebpackPlugin = require('purgecss-webpack-plugin')
const glob = require('glob'); // 文件匹配模式

// 开发配置
const devConfig = {
  // 打包模式：development（开发模式）、production（生产模式）、none（无模式）
  mode: 'development',
  devServer: {
    static: 'public',
    // contentBase: path.resolve(__dirname, 'public'), // 静态文件目录（该属性似乎不是正确的属性）
    compress: true, //是否启动压缩 gzip
    port: 8080, // 端口号
    // open:true  // 是否自动打开浏览器
  },
}

const buildConfig = {
  //  生产环境下会开启tree-shaking和代码压缩
  mode: 'production',
}

// 公共配置
const config = {
  // cache持久化缓存,改善构建速度
  cache: {
    type: 'filesystem',
  },
  // 入口文件，可以是字符串也可以是数组或者对象
  entry: './src/index.ts',
  output: {
    path: path.join(__dirname, 'dist'),
    // 文件名，当多入口文件时，[name]可以设置的名称命名，默认为main，另外还有[contenthash]等占位符，
    filename: '[name].bundle.js',
  },
  module: {
    noParse: /jquery/,
    rules: [
      // 处理vue文件
      {
        test: /\.vue$/,
        use: 'vue-loader'
      },
      // 处理ts文件
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
      // 处理js兼容
      {
        test: /\.js$/i,
        use: [
          // 开启多线程打包，之后的loader都会在一个单独的worker池中运行。
          {
            loader: 'thread-loader', // 开启多进程打包
            options: {
              worker: 3,
            }
          },
          {
            loader: 'babel-loader',
            options: {
              presets: [
                // 使用babel预设
                '@babel/preset-env'
              ],
              cacheDirectory: true, // 开启缓存
            }
          }
        ]
      },
      {
        test: /\.txt|md$/,
        use: 'raw-loader'
      },
      {
        test: /\.(s[ac]|c)ss$/i, // 匹配sass/scss/css文件
        // 顺序从右到左
        // 使用style-loader把css-loader处理完的内容通过style标签插入到head标签中
        // 使用postcss-loader对css进行兼容性处理
        // MiniCssExtractPlugin.loader是把css提取到单独的css文件中，然后通过link标签引入文件

        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader']

      },
      {
        test: /\.less$/i, // 匹配less文件
        // 顺序从右到左
        // 使用style-loader把css-loader处理完的内容通过style标签插入到head标签中
        // 使用postcss-loader对css进行兼容性处理
        // use: ['style-loader','css-loader','postcss-loader','less-loader']
        // MiniCssExtractPlugin.loader是把css提取到单独的css文件中，然后通过link标签引入文件
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'less-loader']
      },
      // 使用webpack5自带资源模块
      {
        test: /\.(png|jpe?g|gif)$/,
        // asset 会根据文件大小来选择使用哪种类型
        // 当文件小于 8 KB（默认） 的时候会使用 asset/inline
        // 否则会使用 asset/resource
        type: 'asset',
        generator: {
          filename: "[name][hash:8][ext]"
        },
        parser: {
          dataUrlCondition: {
            maxSize: 50 * 1024 // 超过50kb 不转 base64
          }
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
        type: 'asset',
        generator: {
          // 输出文件位置以及文件名
          filename: "[name][hash:8][ext]"
        },
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024 // 超过100kb 不转 base64
          }
        }
      },
      // {
      //   test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,  // 匹配字体文件
      //   use: [
      //     {
      //       loader: 'url-loader',
      //       options: {
      //         name: 'fonts/[name][hash:8].[ext]', // 体积大于 10KB 打包到 fonts 目录下 
      //         limit: 10 * 1024,
      //       } 
      //     }
      //   ]
      // },
      // {
      //   test: /\.(png|jpe?g|gif)$/,
      //   use: [{
      //     loader: 'url-loader',
      //     options: {
      //       // 图片大小小于8kb的时候，会转换成base64格式
      //       limit: 5 * 1024,
      //       // placeholder 占位符 [name] -> 源资源模块的名称
      //       // [ext] 源资源模块的后缀
      //       name: "[name]_[hash:8].[ext]",
      //       //打包后的存放位置，相对于打包后的位置
      //       outputPath: "./images",
      //       // 打包后文件的 url，相对于打包后的位置，maybe可以用于拼接成网络链接，用cdn加速获取
      //       publicPath: './images',
      //     }
      //   },{
      //     loader: 'img-loader',
      //   }]
      // },
      // {
      //   test: /\.(png|jpe?g|gif)$/,
      //   use: {
      //     loader: 'file-loader',
      //     options: {
      //       // placeholder 占位符 [name] -> 源资源模块的名称
      //       // [ext] 源资源模块的后缀
      //       name: "[name]_[hash:8].[ext]",
      //       //打包后的存放位置，相对于打包后的位置
      //       outputPath: "./images",
      //       // 打包后文件的 url，相对于打包后的位置，maybe可以用于拼接成网络链接，用cdn加速获取
      //       publicPath: './images',
      //     }
      //   }
      // }
    ]
  },
  plugins: [
    // 生成html文件，并且把打包好的模块文件引入
    new HtmlWebpackPlugin({
      // 网页标题
      title: 'webpack-demo',
      // 打包后的名字
      filename: 'index.html',
      // 使用模板文件
      template: './src/index.html'
    }),
    // 自动清空打包文件夹
    new CleanWebpackPlugin(),
    // 提取所有的 CSS 到一个文件中，在css的loader处理中也需要配置
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new VueLoaderPlugin(),
    // 忽略第三方包中的指定目录
    new IgnorePlugin({
      // moment中包含./locale的全部路径（内置的语言包）
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    // 构建结果分析插件
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',  // 不启动展示打包报告的http服务器
      generateStatsFile: true, // 是否生成stats.json文件
    }),
    // 清除无用css
    new PurgecssWebpackPlugin({
      paths: glob.sync(`${path.resolve(__dirname, 'src')}/**/*`, { nodir: true })
    }),
  ],
  resolve: {
    // 配置别名
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'comps': path.resolve(__dirname, 'src/components'),
    },
    // 从左到右尝试解析模块，'...'表示默认列表
    extensions: ['.ts', '...'],
    // 优先 src 目录下查找需要解析的文件，会大大节省查找时间
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  // 优先查找node_module中loader，找不到查找自定义loader
  resolveLoader: {
    modules: ['node_modules', path.resolve(__dirname, 'loader')]
  },
  // 不打包某些依赖，例如，在html中引入cdn资源而不打包模块
  externals: {
    jquery: 'jQuery',
  },
  optimization: {
    minimize: true, // 开启最小化
    minimizer: [
      // webpack内置模块，压缩js
      // new TerserPlugin({}),
      // 添加 css 压缩配置
      new OptimizeCssAssetsPlugin({}),
    ],
    splitChunks: {
      chunks: 'async', // 有效值为 `all`，`async` 和 `initial`
      minSize: 20000, // 生成 chunk 的最小体积（≈ 20kb)
      minRemainingSize: 0, // 确保拆分后剩余的最小 chunk 体积超过限制来避免大小为零的模块
      minChunks: 1, // 拆分前必须共享模块的最小 chunks 数。
      maxAsyncRequests: 30, // 最大的按需(异步)加载次数
      maxInitialRequests: 30, // 打包后的入口文件加载时，还能同时加载js文件的数量（包括入口文件）
      enforceSizeThreshold: 50000,
      // cacheGroups: { // 配置提取模块的方案
      //   defaultVendors: {
      //     test: /[\/]node_modules[\/]/,
      //     priority: -10,
      //     reuseExistingChunk: true,
      //   },
      //   default: {
      //     minChunks: 2,
      //     priority: -20,
      //     reuseExistingChunk: true,
      //   },
      // },
      cacheGroups: { // 配置提取模块的方案
        default: false,
        styles: {
          name: 'styles',
          test: /\.(s?css|less|sass)$/,
          chunks: 'all',
          enforce: true,
          priority: 10,
        },
        common: {
          name: 'chunk-common',
          chunks: 'all',
          minChunks: 2,
          maxInitialRequests: 5,
          minSize: 0,
          priority: 1,
          enforce: true,
          reuseExistingChunk: true,
        },
        vendors: {
          name: 'chunk-vendors',
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          priority: 2,
          enforce: true,
          reuseExistingChunk: true,
        },
        // ... 根据不同项目再细化拆分内容
      },
    }
  },
}

// 不直接导出配置，可以根据不同的环境，导出不同的配置
module.exports = (env, argv) => {
  return Object.assign(config, argv.mode === 'production' ? buildConfig : devConfig);
}
