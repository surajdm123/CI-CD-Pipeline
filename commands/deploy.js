const chalk = require('chalk');
const path = require("path");
const child_process = require('child_process');
const yaml = require("js-yaml");
const fs = require("fs");
require('dotenv').config();
const sshExe = require('../lib/exec/ssh');
const { async } = require('hasbin');
const { pipeline } = require('stream');
const privatekey = "keys/id_rsa";
const replaceinline = require('replace');

exports.command = 'deploy <inventory> <job_name> <build_yml>';
exports.desc = 'Building the project ';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    
    const { inventory, job_name, build_yml, processor } = argv;

    let absolutePath = path.join(process.cwd(), build_yml);

    let inventoryPath = path.join(process.cwd(), inventory);

    try {
        if(!(fs.existsSync(inventoryPath))) {
            console.log(chalk.red(`${inventory} file does not exist. Please run prod up.`));
            process.exit(0);
        }

    } catch (err) {
        console.log("File does not exit.")
        process.exit(0);
    }
    
    console.log(inventory);

    let servers = getServers(inventory);

    console.log(servers);

    for(let server of servers) {
        if(server == 'undefined') {
            console.log(chalk.red(`Production environments not built properly. Please run prod up again.`));
            process.exit(0);
        }
    }

    console.log(chalk.green("Deploying project"));

    let vmname = process.env.VM_NAME;
    let hostIp = process.env.HOST_IP;
    let userName = process.env.HOST_USER_NAME;

    console.log(`Job Name: ${job_name}`);

    console.log(`Build yml file: ${build_yml}`);

    console.log(`Processor: ${processor}`);

    console.log(absolutePath);

    let buildDetails = yaml.loadAll(fs.readFileSync(absolutePath, 'utf8'));

    if(processor==="Arm64") {
       
        runPackages(buildDetails, processor, vmname, inventory);

        runNpmPackages(buildDetails, processor, vmname, inventory);

    } else {
        await runPackagesForIntel(buildDetails, processor, vmname, inventory);

        await runNpmPackagesForIntel(buildDetails, processor, vmname, inventory);
    }

    switch(job_name) {
        case "itrust-deploy":
            if (processor === "Arm64"){
            runiTrustDeploy(buildDetails, processor, vmname, inventory, job_name);
            break;
            }else{
                await runiTrustDeployforIntel(buildDetails, processor, vmname, inventory, job_name);
                break;
            }
        default:
            console.log(chalk.blue("No specific code for job found. Running with general codebase."));
            runGeneralDeploy(buildDetails, processor, vmname, inventory, job_name);
            break;
    }


};


