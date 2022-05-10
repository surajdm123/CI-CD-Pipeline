const chalk = require('chalk');
const path = require("path");
const child_process = require('child_process');
const yaml = require("js-yaml");
const fs = require("fs");
require('dotenv').config();
const sshExe = require('../lib/exec/ssh');
const { async } = require('hasbin');
const { pipeline } = require('stream');

exports.command = 'build <job_name> <build_yml>';
exports.desc = 'Building the project ';
exports.builder = yargs => {
    yargs.options({
    });
};

exports.handler = async argv => {
    
    const { job_name, build_yml, processor } = argv;

    let absolutePath = path.join(process.cwd(), build_yml);
    
    console.log(chalk.green("Building project"));

    let vmname = process.env.VM_NAME;
    let hostIp = process.env.HOST_IP;
    let userName = process.env.HOST_USER_NAME;

    console.log(`Job Name: ${job_name}`);

    console.log(`Build yml file: ${build_yml}`);

    console.log(`Processor: ${processor}`);

    console.log(absolutePath);

    let buildDetails = yaml.loadAll(fs.readFileSync(absolutePath, 'utf8'));

    if(processor==="Arm64") {
        // Install necessary roles for running Ansible playbook
        await child_process.execSync(`vm exec ${vmname} "ansible-galaxy install -r /home/ubuntu/shared/cwd/pipeline/requirements.yml"`, {stdio: ['inherit', 'inherit', 'inherit']});

        // Downloads and installs all modules mentioned in PACKAGE inside build.yml
        runPackages(buildDetails, processor, vmname);

        // Downloads and installs all modules mentioned in NPM_PACKAGE inside build.yml
        runNpmPackages(buildDetails, processor, vmname);
        
        // Runs ansible playbooks with roles specified in roles inside build.yml
        runRoles(buildDetails, processor, vmname, job_name);
    } else {
        let sshInfo = await child_process.execSync(`bakerx ssh-info ${vmname}`).toString();
        console.log(sshInfo)
        sshConfig = {
            host: hostIp,
            port: parseInt(sshInfo.split(" ")[5]),
            user: userName,
            identifyFile: sshInfo.split(" ")[2].replaceAll("\"","")
        }

        

        
        await sshExe("ansible-galaxy install -r /bakerx/pipeline/requirements.yml",sshConfig);
        
        // Downloads and installs all modules mentioned in PACKAGE inside build.yml
        await runPackagesForIntel(buildDetails, processor, vmname);

        // Downloads and installs all modules mentioned in NPM_PACKAGE inside build.yml
        await runNpmPackagesForIntel(buildDetails, processor, vmname);

        await runRolesForIntel(buildDetails, processor, vmname, job_name);

    }

    switch(job_name) {
        case "itrust-build":
            // Build for iTrust
            await iTrustBuild(buildDetails, job_name, processor, vmname, hostIp, userName);
            break;
        case "mutation-coverage":
            // Build for mutation-coverage
            await mutationCoverageBuild(buildDetails, job_name, processor, vmname, hostIp, userName, build_yml);
            break;
        default:
            console.log(chalk.blue("No specific code for job found. Running general build code."));
            await generalBuild(buildDetails, job_name, processor, vmname, build_yml);
            break;
    }

};


async function generalBuild(buildDetails, job_name, processor, vmname, build_yml) {
    let gitUrl =  getDefaultGitUrl(buildDetails, job_name);

    if(!gitUrl || gitUrl === "") {
        console.log(chalk.red("GIT URL NOT MENTIONED"));
        process.exit(1);
    }

    await child_process.execSync(`vm exec ${vmname} "'git clone ${gitUrl}'"`, {stdio: ['inherit', 'inherit', 'inherit']});

    let steps = getJobSteps(buildDetails, job_name);
    if(processor==="Arm64") {

        for(let step of steps) {
            console.log(`Running step: ${step.name}`);
            await child_process.execSync(`vm exec ${vmname} "'${step.run}'"`, {stdio: ['inherit', 'inherit', 'inherit']});
        }

    } else {

        /*
            Windows implementation not present as I am a Mac M1 User.
        */

    }
    
    console.log(chalk.green("SUCCESS"));
}

