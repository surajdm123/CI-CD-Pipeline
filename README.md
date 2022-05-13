# F0 Project Report

## About my machine

**Laptop Model:** Macbook Pro 14" (M1 Model) 

**Operating System:** macOS Monterey Version 12.3.1

## Table of Contents
- [Project Details](#project-details)
- [Report Links](#report-links)
- [How to Run?](#how-to-run)
- [How to create your own build file?](#how-to-create-your-own-build-file)
- [Projects Implemented for F0](#projects-implemented-for-f0)
  - [1. Fractals](#1-fractals)
  - [2. PencilBlue](#2-pencilblue)
  - [3. Calculator](#3-calculator)
- [New Features/Stages Implemented](#new-featuresstages-implemented)
  - [1. Static Analysis](#1-static-analysis)
  - [2. Prod Down](#2-prod-down)
  - [3. Deployment Strategy](#3-deployment-strategy)
- [Screencast](#screencast)
- [Pipeline Commands](#pipeline-commands)
  - [General Commands](#general-commands)
  - [iTrust](#itrust)
  - [Mutation Coverage](#mutation-coverage)
  - [Fractals](#fractals)
  - [PencilBlue](#pencilblue)
  - [Calculator](#calculator)
- [Experiences and learnings](#experiences-and-learnings)
- [Challenges](#challenges)

## Project Details

F0 Link: [https://github.com/CSC-DevOps/Course/blob/master/Project/F0.md](https://github.com/CSC-DevOps/Course/blob/master/Project/F0.md) <br />

M1 Link: [https://github.com/CSC-DevOps/Course/blob/master/Project/M1.md](https://github.com/CSC-DevOps/Course/blob/master/Project/M1.md) <br />

M2 Link: [https://github.com/CSC-DevOps/Course/blob/master/Project/M2.md](https://github.com/CSC-DevOps/Course/blob/master/Project/M2.md) <br />

M3 Link: [https://github.com/CSC-DevOps/Course/blob/master/Project/M3.md](https://github.com/CSC-DevOps/Course/blob/master/Project/M3.md) <br />

## Report Links

[M1 Report](M1-Report.md)

[M2 Report](M2-Report.md)

[M3 Report](M3-Report.md)

## How to Run?

$ `git clone https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05.git -b F0-sdevath`

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
DIGITAL_OCEAN_TOKEN=<API_TOKEN>
```

Note: Replace <GIT_ACCESS_TOKEN> with your [Git Personal Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) and <API_TOKEN> with your [Digital Ocean API Token](https://docs.digitalocean.com/reference/api/create-personal-access-token/).

You can even create your own public and private keys in the keys directory of this repository using `ssh-keygen`. This will be used for connecting to your droplets.

## How to create your own build file?

```yml
setup:
  PACKAGE: 
    - # List all the packages that has to be installed here.
  NPM_PACKAGE: 
    - # List all the npm packages that has to be installed here.
  DATA:
    GIT:
    - # The Github URL can be added here.
jobs: # Create and add details of multiple jobs in this section
  - name: demo-build # job name
    steps: # All the steps runs in the VM
      - name: Install Dependencies
        run: npm install # Command that has to be performed
      - name: Build Demo Project # Name of the step
        run: npm run build
  - name: demo-test # another job name
    steps:
      - name: Test Demo Project 
        run: npm test 
  - name: todo-deploy # another job name
    DATA: # variables needed for the task.
      port: 8000
    tomcat: #[OPTIONAL] This downloads and hosts the tomcat server in the production environment(s).
      TOMCAT_URL: https://dlcdn.apache.org/tomcat/tomcat-9/v9.0.62/bin/apache-tomcat-9.0.62.tar.gz
      DEST_PATH: /opt/tomcat # The directory in the production environment where it should be hosted.
    steps: # Steps mentioned in this section will be executed in the VM
      - name: Package Demo Project for deployment 
        run: npm package
    scp: # [OPTIONAL] This can be used to copy a file/directory from the VM to the production environment.
      SRC_FILE_NAME: ~/DemoProject/proj.war # File from the VM to be copied
      REMOTE_FILE_PATH: /opt/tomcat/ # File will be copied to the production environment(s) and placed here. 
    prod_steps: # The steps mentioned under prod_steps will be executed in the production environment(s).
      - name: Run the Demo app 
        run: npm start
```

Examples:
- [fractal-build.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/F0-sdevath/pipeline/fractal-build.yml)
- [fractal-jar-build.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/F0-sdevath/pipeline/fractal-jar-build.yml)
- [pencilblue-build.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/F0-sdevath/pipeline/pencilblue-build.yml)
- [calculator-build.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/F0-sdevath/pipeline/calculator-build.yml)

## Projects Implemented for F0

### 1. Fractals

**GitHub Repo:** 
  - **Deployment using .war:** [https://github.com/surajdm123/Fractals.git](https://github.com/surajdm123/Fractals.git)
  - **Deployment using .jar:** [https://github.com/smwolfskill/Fractals.git](https://github.com/smwolfskill/Fractals.git)

**Build File:** 
  - **Deployment using .war:** [fractal-build.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/F0-sdevath/pipeline/fractal-build.yml)
  - **Deployment using .jar:** [fractal-jar-build.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/F0-sdevath/pipeline/fractal-jar-build.yml)


**Tech Stack:** 
- SpringBoot
- MySQL
- Maven
- Java
- HTML & CSS
- Tomcat (for deployment)

### 2. PencilBlue

**GitHub Repo:** [https://github.com/pencilblue/pencilblue](https://github.com/pencilblue/pencilblue)

**Build File:** [pencilblue-build.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/F0-sdevath/pipeline/pencilblue-build.yml)

**Tech Stack:** 
- NodeJS
- MongoDB
- HTML & CSS

### 3. Calculator

**GitHub Repo:** [https://github.com/actionsdemos/calculator](https://github.com/actionsdemos/calculator)

**Build File:** [calculator-build.yml](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/F0-sdevath/pipeline/calculator-build.yml)

**Tech Stack:** 
- NodeJS
- HTML & CSS

## New Features/Stages Implemented

### 1. Static Analysis

The `analysis-config.json` file will contain the project name and the files for which static analysis has to be performed on. The threshold values can also be set here and if any metric crosses the threshold, it'll be marked and displayed in the terminal.

<img width="881" alt="image" src="https://media.github.ncsu.edu/user/22503/files/50acc757-ab11-40f3-94df-b8b3b703545e">

$ `pipeline static analysis checkbox`

This command displays all the method names for which the metrics were above the set threshold values.

![image](https://media.github.ncsu.edu/user/22503/files/51199e70-42eb-4b42-9461-9d72f1fb80df)

$ `pipeline static analysis checkbox -a`

Adding the `-a` option will give you a detailed view of the js files in the project and also it's functions.

![image](https://media.github.ncsu.edu/user/22503/files/2fa07df4-346f-4c4f-93d3-f3f84a11d5f8)

- When can this be used?
  - We can use this before the deploy stage of our pipeline. The analysis can help developers make changes to the code before deployment enabling them to ensure that the production environments have clean code.

### 2. Prod Down

$ `pipeline prod down`

![image](https://media.github.ncsu.edu/user/22503/files/fb75cd78-01e7-4bb7-851e-85b20c2ca1eb)

$ `pipeline prod down -a`

This deletes all the droplets created in Digital Ocean.

![image](https://media.github.ncsu.edu/user/22503/files/62f7d71d-04d7-4079-8254-7657a8eb626a)

### 3. Deployment Strategy

All the projects that are integreated into the pipleine can/will be deployed with **blue-green deployment model** stratergy. The VM acts as the proxy server for the BLUE and GREEN servers that are deployed in Digital Ocean. Here, GREEN acts as the active server and BLUE will be on standby until GREEN goes down. The code has been implmented and can be found in [run-proxy.js](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/F0-sdevath/run-proxy.js).

<img width="1000" alt="deploy" src="https://media.github.ncsu.edu/user/22503/files/0f79b1ec-d613-4507-8e0d-796ad15c3126">

## Screencast 

[![F0 Project Demo Screencast](https://img.youtube.com/vi/KVHndcGHvrU/0.jpg)](https://www.youtube.com/watch?v=KVHndcGHvrU)

[Youtube Link](https://www.youtube.com/watch?v=KVHndcGHvrU)

## Pipeline Commands 

### General Commands

$ `pipeline init`

![image](https://media.github.ncsu.edu/user/22503/files/29ef4db5-da92-45b0-9642-641b5d965ad5)

$ `pipeline prod up`

<img width="1073" alt="prod-up" src="https://media.github.ncsu.edu/user/22503/files/b892aace-926a-412d-a9bf-30cc856fc4e5">

### iTrust

$ `pipeline build itrust-build build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/707c30e1-c3e3-4d49-a664-07bd4e4b3f4c)

$ `pipeline deploy inventory itrust-deploy build.yml`

<img width="1184" alt="deploy" src="https://media.github.ncsu.edu/user/22503/files/0f79b1ec-d613-4507-8e0d-796ad15c3126">

### Mutation Coverage

$ `pipeline build mutation-coverage build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/4a236bde-8834-4ef7-aef7-01e5c456441c)

### Fractals

$ `pipeline build fractal-build pipeline/fractal-build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/3ed51ff8-524a-402c-813f-ee29f4d4f9c8)

$ `pipeline build fractal-test pipeline/fractal-build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/1bda4bc3-5d73-46e8-818f-5cd3c1c609e7)

$ `pipeline deploy inventory fractal-deploy pipeline/fractal-build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/67b521d9-742d-4709-a714-a6b5bab17e9b)

$ `open http://192.168.11.34:8080/Fractals`

<img width="1624" alt="image" src="https://media.github.ncsu.edu/user/22503/files/e4657218-8908-4b1f-9797-9b4613392c3b">

### PencilBlue

$ `pipeline build pencilblue-build pipeline/pencilblue-build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/47905b4e-e1fa-4736-90d1-5282ca619895)

$ `pipeline build pencilblue-test pipeline/pencilblue-build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/578333e8-7089-4840-b74a-eb06db9a1c47)

$ `pipeline deploy inventory pencilblue-deploy pipeline/pencilblue-build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/1f15dcba-0728-4c5c-98e2-5cf7970cb4fd)

$ `open http://192.168.11.34:8080/setup`

<img width="1624" alt="image" src="https://media.github.ncsu.edu/user/22503/files/9b7a95d9-8d89-4bdd-b88f-1ff06eb6c38e">

### Calculator

$ `pipeline build calculator-build pipeline/calculator-build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/db6d65aa-9ef3-4644-bc3c-bc45254da7ed)

$ `pipeline build calculator-test pipeline/calculator-build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/927cc1ea-39de-4a97-b9b8-25a913471893)

$ `pipeline deploy inventory calculator-deploy pipeline/calculator-build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/549def6f-f064-45d7-8c20-a474e9fedc3f)

$ `open http://192.168.11.34:5000/`

<img width="1624" alt="image" src="https://media.github.ncsu.edu/user/22503/files/0a9e7323-3a02-4ab7-b65a-3dfcf64cda0a">

## Experiences and learnings
- Automation: During the course of the three milestones and the F0 project, I could understand that automation is priority to make running processes and understanding the things easy and right. Eliminating hard-coded variants, statements, paths, etc makes not only automation, but transition and upgrades in a business setup easily with fewer changes in the standarad procedure which needs to be expanded next. Brainstorming with your team the capabilities, inputs, and values needed on the long run helps in smoother adoption and process selection. Automation also allows us to fix the priorities of each steps. This is an important aspect of successful and efficient automation.
- Using Ansible playbook: It has been a pivotal part in automation process. It needs us to already define its tasks, dependencies, modules to run, hosts, parameters and its precedences. With a standard and automating play, it bounds us to reduce the hard coded values, and made us stay organized.Organizing led to simplifying tasks as a priority. Not only organizing, but testing often has been an inbuilt responsibility while using ansible playbook. These which are needed by a good programmer are learnt.
- Esprima Library: Understanding that Esprima helps us see javascript as a simple language is surprising. With Esprima building an AST (Abstract Syntax Tree) allowed us to view an HTML page as an abstract syntax tree that paved way to complete the mutation Coverage exercise. Without ESTree, parsing a structured data and viewing each node's parent and children syntatic structure makes it easy to detect same conditionals, Negations, Decision Statements, etc, and make operations such as cloning, merging, and consequent decision changes with correct formatting and avoid spurious conflicts and error handling to load the same HTML page after changes.
- Blue Green Deployment: Blue green deployment is an application release model that gradually transfers user traffic from a previous version of an app or microservice to a nearly identical new release—both of which are running in production. The old version can be called the blue environment while the new version can be known as the green environment. Once production traffic is fully transferred from blue to green, blue can standby in case of rollback or pulled from production and updated to become the template upon which the next update is made.
- Static Analysis: Static Analysis is the automated analysis of source code without executing the application. This will be very helpful to identify security vulnerabilities, Performance issues, Non-compliance with standards and use of out of date programming constructs.
- DigitalOcean: Cloud deployment is the process of deploying an application through one or more hosting models. The services provided by DigitalOcean helped a lot to automate the deployment process. The APIs and the documentation were clear and guided us through the entire automation process.

## Challenges
- Understanding the Digital Ocean API documentation to create droplets with public keys, that will be later used to ssh into the server, was a time consuming and challenging task.
- Generalizing the code to accept any kind of build.yml file with different job specification was very interesting and a challenging task. Building and deploying projects hardly took 2 minutes to implement. I just had to configure a build.yml file with the steps and setup a few dependencies to get it ready for deployment.
- I faced a lot of issues trying to figure out how to generate .war files from iTrust and Fractals. I later found out that some code changes were required to get it started.
