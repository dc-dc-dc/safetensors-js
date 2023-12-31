const path = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, 'lib/index.ts'),
            name: 'safetensors',
            fileName: (format) => `safetensors.${format}.js`
        }
    }
})