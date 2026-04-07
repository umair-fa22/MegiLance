const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit', {stdio:'pipe'});
  console.log('TSC SUCCESS');
} catch (e) {
  const out = e.stdout.toString();
  const errors = out.split('\n').filter(line => line.includes('app/(portal)'));
  console.log(errors.join('\n'));
}
