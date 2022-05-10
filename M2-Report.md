# M2 Project Report

## Team Members:
- Ramya Sai Mullapudi (rmullap)
- Suraj Mallikarjuna Devatha (sdevath)
- Unnati Nadupalli (upnadupa)

## Project Details
M1 Link: [https://github.com/CSC-DevOps/Course/blob/master/Project/M1.md](https://github.com/CSC-DevOps/Course/blob/master/Project/M1.md) <br />

M2 Link: [https://github.com/CSC-DevOps/Course/blob/master/Project/M2.md](https://github.com/CSC-DevOps/Course/blob/master/Project/M2.md)

## How to Run?

$ `git clone https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05.git`

$ `cd DEVOPS-05`

$ `npm install`

$ `npm link`

Add/Modify `.env` file and it should have the following content:
```
VM_NAME=pipeline
DB_PASSWORD=root
GIT_ACCESS_TOKEN=<GIT_ACCESS_TOKEN>
HOST_IP=127.0.0.1
HOST_USER_NAME=vagrant
```

Note: Replace <GIT_ACCESS_TOKEN> with your [Git Personal Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).

### Pipeline Commands 

$ `pipeline init`

![image](https://media.github.ncsu.edu/user/22503/files/29ef4db5-da92-45b0-9642-641b5d965ad5)

$ `pipeline build itrust-build build.yml`

<img width="758" alt="image" src="https://media.github.ncsu.edu/user/22503/files/2bf8833b-0309-4bb2-ba92-f1abe6d0fd3a">


$ `pipeline build mutation-coverage build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/4a236bde-8834-4ef7-aef7-01e5c456441c)

## Screencast 

[Youtube Link](https://youtu.be/11iohXKAoCQ)

## Files generated with 1000 iterations

[Google Drive Link](https://drive.google.com/drive/folders/1IsGEdTGu1k00UNLMrGs3fyD9iEkgHEYb?usp=sharing)

- [mutation-coverage.log](output_files_for_mutation/mutation-coverage.log)
- [Screenshots generated](output_files_for_mutation/images) (Only 1000 images are displayed here, clone the repository to view all the generated images.)
- Screenshots generated:

![ezgif-2-fad71ed207](https://media.github.ncsu.edu/user/22503/files/71dca881-6b7a-4c88-a093-11f12bad008b)



## Experiences and learnings about test and Analysis

- Mutation Coverage: Mutation is making a single syntatic change to the code. Repeating the mutation 1000 times and mutating different changes in each mutation can result in bigger results, such as making `< => >`. Mutation testing, and coverage analysis improve the effectiveness of unit testing (which is usually neglected). Mutation testing gives a quick peek at the tests which are not even reviewed during code review sessions. This method adds metrics to assess quality of the test suite. We understood that mutation changes and its affect cannot be seen immediately. It takes the whole team to follow certain formats, and continuous integration to see good mutation coverage. Some mutations are silly, not really useful but there are times when there is no margin for error and your code needs to work. Knowing ways your code can break and assessing the quality of your own unit tests is a slow skill that need to be inculcated in our coding style over experiences like this project. Mutation testing makes us strict to avoid cutting corners and make a strong unit test suite.

- how to use Esprima: Understanding that Esprima helps us see javascript as a simple language is surprising. With Esprima building an AST (Abstract Syntax Tree) allowed us to view an HTML page as an abstract syntax tree that paved way to complete the mutation Coverage exercise. Without ESTree, parsing a structured data and viewing each node's parent and children syntatic structure makes it easy to detect same conditionals, Negations, Decision Statements, etc, and make operations such as cloning, merging, and consequent decision changes with correct formatting and avoid spurious conflicts and error handling to load the same HTML page after changes. 
- Monitoring resources in the vm and resizing the resources when necessary.
- Automation: During the course of the both milestones, I could understand that automation is priority to make running processes and understanding the things easy and right. Eliminating hard-coded variants, statements, paths, etc makes not only automation, but transition and upgrades in a business setup easily with fewer changes in the standarad procedure which needs to be expanded next. Brainstorming with your team the capabilities, inputs, and values needed on the long run helps in smoother adoption and process selection. Automation also allows us to fix the priorities of each steps. This is an important aspect of successful and efficient automation.
- Using Ansible playbook: It has been a pivotal part in automation process. It needs us to already define its tasks, dependencies, modules to run, hosts, parameters and its precedences. With a standard and automating play, it bounds us to reduce the hard coded values, and made us stay organized.Organizing led to simplifying tasks as a priority. Not only organizing, but testing often has been an inbuilt responsibility while using ansible playbook. These which are needed by a good programmer are learnt.
- The effecient code to run 1000 iterations helps us go over the possibilities of parallel execution each iteration. We theoretically believed parallel execution on a single vm with a single process might work, but a practical scenario brought many factors such as resource dependency, file syncing to add mutation changes, and the need to reload the process to make the changes affective. All these contributed to either running each iteration serial which is needed in this scenario.



## Challenges

- Finding the right libraries and sub-functions and features to implement mutation operations for fuzzing was challenging.
- Generating output for 1000 mutations changes, and taking screenshots for all four .md files is challenging and took a few hours to run.
- Understanding how to reflect new mutation changes in marqdown.js was challenging, where we tried to refresh the js file. But, we eventually understood we need to reload the file for changes to occur (which internally does a hard reload).
- The code lines in a `try and catch ` block are running as daemon in the background, and the lines of code that are dependent on values from the try block are not waiting for the block to finish. This parallelism is a challenge to ask the code to do a serial execution.
- Installing some packages failed intermittently and we fixed it by `update` and `clean cache` and then running all package installations.
- Understanding how to run and use pm2 to start the node instance inside the VM.
- Screenshot repository was taking screenshots of the webpage but certain exceptions weren't handled completely. So had to modify the file based on our requirmenent.
- We faced a lot of problems with screenshot and ASTRewrite, and this project improved my debugging skills.


## Team contributions

The unity ID of the member shown was responsible for the majority of the respective task.
* `sdevath`
    * In `MacBook with M1`, Creating the end-to-end work flow in `build.js` for screenshots, mutation/fuzzing, and checking mutation coverage by Implementing the function `mutationCoverageBuild` in build.js
    * Researched and implemented pm2 to manage the execution of checkbox.io repository.
    * Ran the application for 1000 iterations and stored the output.
    * Implemented a script to calculate mismatch percentage in original and modified rendered HTML as `image-diff.js`
    * Screencast


* `upnadupa`
    * In `windows`, Creating the end-to-end work flow in `build.js` for screenshots, mutation/fuzzing, and checking mutation coverage by Implementing the function `mutationCoverageBuild` in build.js
    * Analysed checkbox.io to discover different kind of API calls
    * Running the mutations for 1000 times and analysing the test results. 


* `rmullap`
    * Implementation of ALL mutation operations in `ASTRewrite.js` for random mutation of any condition/Literal/Statement at any line of code.
    * Running the mutations for 1000 times and analysing the test results. 
    * Collaboration with `sdevath` for debugging unexpected parallel execution in `image-diff.js`of mutation analysis and final mutation coverage calculation Issue.
    * Documentation `readme` file.


All team members were equally invested in solving the bugs as well as testing the mutation changes and analysing the results in the server upon execution of the Ansible scripts.

## Things done in Milestone 2

* Design the work flow by extending build.yml, build.js files for M2 as a function `mutationCoverageBuild`
* Automate snapshot creation
* Automate a randomized mutation script to change a random operator at any line of code.
* Automate script to analyse the original rendered HTML and changed HTML and compare the change due to mutation.
* Screencast.

## Project Board

[Milestone 2 Board](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/projects/2)

<img width="1512" alt="image" src="https://media.github.ncsu.edu/user/22503/files/c0779f4f-c4b3-4862-8ecd-be6cd8a4b7ee">

