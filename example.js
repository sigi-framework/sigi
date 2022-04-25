const { execSync } = require('child_process')

execSync(`yarn parcel packages/${process.argv[2]}/index.html`, {
  cwd: 'examples',
  stdio: 'inherit',
})
