const os   = require('os');
const chalk = require("chalk");
const { Console } = require('console');
const exec = require('child_process').exec;
const spawnSync = require('child_process').spawnSync;

module.exports = async function(cmd, config) {


    let sshExe = `ssh -i "${config.identifyFile}" -p ${config.port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${config.user}@${config.host}`;

    
    return new Promise(function (resolve, reject) { 
        console.log( chalk.yellow(`${sshExe} ${cmd}`) );
        
        const resp = spawnSync('ssh', ['-i', `${config.identifyFile}`, '-p', `${config.port}`, '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null', `${config.user}@${config.host}`, `${cmd}`],{ stdio: 'inherit'});

        console.log(chalk.red(resp.error | resp.stdout));
        resolve()

    });
}