function runGeneralDeploy(buildDetails, processor, vmname, inventory, job_name) {

    let gitUrl = getDefaultGitUrl(buildDetails, job_name);

    let steps = getJobSteps(buildDetails, job_name);

    let port = getGeneralPort(buildDetails, job_name);

    if(processor==="Arm64") {

        let scpSrcPath = getScpPathName(buildDetails, job_name);

        let scpRemoteDestPath = getRemotePathName(buildDetails, job_name);
       
        for(let step of steps) {
            console.log(`Running step: ${step.name}`);
            child_process.execSync(`vm exec ${vmname} "'${step.run}'"`, {stdio: ['inherit', 'inherit', 'inherit']});
        }

        if(isTomcatPresent(buildDetails, job_name)) {
            let tomcatInfo = getDefaultTomcatInfo(buildDetails, job_name);

            if(!(scpSrcPath === "")) {
                let result = child_process.execSync(`vm exec ${vmname} "'sh ~/shared/cwd/pipeline/scripts/file_check.sh ${scpSrcPath}'"`, {encoding: 'utf-8'});

                result = Number(result);

                console.log(result);

                if(result === 0) {
                    console.log(chalk.red(`${tomcatInfo.scp_FILE_NAME} not found. Please build before deploying.\n`));

                    console.log(chalk.red("FAILURE"));

                    process.exit(1);
                } 
            }

            child_process.execSync(`vm exec ${vmname} "ansible-playbook -i '~/shared/cwd/${inventory}' '~/shared/cwd/pipeline/ansible-play-remote.yml' -e 'TOMCAT_URL=${tomcatInfo.TOMCAT_URL}' -e 'ROLE=tomcat' -e 'DEST_PATH=${tomcatInfo.DEST_PATH}' --key-file '~/shared/cwd/keys/id_rsa'"`, {stdio: ['inherit', 'inherit', 'inherit']});

        }
        

        let servers = getServers(inventory);

        

        if(!(scpSrcPath === "")) {
            for(let server of servers) {
                child_process.execSync(`vm exec ${vmname} "ansible-playbook '~/shared/cwd/pipeline/play.yml' -e 'SRC_PATH=${scpSrcPath}' -e 'ROLE=scp' -e 'IP_ADDRESS=${server}' -e 'DEST_PATH=${scpRemoteDestPath}' -e 'KEY_PATH=/home/ubuntu/shared/cwd/keys/id_rsa' --key-file '~/shared/cwd/keys/id_rsa'"`, {stdio: ['inherit', 'inherit', 'inherit']});
            }
        }

        let prodSteps = getProdSteps(buildDetails, job_name);        

        for(let server of servers) {
            for(let step of prodSteps) {
                console.log(`Running step: ${step.name}`);
                let command = step.run;
                command = command.replace("{{GIT}}", gitUrl);
                child_process.execSync(`ssh -oStrictHostKeyChecking=no -i 'keys/id_rsa' root@${server} '${command}'`, {stdio: ['inherit', 'inherit', 'inherit']});
            }
        }

        let vmIpAddress = child_process.execSync(`vm exec ${vmname} "'sh ~/shared/cwd/pipeline/scripts/get_ip.sh'"`, {encoding: 'utf-8'});

        vmIpAddress = vmIpAddress.trim();

        applyPatches(buildDetails, processor, vmname, inventory, job_name, servers, vmIpAddress);

        let greenIpAddress = servers[0];

        let blueIpAddress = servers[1];

        console.log(chalk.blue("Starting Proxy Server"));
        child_process.execSync(`vm exec ${vmname} "'pm2 stop 0'"`, {stdio: ['inherit', 'inherit', 'inherit']});
        child_process.execSync(`vm exec ${vmname} "'pm2 delete 0'"`, {stdio: ['inherit', 'inherit', 'inherit']});
        child_process.execSync(`vm exec ${vmname} "'pm2 start ~/shared/cwd/run-proxy.js -- ${servers[0]}:${port} -- ${servers[1]}:${port}'"`, {stdio: ['inherit', 'inherit', 'inherit']});
        console.log(chalk.blue("Started Proxy Server"));

        

        console.log(chalk.blue(`Green Server: http://${greenIpAddress}:${port}/`));
        console.log(chalk.blue(`Blue Server: http://${blueIpAddress}:${port}/`));
        console.log(chalk.blue(`Proxy Server: http://${vmIpAddress}:3090/`));

        console.log(chalk.green("\nDeployed Successfully.\n"));

        console.log(chalk.green("SUCCESS"));

    } else {
        
    }


}

function applyPatches(buildDetails, processor, vmname, inventory, job_name, servers, vmIpAddress) {
    /*
        Code for patches that are specific to the build_job will be added here
    */

    if(job_name === 'pencilblue-deploy') {
        console.log(chalk.blue(`Applying Custom patch for ${job_name}`));
        pencilbluePatch(buildDetails, processor, vmname, inventory, job_name, servers, vmIpAddress);
    }

}

