const cry = require('crypto')

function generateUUID() {
    return cry.randomUUID();
}

const myUUID = generateUUID();
console.log(`Generated UUID: ${myUUID}`);
