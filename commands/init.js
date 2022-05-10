const chalk = require('chalk');
const path = require('path');
const child  = require("child_process");
const os = require('os');
const fs = require("fs");
const { off } = require('process');
require('dotenv').config();
const sshExe = require('../lib/exec/ssh');

exports.command = 'init';
exports.desc = 'Prepare tool';
exports.builder = yargs => {
    yargs.options({
    });
};


async function executeInsideVM(vmName, cmd) {
    await child.execSync(`${cmd}`,{stdio: ['inherit', 'inherit', 'inherit']});
}

async function executeForM1Mac() {
    let homeDir = os.homedir();
    let ubuntuImage = homeDir + "/.basicvm/baseImages/ubuntu/focal"
    if(!fs.existsSync(ubuntuImage)) {
        console.log(chalk.red("Ubuntu image not present"));
        console.log(chalk.green("Downloading ubuntu:focal"));
        let cmd = "vm pull ubuntu:focal";
        await child.execSync(cmd, {stdio: ['inherit', 'inherit', 'inherit']});
    }

    let vmname = process.env.VM_NAME;
    
    await child.execSync(`vm run ${vmname} ubuntu:focal`, {stdio: ['inherit', 'inherit', 'inherit']});
    
    // Wait for a while before executing the commands to avoid FileNotFound error.
    await new Promise(resolve => setTimeout(resolve, 10000));

    await child.execSync(`vm exec ${vmname} "sh /home/ubuntu/shared/cwd/pipeline/server-start.sh"`, {stdio: ['inherit', 'inherit', 'inherit']});

    console.log(chalk.blue(`Ansible Installed.`));

    await child.execSync(`vm ssh-config ${vmname}`,{stdio: ['inherit', 'inherit', 'inherit']});

    console.log(`SSH Key Location: ~/Library/Application Support/basicvm/key`);
  
}

async function executeForIntel() {
    let homeDir = os.homedir();
    let ubuntuImage = homeDir + "/.bakerx/.persist/images/focal"

    if(!fs.existsSync(ubuntuImage)) {
        console.log(chalk.red("Ubuntu image not present"));
        console.log(chalk.green("Downloading ubuntu:focal"));
        let cmd = "bakerx pull focal cloud-images.ubuntu.com";
        await child.execSync(cmd, {stdio: ['inherit', 'inherit', 'inherit']});
    }
    let vmname = process.env.VM_NAME;
    let hostIp = process.env.HOST_IP;
    let userName = process.env.HOST_USER_NAME;
    
    await child.spawnSync(`bakerx`, `run ${vmname} focal --sync --memory 4096 --up`.split(' '), {shell:true, stdio: 'inherit'});
    let sshInfo = await child.execSync(`bakerx ssh-info ${vmname}`).toString();
    
    sshConfig = {
        host: hostIp,
        port: parseInt(sshInfo.split(" ")[5]),
        user: userName,
        identifyFile: sshInfo.split(" ")[2].replaceAll("\"","")
    }
    console.log(sshInfo.split(" ")[2])
    await sshExe("sh /bakerx/pipeline/server-start.sh",sshConfig)
}

exports.handler = async argv => {
    const { processor } = argv;

    console.log(chalk.green("Preparing computing environment..."));


    if(processor==="Arm64") {
        await executeForM1Mac();
    } else {
        await executeForIntel();
    }

    console.log(chalk.green("Successfully ran init.js"));
};