# SafeTensor JS

A simple safetensor library for the web, caches to IndexDB to avoid re-downloading the same files.

## Usage

```javascript
import { loadSafeTensor } from "safetensors";
const tensor = await loadSafeTensor("...");

const convStemTensor = tensor.getTensor("_conv_stem");
```

## Demo

Via the network tab the `net.tensors` file is only fetched once.

https://cruzio.dev/posts/leveling-up-browser-with-webgpu/