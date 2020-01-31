const { execSync } = require('child_process')

const [, , pkg] = process.argv

execSync(`parcel packages/${pkg}/index.html`, {
  stdio: 'inherit',
})
