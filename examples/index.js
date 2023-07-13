const {SafeTensor} = require("safetensors-js");

const fs = require("fs");

const data = fs.readFileSync("./net.safetensors");

const tensor = new SafeTensor(new Uint8Array(data));
console.log(tensor.getTensor("_fc_bias"));