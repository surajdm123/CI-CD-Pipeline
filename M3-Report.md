# M3 Project Report

## Project Details
M1 Link: [https://github.com/CSC-DevOps/Course/blob/master/Project/M1.md](https://github.com/CSC-DevOps/Course/blob/master/Project/M1.md) <br />

M2 Link: [https://github.com/CSC-DevOps/Course/blob/master/Project/M2.md](https://github.com/CSC-DevOps/Course/blob/master/Project/M2.md) <br />

M3 Link: [https://github.com/CSC-DevOps/Course/blob/master/Project/M3.md](https://github.com/CSC-DevOps/Course/blob/master/Project/M3.md) <br />

## Report Links

[M1 Report](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/main/M1-Report.md)

[M2 Report](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/main/M2-Report.md)

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
DIGITAL_OCEAN_TOKEN=<API_TOKEN>
```

Note: Replace <GIT_ACCESS_TOKEN> with your [Git Personal Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) and <API_TOKEN> with your [Digital Ocean API Token](https://docs.digitalocean.com/reference/api/create-personal-access-token/)

### Pipeline Commands 

$ `pipeline init`

![image](https://media.github.ncsu.edu/user/22503/files/29ef4db5-da92-45b0-9642-641b5d965ad5)

$ `pipeline build itrust-build build.yml`

<img width="758" alt="image" src="https://media.github.ncsu.edu/user/22503/files/2bf8833b-0309-4bb2-ba92-f1abe6d0fd3a">


$ `pipeline build mutation-coverage build.yml`

![image](https://media.github.ncsu.edu/user/22503/files/4a236bde-8834-4ef7-aef7-01e5c456441c)

$ `pipeline prod up`

<img width="1073" alt="prod-up" src="https://media.github.ncsu.edu/user/22503/files/b892aace-926a-412d-a9bf-30cc856fc4e5">

$ `pipeline deploy inventory itrust-deploy build.yml`

<img width="1184" alt="deploy" src="https://media.github.ncsu.edu/user/22503/files/0f79b1ec-d613-4507-8e0d-796ad15c3126">

## Experiences and learnings about test and Analysis
- Tomcat
- Digital Ocean API
- Monitoring resources in the vm and resizing the resources when necessary.
- Automation: During the course of the both milestones, I could understand that automation is priority to make running processes and understanding the things easy and right. Eliminating hard-coded variants, statements, paths, etc makes not only automation, but transition and upgrades in a business setup easily with fewer changes in the standarad procedure which needs to be expanded next. Brainstorming with your team the capabilities, inputs, and values needed on the long run helps in smoother adoption and process selection. Automation also allows us to fix the priorities of each steps. This is an important aspect of successful and efficient automation.
- Using Ansible playbook: It has been a pivotal part in automation process. It needs us to already define its tasks, dependencies, modules to run, hosts, parameters and its precedences. With a standard and automating play, it bounds us to reduce the hard coded values, and made us stay organized.Organizing led to simplifying tasks as a priority. Not only organizing, but testing often has been an inbuilt responsibility while using ansible playbook. These which are needed by a good programmer are learnt.



## Challenges
- Our team faced a problem trying to genarate a war file from the maven application. We had to fork the application and make a few minor code changes to get it to work.
- Coping the files into the BLUE and GREEN server from the VM was a challenging task as we were facing a lot of errors in the process.
- Researching about the DigitalOcean APIs, through their documentation was also a challenging task.