function pencilbluePatch(buildDetails, processor, vmname, inventory, job_name, servers, vmIpAddress) {

    // Get the REMOTE_DEST_PATH variable. This is where the repo is hosted.
    let jobs = buildDetails[0].jobs;
    let REMOTE_DEST_PATH = '/opt/';
    for(let job of jobs) {
        if(job.name === job_name) {
            if("DATA" in job && "REMOTE_DEST_PATH" in job.DATA)  {
                REMOTE_DEST_PATH = job.DATA.REMOTE_DEST_PATH;
            }
        }
    }

    let filePath = path.join(process.cwd(), "pipeline/pencilblue_patch");

    for (let server of servers) {

        child_process.execSync(`vm exec ${vmname} "'sudo cp ~/shared/cwd/pipeline/pencilblue_patch/sample.config.js ~/shared/cwd/pipeline/pencilblue_patch/config.js'"`, {encoding: 'utf-8'});

        replaceinline({
            regex: "{{ IP_ADDRESS }}",
            replacement: server,
            paths: [`${filePath}/config.js`],
            silent: true,
        });

        replaceinline({
            regex: "{{ PROXY_SERVER_IP }}",
            replacement: vmIpAddress,
            paths: [`${filePath}/config.js`],
            silent: true,
        });

          let scpSrcPath = `~/shared/cwd/pipeline/pencilblue_patch/config.js`
          
          child_process.execSync(`vm exec ${vmname} "ansible-playbook '~/shared/cwd/pipeline/play.yml' -e 'SRC_PATH=${scpSrcPath}' -e 'ROLE=scp' -e 'IP_ADDRESS=${server}' -e 'DEST_PATH=${REMOTE_DEST_PATH}' -e 'KEY_PATH=/home/ubuntu/shared/cwd/keys/id_rsa' --key-file '~/shared/cwd/keys/id_rsa'"`, {stdio: ['inherit', 'inherit', 'inherit']});

          child_process.execSync(`ssh -oStrictHostKeyChecking=no -i 'keys/id_rsa' root@${server} 'pm2 start /opt/pencilblue/pencilblue.js'`, {stdio: ['inherit', 'inherit', 'inherit']});

          child_process.execSync(`vm exec ${vmname} "'sudo rm ${scpSrcPath}'"`, {encoding: 'utf-8'});
    }

    console.log("Patch completed");
}

async function runiTrustDeployforIntel(buildDetails, processor, vmname, inventory, job_name){
    let tomcatInfo = getTomcatInfo(buildDetails, job_name);

    let result = await sshExe(`sh /bakerx/pipeline/scripts/file_check.sh ${tomcatInfo.scp_FILE_NAME}`, sshConfig);

    result = Number(result);

    console.log(result);

    if(result === 0) {
        console.log(chalk.red(`${tomcatInfo.scp_FILE_NAME} not found. Please build before deploying.\n`));

        console.log(chalk.red("FAILURE"));

        process.exit(1);
    } 

    await sshExe(`ansible-playbook -i /bakerx/${inventory} /bakerx/pipeline/ansible-play-remote.yml -e TOMCAT_URL=${tomcatInfo.TOMCAT_URL} -e 'ROLE=tomcat' -e DEST_PATH=${tomcatInfo.DEST_PATH} --key-file /bakerx/keys/id_rsa`, sshConfig);

    var array = fs.readFileSync(inventory).toString().split("\n");

    let greenIpAddress = array[1];

    let blueIpAddress = array[3];

    
    for(let i=1; i<array.length; i++) {
        if (array[i].trim() === '' || array[i].charAt(0) == '[') {
             continue;
        }
        
        await sshExe(`ansible-playbook '/bakerx/pipeline/play.yml' -e 'SRC_PATH=${tomcatInfo.scp_FILE_NAME}' -e 'ROLE=scp' -e 'IP_ADDRESS=${array[i]}' -e 'DEST_PATH=${tomcatInfo.DEST_PATH}/webapps/iTrust2.war' --key-file /bakerx/keys/id_rsa`, sshConfig);

        await sshExe(`ssh -i '/bakerx/keys/id_rsa' root@${array[i]} 'sh ${tomcatInfo.DEST_PATH}/bin/startup.sh'`,{encoding: 'utf-8'}, sshConfig);
    }

    console.log(chalk.blue("Starting Proxy Server"));
    await sshExe(`pm2 -s start /bakerx/run-proxy.js -- ${array[1]} -- ${array[3]}`, sshConfig);
    console.log(chalk.blue("Started Proxy Server"));

    let vmIpAddress = sshExe(`sh /bakerx/pipeline/scripts/get_ip.sh`, sshConfig);

    console.log(chalk.blue(`Green Server: http://${greenIpAddress}:8080/iTrust2/login`));
    console.log(chalk.blue(`Blue Server: http://${blueIpAddress}:8080/iTrust2/login`));
    console.log(chalk.blue(`Proxy Server IP: ${vmIpAddress}`));

    console.log(chalk.green("SUCCESS"));
}

