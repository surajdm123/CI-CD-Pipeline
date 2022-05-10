# Milestone 1 - Checkpoint

## Current Progress

* [x] Automatically provision and configure a build server.
* [ ] Automatically configure a build environment. (20%)
* [ ] Create a build job. (20%)
* [x] Checkpoint report
* [ ] Screencast. (10%)


### Github Project Board

<img width="1121" alt="Screen Shot 2022-03-02 at 10 23 49 AM" src="https://media.github.ncsu.edu/user/21815/files/2b318b68-377c-4ca9-af97-4f8cd5305272">

## Completed

* Functionality for `pipeline init` is completed. 
* Installing dependencies for `init`
* output the connection IP and port after running.
* Automatically start ansible playbook is completed.
* Automatically build using `pipeline build` works partially. Included screenshot below.

## Pipeline `init` execution output

* VM configured and started
<img width="1440" alt="Screen Shot 2022-03-02 at 10 39 04 AM" src="https://media.github.ncsu.edu/user/21815/files/05924c59-56ad-4e68-8d81-eaff20004d16">


* Output of connection information
<img width="956" alt="Screen Shot 2022-03-02 at 11 00 07 AM" src="https://media.github.ncsu.edu/user/21815/files/95e4a720-7e70-44d3-bdeb-ec6c6c76c9a6">

* SSH into the VM as ubuntu user
<img width="1225" alt="Screen Shot 2022-03-02 at 10 45 41 AM" src="https://media.github.ncsu.edu/user/21815/files/1f5ab0bc-eccc-40da-8dcf-7133bee0354f">

* `pipeline build`

![WhatsApp Image 2022-03-02 at 10 59 03 AM](https://media.github.ncsu.edu/user/21815/files/85f023a2-097f-49a0-aa0b-51f43232eb87)


## Work to be done

* Create a pipeline build job in server via code and run this job.
* A template is started for build job, but need to add specific components to build the environment
* Document experiences and issues faced in the report and record screencast for the milestone.

## Team contributions

The unity ID of the member shown was responsible for the majority of the respective task.
* Extending the pipeline template, and install build server with configuring `Ansible` - `sdevath`
* Configuring the server and create command pipeline build - `upnadupa`
* Configuring the build environment and auto-run `pipeline build [job-name] [build.yml]` - `rmullap`

All team members were equally invested in solving the bugs as well as testing the configuration changes in the server upon execution of the Ansible scripts.
