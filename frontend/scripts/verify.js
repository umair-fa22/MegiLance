const cp=require('child_process'); try{cp.execSync('npx tsc --noEmit',{stdio:'inherit'});}catch(e){console.log('FAIL');}
