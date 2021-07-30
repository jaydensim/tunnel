const fs = require('fs')
module.exports = {
  devServer: {
    https: {
      key: fs.readFileSync('./certs/example.com+5-key.pem'),
      cert: fs.readFileSync('./certs/example.com+5.pem')
    }
  },
  pwa: {
    name: 'Tunnel',
    themeColor: '#111'
  },

  assetsDir: 'static',
  configureWebpack: {
    resolve: {
      extensions: ['.svg']
    },
    module: {
      rules: [
        {
          test: /\.worker\.js$/,
          use: 'worker-loader',
        },
        {
          test: /\.(string|binary)$/i,
          use: 'raw-loader',
        }
      ]
    }
  }
}
