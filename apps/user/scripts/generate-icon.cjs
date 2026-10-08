const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

async function main() {
  assert(process.argv[2], 'Pass the prepared Expo project directory');
  const projectRoot = path.resolve(process.argv[2]);
  const iconPath = path.resolve(__dirname, '../assets/app_icon_user.jpg');
  const original = fs.readFileSync(iconPath);
  assert.equal(createHash('sha256').update(original).digest('hex'),
    'cb0706f6389380cfd931942f2ccd013734e766dac5f2afc365089137e5e28b83',
    'The User icon must be the unmodified original from UI.zip');

  const requireFromProject = createRequire(path.join(projectRoot, 'package.json'));
  const { generateImageAsync } = requireFromProject('@expo/image-utils');
  const { source } = await generateImageAsync({ projectRoot }, {
    src: iconPath, width: 512, height: 512, resizeMode: 'contain',
  });
  assert.equal(source.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(source.readUInt32BE(16), 512);
  assert.equal(source.readUInt32BE(20), 512);
  fs.writeFileSync(path.join(projectRoot, 'dist-pwa/pwa-icon.png'), source);
  console.log('Generated 512px User PWA PNG from the verified original UI.zip JPEG.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