async function mutationCoverageBuild(buildDetails, job_name, processor, vmname, hostIp, userName, build_yml) {

    let jobs = buildDetails[0].jobs;

    let checkbox_GIT_URL = "";
    let logFilePath = "";
    let iterations = 0;
    let snapshots = [];
    let snapshotsName = [];

    // Parse the build.yml file to fetch action items and dependencies 
    for(let job of jobs) {
        if(job.name === job_name) {
            checkbox_GIT_URL = job.DATA.GIT[0];
            logFilePath = job.DATA.LOG_FILE_PATH;
            iterations = job.DATA.iterations;
            for(let snapshot of job.snapshots) {
                snapshots.push(snapshot);
                let name = snapshot.replace(`http://localhost:3000/survey/`, ``);
                name = name.replace(`.md`, ``);
                snapshotsName.push(name);
            }
        }
    }


    let logPath = path.join(process.cwd(), logFilePath);

    if(processor === "Arm64") {
        /*
            Implementation for M1 architecture.
        */

        // Clone checkbox.io.preview and screenshot repositories inside the VM
        await child_process.execSync(`vm exec ${vmname} "'git clone ${checkbox_GIT_URL}'"`, {stdio: ['inherit', 'inherit', 'inherit']});

        // Install dependencies for checkbox.io
        await child_process.execSync(`vm exec ${vmname} "'cd ~/checkbox.io-micro-preview && npm install'"`, {stdio: ['inherit', 'inherit', 'inherit']});

        // Start the project
        await child_process.execSync(`vm exec ${vmname} "'cd ~/checkbox.io-micro-preview && pm2 -s start index.js'"`, {stdio: ['inherit', 'inherit', 'inherit']});

        // Remove the images directory if it exists
        // await child_process.execSync(`vm exec ${vmname} "'rm -rf /home/ubuntu/shared/cwd/images'"`, {stdio: ['inherit', 'inherit', 'inherit']});

        // Create images directory if it doesn't exist
        await child_process.execSync(`vm exec ${vmname} "'mkdir -p /home/ubuntu/shared/cwd/images/baseline'"`, {stdio: ['inherit', 'inherit', 'inherit']});

        console.log("Taking baseline screenshots...");
        fs.appendFileSync(logPath,`Baseline Screenshots: \n`);
        // Take screenshots of the files before mutation
        for(let i=0; i<snapshots.length; i++) {
            console.log(chalk.blue(`Taking screenshot of ${snapshots[i]}`));
            await child_process.execSync(`vm exec ${vmname} "'cd /home/ubuntu/shared/cwd && node screenshot.js ${snapshots[i]} /home/ubuntu/shared/cwd/images/baseline/${snapshotsName[i]} ${logFilePath} ${snapshotsName[i]}'"`, {stdio: ['inherit', 'inherit', 'inherit']});
        }
        
        console.log(chalk.green("Successfuly created baseline snapshots"));
        fs.appendFileSync(logPath,"Baseline Screenshots Completed. \n");

        // Copy the marqdown.js to a different file and use that as a source for mutation
        await child_process.execSync(`vm exec ${vmname} "'cp ~/checkbox.io-micro-preview/marqdown.js ~/checkbox.io-micro-preview/marqdown-original.js'"`, {stdio: ['inherit', 'inherit', 'inherit']});

        // Perform n mutations and create snapshots
        for(let i = 1; i<= iterations; i++) {
            console.log(chalk.grey(`Iteration ${i}:\n`));
            fs.appendFileSync(logPath,`Iteration ${i}: \n`);

            await child_process.execSync(`vm exec ${vmname} "'cd /home/ubuntu/shared/cwd/ && node ASTRewrite.js /home/ubuntu/checkbox.io-micro-preview/marqdown-original.js /home/ubuntu/checkbox.io-micro-preview/marqdown.js ${logFilePath}'"`, {stdio: ['inherit', 'inherit', 'inherit']});
            // This will reload the build after making changes to index.js
            await child_process.execSync(`vm exec ${vmname} "'cd /home/ubuntu/checkbox.io-micro-preview && pm2 -s stop index.js'"`, {stdio: ['inherit', 'inherit', 'inherit']});
            await child_process.execSync(`vm exec ${vmname} "'cd /home/ubuntu/checkbox.io-micro-preview && pm2 -s start index.js'"`, {stdio: ['inherit', 'inherit', 'inherit']});
            
            for(let j=0; j<snapshots.length; j++) {

                console.log(chalk.blue(`Taking screenshot of mutation of ${snapshots[j]}`));
                await child_process.execSync(`vm exec ${vmname} "'cd ~/shared/cwd && node screenshot.js ${snapshots[j]} /home/ubuntu/shared/cwd/images/${snapshotsName[j]}_${i} ${logFilePath} ${snapshotsName[j]}'"`, {stdio: ['inherit', 'inherit', 'inherit']});
                
            }
            fs.appendFileSync(logPath,`\n`);
        }
        
        console.log(chalk.green("Successfuly created mutation snapshots"));

        // Stop checkbox.io micro service
        await child_process.execSync(`vm exec ${vmname} "'cd /home/ubuntu/checkbox.io-micro-preview && pm2 -s stop index.js'"`, {stdio: ['inherit', 'inherit', 'inherit']});

        // Calculate the difference between baseline and the generated images
        await child_process.execSync(`node image-diff.js ${build_yml} ${job_name}`, {stdio: ['inherit', 'inherit', 'inherit']});

        
    } else {
        /*
            Windows: Implementations should be done here.
        */
        // Clone checkbox.io.preview and screenshot repositories inside the VM
        await sshExe(`git clone ${checkbox_GIT_URL}`, sshConfig);

        // Install dependencies for checkbox.io
        await sshExe(`cd /home/vagrant/checkbox.io-micro-preview && npm install`, sshConfig);

        // Start the project
        await sshExe(`cd /home/vagrant/checkbox.io-micro-preview && pm2 start index.js`, sshConfig);

        // Create images directory if it doesn't exist
        await sshExe(`mkdir -p /bakerx/images/baseline`, sshConfig);

        // Take screenshots of the files before mutation
        for(let i=0; i<snapshots.length; i++) {
            console.log(chalk.blue(`Taking screenshot of ${snapshots[i]}`));
            await sshExe(`node /bakerx/screenshot.js ${snapshots[i]} /bakerx/images/baseline/${snapshotsName[i]}`, sshConfig);
        }

        console.log(chalk.green("Successfuly created mutation snapshots"));
        
        // Copy the marqdown.js to a different file and use that as a source for mutation
        await sshExe(`cp ~/checkbox.io-micro-preview/marqdown.js ~/checkbox.io-micro-preview/marqdown-original.js`, sshConfig); 

        // Perform n mutations and create snapshots
        for(let i = 1; i<= iterations; i++) {
            console.log(chalk.grey(`Iteration ${i}:\n`));
 
            await sshExe(`cd /bakerx/ && touch mutation-coverage.log && node ASTRewrite.js /home/vagrant/checkbox.io-micro-preview/marqdown-original    .js /home/vagrant/checkbox.io-micro-preview/marqdown.js /bakerx/mutation-coverage.log`, sshConfig);
            // This will reload the build after making changes to index.js
            await sshExe(`cd /home/vagrant/checkbox.io-micro-preview && pm2 -s stop index.js`, sshConfig);
            await sshExe(`cd /home/vagrant/checkbox.io-micro-preview && pm2 -s start index.js`, sshConfig);

            for(let j=0; j<snapshots.length; j++) {

                console.log(chalk.blue(`Taking screenshot of mutation of ${snapshots[j]}`));
                await sshExe(`node ~/bakerx/screenshot.js ${snapshots[j]} /bakerx/images/${snapshotsName[j]}_${i}`, sshConfig);

            }
        }

        console.log(chalk.green("Successfuly created mutation snapshots"));

        // Stop checkbox.io micro service
        await sshExe(`cd /home/vagrant/checkbox.io-micro-preview && pm2 -s stop index.js`, sshConfig);

        // Calculate the difference between baseline and the generated images
        await sshExe(`cd /bakerx && node image-diff.js ${build_yml} ${job_name}`, sshConfig);


    }   

}

