const resemble = require("node-resemble-js");
const yaml = require("js-yaml");
const chalk = require('chalk');
const path = require("path");

const fs = require("fs");
const { async } = require("hasbin");


const build_yml = process.argv[2];

const job_name = process.argv[3];

let absolutePath = path.join(process.cwd(), build_yml);

let buildDetails = yaml.loadAll(fs.readFileSync(absolutePath, 'utf8'));

let jobs = buildDetails[0].jobs;

const baselinePath = "images/baseline";
const mutatedPath = "images";

let iterations = 0;
let snapshots = [];
let snapshotNames = [];
let logFilePath = "";

for(let job of jobs) {
    if(job.name === job_name) {
        iterations = job.DATA.iterations;
        logFilePath = job.DATA.LOG_FILE_PATH;
        for(let snapshot of job.snapshots) {
            snapshots.push(snapshot);
            let name = snapshot.replace(`http://localhost:3000/survey/`, ``);
            name = name.replace(`.md`, ``);
            snapshotNames.push(name);
        }
    }
}

let totalFilesChanged = 0;
let totalFilesGenerated = 0;
let notGeneratedFiles = 0;
let filesUnchanged = 0;
let iterationsWithChanges = 0;
let iterationsWithoutChanges = 0;
let errorIterations = 0;

fs.appendFileSync(logFilePath,`----------------------\n`);
fs.appendFileSync(logFilePath,`Image comparison results:\n`);
fs.appendFileSync(logFilePath,`----------------------\n\n`);



(async () => {
    for (let i = 1; i <= iterations; i++) {
        fs.appendFileSync(logFilePath,`Iteration ${i}:\n`);

        console.log(chalk.gray(`Iteration ${i}`));

        let filesChanged = false;
        let containsError = false;
    
        for await (let snapshotName of snapshotNames) {
            
            let baselineImage = `${baselinePath}/${snapshotName}.png`;
            let mutatedImage = `${mutatedPath}/${snapshotName}_${i}.png`;
    
            try {
                if (fs.existsSync(baselineImage) && fs.existsSync(mutatedImage)) {

                    totalFilesGenerated++;
    
                    let misMatchPercentage = await compare(baselineImage, mutatedImage, snapshotName);

                    fs.appendFileSync(logFilePath,`\t${snapshotName}: ${misMatchPercentage}% mismatch\n`);
                    if(misMatchPercentage > 0) {
                        console.log(chalk.yellow(`${snapshotName}: ${misMatchPercentage}% mismatch`));
                        totalFilesChanged++;
                        filesChanged = true;
                    } else {
                        console.log(`${snapshotName}: ${misMatchPercentage}% mismatch`);
                        filesUnchanged++;
                    }
    
                } else {
                    console.log(chalk.red(`Test Skipped...`));
                    fs.appendFileSync(logFilePath,`\t${snapshotName}: File not generated\n`);
                    containsError = true;
                    notGeneratedFiles++;
                }
              } catch(err) {
                console.error(err);
            }
        }

        if(containsError) {
            errorIterations++;
        }

        if(filesChanged) {
            iterationsWithChanges++;
        } else {
            iterationsWithoutChanges++;
        }
    
        console.log();
    
    }

    console.log(chalk.green("---Iteration Statistics---\n"));

    console.log(`Total Iteratons: ${iterations}`);
    console.log(`Iterations with changes: ${iterationsWithChanges}`);
    console.log(`Iterations without changes: ${iterationsWithoutChanges - errorIterations}`);
    console.log(`Error Iterations: ${errorIterations}\n`);

    console.log(chalk.green("---File Statistics---\n"));

    console.log(`Total Number of Test Files: ${snapshotNames.length}`)
    console.log(`Total Files Generated: ${totalFilesGenerated}`);
    console.log(`Total Files Changed: ${totalFilesChanged}`);
    

    let mutationCoverage = (iterationsWithChanges/(iterations - errorIterations)) * 100;

    console.log(chalk.green(`MUTATION COVERAGE: ${mutationCoverage}%`));
    fs.appendFileSync(logFilePath,`\n\nMUTATION COVERAGE: ${mutationCoverage}%\n\n`);

})();


async function compare(baselineImage, mutatedImage, snapshotName) {
    return new Promise(function (resolve, reject) {
        resemble(baselineImage)
        .compareTo(mutatedImage)
        .onComplete(function (data) {

            resolve(data.misMatchPercentage);
            
        });
    });
}