function runiTrustDeploy(buildDetails, processor, vmname, inventory, job_name) {

    let tomcatInfo = getTomcatInfo(buildDetails, job_name);

    let result = child_process.execSync(`vm exec ${vmname} "'sh ~/shared/cwd/pipeline/scripts/file_check.sh ${tomcatInfo.scp_FILE_NAME}'"`, {encoding: 'utf-8'});

    result = Number(result);

    console.log(result);

    if(result === 0) {
        console.log(chalk.red(`${tomcatInfo.scp_FILE_NAME} not found. Please build before deploying.\n`));

        console.log(chalk.red("FAILURE"));

        process.exit(1);
    } 

    child_process.execSync(`vm exec ${vmname} "ansible-playbook -i '~/shared/cwd/${inventory}' '~/shared/cwd/pipeline/ansible-play-remote.yml' -e 'TOMCAT_URL=${tomcatInfo.TOMCAT_URL}' -e 'ROLE=tomcat' -e 'DEST_PATH=${tomcatInfo.DEST_PATH}' --key-file '~/shared/cwd/keys/id_rsa'"`, {stdio: ['inherit', 'inherit', 'inherit']});

    var array = fs.readFileSync(inventory).toString().split("\n");

    let greenIpAddress = array[1];

    let blueIpAddress = array[3];

    for(let i=1; i<array.length; i++) {
        if (array[i].trim() === '' || array[i].charAt(0) == '[') {
             continue;
        }
        
        child_process.execSync(`vm exec ${vmname} "ansible-playbook '~/shared/cwd/pipeline/play.yml' -e 'SRC_PATH=${tomcatInfo.scp_FILE_NAME}' -e 'ROLE=scp' -e 'IP_ADDRESS=${array[i]}' -e 'DEST_PATH=${tomcatInfo.DEST_PATH}/webapps/iTrust2.war' -e 'KEY_PATH=/home/ubuntu/shared/cwd/keys/id_rsa' --key-file '~/shared/cwd/keys/id_rsa'"`, {stdio: ['inherit', 'inherit', 'inherit']});

        child_process.execSync(`vm exec ${vmname} "ssh -i '~/shared/cwd/keys/id_rsa' root@${array[i]} 'sh ${tomcatInfo.DEST_PATH}/bin/startup.sh'"`, {stdio: ['inherit', 'inherit', 'inherit']});
    }

    console.log(chalk.blue("Starting Proxy Server"));
    child_process.execSync(`vm exec ${vmname} "'pm2 -s start ~/shared/cwd/run-proxy.js -- ${array[1]}:8080 -- ${array[3]}:8080'"`, {stdio: ['inherit', 'inherit', 'inherit']});
    console.log(chalk.blue("Started Proxy Server"));

    let vmIpAddress = child_process.execSync(`vm exec ${vmname} "'sh ~/shared/cwd/pipeline/scripts/get_ip.sh'"`, {encoding: 'utf-8'});

    console.log(chalk.blue(`Green Server: http://${greenIpAddress}:8080/iTrust2/login`));
    console.log(chalk.blue(`Blue Server: http://${blueIpAddress}:8080/iTrust2/login`));
    console.log(chalk.blue(`Proxy Server IP: ${vmIpAddress}`));

    console.log(chalk.green("SUCCESS"));
    
}
 

