# M1 Project Report

## M1 Project Details

[https://github.com/CSC-DevOps/Course/blob/master/Project/M1.md](https://github.com/CSC-DevOps/Course/blob/master/Project/M1.md)

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

<img width="883" alt="image" src="https://media.github.ncsu.edu/user/22503/files/fdd392b7-3bb6-47de-bb61-a685369692f4">

## Experiences and learnings about system setup

- Setting up a system ivolved a load of manual instruction trial and error,  reading help documentation, stackoverflow for intermitent issues and manually trying commands one by one to get one step closer to building the job. Once we figure out the right instructions we have to convert it tinot code, be it Ansible playbook or init script or a yaml file. 
- One of the pivotal parts of setting up system was to understand the error and point of issue correctly and search for the error properly.As our installations and choice of plugins are standarad and used by others already, the solution can be found through `discord` and `forums`. If only we know the right error and why we got the error.
- Installing all these services means creating accounts, gathering necessary confid parameters to setup the VM as we want it. This customisation can be achieved only y understanding how parameters are passed during a command run or a script execution. The setup procedures helped us understand this flow.

## Challenges

- The duration of ansible install resulted in long setup runs. 
- VM timestamp was varying with local setup actual time, so with different timing we had to force set time. We synchronized the clock using `sudo systemctl restart systemd-timesyncd.service`
- Encountered error of `dpkg lock`. We had to delete the /var/lib/dpkg/lock-frontend lock, do OS reboot and it has solved the problem temporally.
- Application.yml in iTrust has an entry password. This got an error to build job. We fixed it using `KWoodson plug-in` to set that password.
- builder did not support clear text password in jenkins.ini file. It required api token to be generated
- All the configuration parameters were stored in an encrypted variables yml file. use those variables value in playbook, we had to pass the password file to the ansible-playbook command.
- Difficult to find the same compatible dependencies, plugins for intel.

## Team contributions

The unity ID of the member shown was responsible for the majority of the respective task.
* Extending the pipeline template, and install build server with configuring `Ansible` - `sdevath`
* Configuring the server and create command pipeline build - `upnadupa`
* Configuring the build environment and auto-run `pipeline build [job-name] [build.yml]` - `rmullap`

All team members were equally invested in solving the bugs as well as testing the configuration changes in the server upon execution of the Ansible scripts.

## Things done in Milestone 1

* Automatically provision and configure a build server.
* Automatically configure a build environment.
* Create a build job.
* Checkpoint report.
* Screencast.


## Checkpoint

[Milestone 1 - Checkpoint](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-05/blob/main/CHECKPOINT-M1.md)

## Screencast

[DevOps M1 Project Demo](https://www.youtube.com/watch?v=6dVtX6EOI1I)