async function iTrustBuild(buildDetails, job_name, processor, vmname, hostIp, userName) {
    let steps = getJobSteps(buildDetails, job_name);

    if(processor==="Arm64") {

        for(let step of steps) {
            console.log(`Running step: ${step.name}`);
            await child_process.execSync(`vm exec ${vmname} "'${step.run}'"`, {stdio: ['inherit', 'inherit', 'inherit']});
        }

    } else {

        let sshInfo = await child_process.execSync(`bakerx ssh-info ${vmname}`).toString();
        console.log(sshInfo)
        sshConfig = {
            host: hostIp,
            port: parseInt(sshInfo.split(" ")[5]),
            user: userName,
            identifyFile: sshInfo.split(" ")[2].replaceAll("\"","")
        }
        
        for(let step of steps) {
            console.log(`Running step: ${step.name}`);
           
            await sshExe(`'${step.run}'`, sshConfig);
        }

    }
    
    console.log(chalk.green("SUCCESS"));
}

function runPackages(buildDetails, processor, vmname) {
    let DB_PASSWORD = process.env.DB_PASSWORD;
    let GIT_ACCESS_TOKEN = process.env.GIT_ACCESS_TOKEN;

    if(processor==="Arm64") {

        for (let PACKAGE of buildDetails[0].setup.PACKAGE) {
            console.log(`Installing package ${PACKAGE}`);
            if(PACKAGE === "mysql-server" ) {
                child_process.execSync(`vm exec ${vmname} "sh /home/ubuntu/shared/cwd/pipeline/ansible_start.sh /home/ubuntu/shared/cwd/pipeline/play.yml ${DB_PASSWORD} ${GIT_ACCESS_TOKEN} mysql"`, {stdio: ['inherit', 'inherit', 'inherit']});
            } else {
                child_process.execSync(`vm exec ${vmname} "ansible-playbook /home/ubuntu/shared/cwd/pipeline/ansible-install.yml -e PACKAGE=${PACKAGE}"`, {stdio: ['inherit', 'inherit', 'inherit']});
            }    
          }
    }
}