function runPackages(buildDetails, processor, vmname, inventory) {
    let DB_PASSWORD = process.env.DB_PASSWORD;
    let GIT_ACCESS_TOKEN = process.env.GIT_ACCESS_TOKEN;

    if(processor==="Arm64") {

        for (let PACKAGE of buildDetails[0].setup.PACKAGE) {
            console.log(`Installing package ${PACKAGE}`);

            if(PACKAGE === "mysql-server" ) {
                child_process.execSync(`vm exec ${vmname} "ansible-playbook -i '~/shared/cwd/${inventory}' '~/shared/cwd/pipeline/ansible-play-remote.yml' -e 'DB_PASSWORD=${DB_PASSWORD}' -e 'ROLE=mysql' --key-file '~/shared/cwd/keys/id_rsa'"`, {stdio: ['inherit', 'inherit', 'inherit']});
            } else {
                child_process.execSync(`vm exec ${vmname} "ansible-playbook -i '~/shared/cwd/${inventory}' '~/shared/cwd/pipeline/ansible-play-remote.yml' -e 'PACKAGE=${PACKAGE}' -e 'ROLE=apt' --key-file '~/shared/cwd/keys/id_rsa'"`, {stdio: ['inherit', 'inherit', 'inherit']});
            }    
          }
    }
}

function getJobSteps(buildDetails, job_name) {
    let jobs = buildDetails[0].jobs;
    let steps = [];
    for(let job of jobs) {
        if(job.name === job_name) {

            if(!("steps" in job)) {
                continue;
            }

            for(let step of job.steps) {
                steps.push(step);
            }
        }
    }

    return steps;
}
async function runPackagesForIntel(buildDetails, processor, vmname, inventory, sshConfig){
    let DB_PASSWORD = process.env.DB_PASSWORD;
    let GIT_ACCESS_TOKEN = process.env.GIT_ACCESS_TOKEN;

    if(!(processor==="Arm64")) {

        for (let PACKAGE of buildDetails[0].setup.PACKAGE) {
            console.log(`Installing package ${PACKAGE}`);
            if(PACKAGE === "mysql-server" ) {
                await sshExe(`ansible-playbook -i '/bakerx/${inventory}' '/bakerx/pipeline/ansible-play-remote.yml' -e 'DB_PASSWORD=${DB_PASSWORD}' -e 'ROLE=mysql' --key-file '/bakerx/keys/id_rsa'`, sshConfig);
            } else {
                
                await sshExe(`ansible-playbook -i '/bakerx/${inventory}' '/bakerx/pipeline/ansible-play-remote.yml' -e 'PACKAGE=${PACKAGE}' -e 'ROLE=apt' --key-file '/bakerx/keys/id_rsa'`, sshConfig);
            }    
          }
    }
}

async function runNpmPackagesForIntel(buildDetails, processor, vmname, inventory, sshConfig) {
    
    if(!(processor==="Arm64")) {

        for (let PACKAGE of buildDetails[0].setup.NPM_PACKAGE) {
            console.log(`Installing NPM package ${PACKAGE}`);
            
            await sshExe(`ansible-playbook -i '/bakerx/${inventory}' '/bakerx/pipeline/ansible-play-remote.yml' -e 'PACKAGE=${PACKAGE}' -e 'ROLE=npm' --key-file '/bakerx/keys/id_rsa'`, sshConfig);
            
          }
    }
}
function getScpPathName(buildDetails, job_name) {

    let jobs = buildDetails[0].jobs;
    let scpPathName = "";
    for(let job of jobs) {
        if(job.name === job_name) {

            if(!("scp" in job)) {
                console.log(chalk.blue("scp is not specified."));
                break;
            }

            return job.scp.SRC_FILE_NAME;
        }
    }

    return scpPathName;

}

