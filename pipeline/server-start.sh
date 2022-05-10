#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
set -x

# Force time to sync
sudo timedatectl set-ntp off
sudo timedatectl set-ntp on

# Fix dpkg error
sudo apt update
sudo apt remove initramfs-tools -y
sudo apt clean
sudo apt install initramfs-tools -y

# Script used to initialize your ansible server after provisioning.
sudo add-apt-repository ppa:ansible/ansible -y
sudo apt-get install ansible -y