async function runPackagesForIntel(buildDetails, processor, vmname) {
    let DB_PASSWORD = process.env.DB_PASSWORD;
    let GIT_ACCESS_TOKEN = process.env.GIT_ACCESS_TOKEN;

    if(!(processor==="Arm64")) {

        for (let PACKAGE of buildDetails[0].setup.PACKAGE) {
            console.log(`Installing package ${PACKAGE}`);
            if(PACKAGE === "mysql-server" ) {
                await sshExe(`sh /bakerx/pipeline/ansible_start.sh /bakerx/pipeline/play.yml ${DB_PASSWORD} ${GIT_ACCESS_TOKEN} mysql`, sshConfig);
            } else {
                await sshExe(`ansible-playbook /bakerx/pipeline/ansible-install.yml -e PACKAGE=${PACKAGE}`, sshConfig);
            }    
          }
    }
}

function runNpmPackages(buildDetails, processor, vmname) {

    if(!("NPM_PACKAGE" in buildDetails[0].setup)) {
        console.log("No NPM packages to install.");
        return;
    }
    
    if(processor==="Arm64") {

        for (let PACKAGE of buildDetails[0].setup.NPM_PACKAGE) {
            console.log(`Installing NPM package ${PACKAGE}`);
            
            child_process.execSync(`vm exec ${vmname} "ansible-playbook /home/ubuntu/shared/cwd/pipeline/ansible-npm-install.yml -e PACKAGE=${PACKAGE}"`, {stdio: ['inherit', 'inherit', 'inherit']});
            
          }
    }
}

async function runNpmPackagesForIntel(buildDetails, processor, vmname) {
    
    if(!(processor==="Arm64")) {

        for (let PACKAGE of buildDetails[0].setup.NPM_PACKAGE) {
            console.log(`Installing NPM package ${PACKAGE}`);
            
            await sshExe(`ansible-playbook /bakerx/pipeline/ansible-npm-install.yml -e PACKAGE=${PACKAGE}`, sshConfig);
            
          }
    }
}

function runRoles(buildDetails, processor, vmname, job_name) {

    if(!("roles" in buildDetails[0].setup)) {
        console.log("No roles.");
        return;
    }

    let DB_PASSWORD = process.env.DB_PASSWORD;

    let GIT_ACCESS_TOKEN = process.env.GIT_ACCESS_TOKEN;

    let GIT_URL = getGitUrl(buildDetails, job_name);

    if(processor==="Arm64") {

        for (let ROLE of buildDetails[0].setup.roles) {
            console.log(`Running role ${ROLE}`);
            child_process.execSync(`vm exec ${vmname} "sh /home/ubuntu/shared/cwd/pipeline/ansible_start.sh /home/ubuntu/shared/cwd/pipeline/play.yml ${DB_PASSWORD} ${GIT_URL} ${ROLE}"`, {stdio: ['inherit', 'inherit', 'inherit']});
          }
    }
}

async function runRolesForIntel(buildDetails, processor, vmname, job_name) {

    let DB_PASSWORD = process.env.DB_PASSWORD;

    let GIT_ACCESS_TOKEN = process.env.GIT_ACCESS_TOKEN;

    let GIT_URL = getGitUrl(buildDetails, job_name);

    if(!(processor==="Arm64")) { 

        for (let ROLE of buildDetails[0].setup.roles) {
            console.log(`Running role ${ROLE}`);
            await sshExe(`sh /bakerx/pipeline/ansible_start.sh /bakerx/pipeline/play.yml ${DB_PASSWORD} ${GIT_URL} ${ROLE}`, sshConfig);
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

function getGitUrl(buildDetails, job_name) {

    let GIT_ACCESS_TOKEN = process.env.GIT_ACCESS_TOKEN;

    switch(job_name) {
        case "itrust-build":
            let data_element = buildDetails[0].setup.DATA;
            let gitUrl = data_element.GIT[0];
            // Adds the GIT access token to git private repositories
            gitUrl = gitUrl.replace(`https://`, `https://${GIT_ACCESS_TOKEN}@`);
            return gitUrl;
        case "fractal-build":
            let data_element_for_fractal = buildDetails[0].setup.DATA;
            let fractalGitUrl = data_element_for_fractal.GIT[0];
            return fractalGitUrl;
    }

    return "";

}

function getDefaultGitUrl(buildDetails, job_name) {
    let data_element_for_fractal = buildDetails[0].setup.DATA;
    let gitUrl = data_element_for_fractal.GIT[0];
    return gitUrl;
}