function getRemotePathName(buildDetails, job_name) {

    let jobs = buildDetails[0].jobs;
    let scpPathName = "/opt/";
    for(let job of jobs) {
        if(job.name === job_name) {

            if(!("scp" in job)) {
                console.log(chalk.blue("scp is not specified."));
                break;
            }

            return job.scp.REMOTE_FILE_PATH;
        }
    }

    return scpPathName;

}

function getVars(buildDetails, job_name) {
    let jobs = buildDetails[0].jobs;
    let parameters = {};
    for(let job of jobs) {
        if(job.name === job_name) {
            for(let parameter of job.vars) {
                let keys = Object.keys(parameter);
                for( let key of keys) {
                    parameters[key] = parameter[key];
                }
            }
        }
    }

    return parameters;
}

function getTomcatInfo(buildDetails, job_name) {
    let jobs = buildDetails[0].jobs;

    let tomcatInfo = {};

    for(let job of jobs) {
        if(job.name === job_name) {
            tomcatInfo = job.prod_steps.tomcat;
            tomcatInfo["scp_FILE_NAME"] = job.prod_steps.scp.FILE_NAME;
            return tomcatInfo;
        }
    }

    return tomcatInfo;
}

function getServers(inventory) {
    let servers = [];
    var array = fs.readFileSync(inventory).toString().split("\n");

    for(let i=0; i<array.length; i++) {
        if (array[i].trim() === '' || array[i].charAt(0) == '[') {
             continue;
        }

        servers.push(array[i]);
    }

    return servers;
}

function getProdSteps(buildDetails, job_name) {
    let jobs = buildDetails[0].jobs;
    let steps = [];
    for(let job of jobs) {
        if(job.name === job_name) {

            if(!("prod_steps" in job)) {
                continue;
            }

            for(let step of job.prod_steps) {
                steps.push(step);
            }
        }
    }

    return steps;
}

function runNpmPackages(buildDetails, processor, vmname, inventory) {

    if(!("NPM_PACKAGE" in buildDetails[0].setup)) {
        console.log("No NPM packages to install.");
        return;
    }
    
    if(processor==="Arm64") {

        for (let PACKAGE of buildDetails[0].setup.NPM_PACKAGE) {
            console.log(`Installing NPM package ${PACKAGE}`);

            child_process.execSync(`vm exec ${vmname} "ansible-playbook -i '~/shared/cwd/${inventory}' '~/shared/cwd/pipeline/ansible-play-remote.yml' -e 'PACKAGE=${PACKAGE}' -e 'ROLE=npm' --key-file '~/shared/cwd/keys/id_rsa'"`, {stdio: ['inherit', 'inherit', 'inherit']});
            
          }
    }
}

function getDefaultGitUrl(buildDetails, job_name) {
    let data_element_for_fractal = buildDetails[0].setup.DATA;
    let gitUrl = data_element_for_fractal.GIT[0];
    return gitUrl;
}

function getGeneralPort(buildDetails, job_name) {
    let jobs = buildDetails[0].jobs;
    let port = '8080';
    for(let job of jobs) {
        if(job.name === job_name) {
            if("DATA" in job && "port" in job.DATA)  {
                port = job.DATA.port;
                return port;
            }
        }
    }

    return port;
}

function isTomcatPresent(buildDetails, job_name) {
    let jobs = buildDetails[0].jobs;

    let istomcatPresent = false;

    for(let job of jobs) {
        if(job.name === job_name) {

            if("tomcat" in job) {
                return true;
            }
        }
    }

    return istomcatPresent;
}

function getDefaultTomcatInfo(buildDetails, job_name) {

    let jobs = buildDetails[0].jobs;

    let tomcatInfo = {};

    for(let job of jobs) {
        if(job.name === job_name) {
            tomcatInfo = job.tomcat;
            return tomcatInfo;
        }
    }

    return tomcatInfo;

}