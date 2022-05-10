const axios    = require("axios");
const chalk  = require('chalk');
const child  = require("child_process");
require('dotenv').config();
const fs = require('fs'); 
const { async } = require("hasbin");

exports.command = 'prod <task>';
exports.desc = 'Provision cloud Instances';
exports.builder = yargs => {
    yargs.options({
		all: {
            alias: 'a',
            describe: 'Display all the results',
            default: false,
            type: 'boolean'
        }
    });
};

const blueDropletName = "blue";
const greenDropletName = "green";
const region = "nyc1";
const image = "ubuntu-20-04-x64"; 
const public_key_path = "/keys/id_rsa.pub";
const inventory = 'inventory';
const sshKeyName = "DEVOPS-05";

let config = {};

config.DIGITAL_OCEAN_TOKEN = process.env.DIGITAL_OCEAN_TOKEN;

let vmname = process.env.VM_NAME;
let hostIp = process.env.HOST_IP;
let userName = process.env.HOST_USER_NAME;

if(!config.DIGITAL_OCEAN_TOKEN) {
    console.log(chalk.red("DIGITAL_OCEAN_TOKEN not defined in .env"));
    process.exit(1);
}

// Configure our headers to use our token when making REST api requests.
const headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.DIGITAL_OCEAN_TOKEN
};


exports.handler = async argv => {
    
    const { processor, task, all } = argv;

    console.log(`Processor: ${processor}`);

    if(task === "up") {
		await run();
	}
    else if (task === "down") {
		if(all) {
			await deleteAll();
		} else {
			await deleteSelectedDroplets();
		}
	}

}

function getServers() {
    let servers = [];
    var array = fs.readFileSync("inventory").toString().split("\n");

    for(let i=0; i<array.length; i++) {
        if (array[i].trim() === '' || array[i].charAt(0) == '[') {
             continue;
        }

        servers.push(array[i]);
    }

    return servers;
}


async function deleteSelectedDroplets() {

    let digitalOceanProvider = new DigitalOceanProvider();

    let droplets = await digitalOceanProvider.getAllDroplets();

	let servers = getServers();

    for (let droplet of droplets) {

		let dropletId = droplet.id;

		let dropletIpAddress = await digitalOceanProvider.dropletInfo(dropletId);

		for(let server of servers) {
			if(server === dropletIpAddress) {
				await digitalOceanProvider.deleteDroplet(dropletId);
				console.log(chalk.blue(`Deleted droplet with IP ${dropletIpAddress}`));
			}
		}

        
    }

    console.log(chalk.green("\nDroplets deleted.\n"));

}

async function deleteAll() {

    let digitalOceanProvider = new DigitalOceanProvider();

    let droplets = await digitalOceanProvider.getAllDroplets();

    for (let droplet of droplets) {

		let dropletId = droplet.id;

		let dropletIpAddress = await digitalOceanProvider.dropletInfo(dropletId);

        await digitalOceanProvider.deleteDroplet(dropletId);
		console.log(chalk.blue(`Deleted droplet with IP ${dropletIpAddress}`));
	}

    console.log(chalk.green("\nAll Droplets deleted.\n"));

}

async function run() {

    let digitalOceanProvider = new DigitalOceanProvider();

    let droplets = await digitalOceanProvider.getAllDroplets();

	child.execSync(`chmod 600 ./keys/id_rsa`,{stdio: ['inherit', 'inherit', 'inherit']});
	child.execSync(`chmod 644 ./keys/id_rsa.pub`,{stdio: ['inherit', 'inherit', 'inherit']});

    let public_key = fs.readFileSync(process.cwd() + public_key_path).toString();
	public_key = public_key.replace(/\r?\n|\r/g, "");
    let isSshKeyPresent = false;

    let sshKeys = await digitalOceanProvider.getSshKeys();

    let sshKeyId = "";
    let sshKeyInfo = {};

    sshKeys.forEach(sshKey => {
        if(sshKey.name === sshKeyName) {
            isSshKeyPresent = true;
            sshKeyInfo = sshKey;
        }
    });

    if(isSshKeyPresent) {
        sshKeyId = sshKeyInfo.id;
    } else {
        sshKeyId = await digitalOceanProvider.addSshKey(sshKeyName, public_key);
    }

    // let blueDropletId = await digitalOceanProvider.createDroplet(blueDropletName, region, image, sshKeyId);
    // let greenDropletId = await digitalOceanProvider.createDroplet(greenDropletName, region, image, sshKeyId);
    // let blueDropletIp = await digitalOceanProvider.dropletInfo(blueDropletId);
    // let greenDropletIp = await digitalOceanProvider.dropletInfo(greenDropletId);

    let isBlueDropletPresent = false;
    let isGreenDropletPresent = false;

    let blueDropletInfo = {};
    let greenDropletInfo = {};


    droplets.forEach(droplet => {
        if(droplet.name === blueDropletName) {
            isBlueDropletPresent = true;
            blueDropletInfo = droplet;
        }

        if(droplet.name === greenDropletName) {
            isGreenDropletPresent = true;
            greenDropletInfo = droplet;
        }
    });

    let blueDropletId = 0;
    let greenDropletId = 0;

    // if(isBlueDropletPresent) {
    //     blueDropletId = blueDropletInfo.id;
    //     console.log(chalk.blue(`${blueDropletName} server already present with ID: ${blueDropletId}.`));
    // } else {
    //     console.log(chalk.blue("Creating blue server."));
    //     blueDropletId = await digitalOceanProvider.createDroplet(blueDropletName, region, image, sshKeyId);
    // }

	blueDropletId = await digitalOceanProvider.createDroplet(blueDropletName, region, image, sshKeyId);

    // if(isGreenDropletPresent) {
    //     greenDropletId = greenDropletInfo.id;
    //     console.log(chalk.blue(`${greenDropletName} server already present with ID: ${greenDropletId}.`));
    // } else {
    //     console.log(chalk.blue("Creating green server."));
    //     greenDropletId = await digitalOceanProvider.createDroplet(greenDropletName, region, image, sshKeyId);
    // }

	greenDropletId = await digitalOceanProvider.createDroplet(greenDropletName, region, image, sshKeyId);
    
    let blueDropletIp = await digitalOceanProvider.dropletInfo(blueDropletId);
    let greenDropletIp = await digitalOceanProvider.dropletInfo(greenDropletId);
    

	console.log(chalk.blue(`\nGreen Droplet IP: ${greenDropletIp}`));
	console.log(chalk.blue(`Blue Droplet IP: ${blueDropletIp}`));

	try {
		fs.unlinkSync(inventory);
	} catch(err) {
		console.log("inventory file not present.");
	}
    

    fs.appendFileSync(inventory, '[greenwebserver]\n');
    fs.appendFileSync(inventory, `${greenDropletIp}\n`);
	fs.appendFileSync(inventory, '[bluewebserver]\n');
    fs.appendFileSync(inventory, `${blueDropletIp}`);

    console.log(chalk.blue("\n\nContents of inventory file:\n"));

    await child.execSync(`cat ${inventory}`,{stdio: ['inherit', 'inherit', 'inherit']});

    console.log(chalk.green("\nProduction Servers are running.\n"));

}

class DigitalOceanProvider
{

    async addSshKey(name, publicKey) {
        let data = 
		{
			"name": name,
			"public_key": publicKey
		};

        let response = await axios.post("https://api.digitalocean.com/v2/account/keys", 
		data,
		{
			headers:headers,
		}).catch( err => 
			console.error(chalk.red(`Error while creating SSH key: ${err}`)) 
		);

		if( !response ) return;

		if(response.status == 201) {
			console.log(chalk.green(`Added SSH Key with ID: ${response.data.ssh_key.id}`));
            config.SSH_KEY_ID = response.data.ssh_key.id;

            return config.SSH_KEY_ID;
		}
    }

    async getSshKeys() {
        // HINT: Add this to the end to get better filter results: ?type=distribution&per_page=100
		let response = await axios.get('https://api.digitalocean.com/v2/account/keys', { headers: headers })
        .catch(err => console.error(`getting keys ${err}`));
        
        if( !response ) return;

        let keys = [];

        response.data.ssh_keys.forEach( i => {
            keys.push({'name': i.name, 'id': i.id});
        });

        return keys;
    }

	async listRegions()
	{
		let response = await axios.get('https://api.digitalocean.com/v2/regions', { headers: headers })
							 .catch(err => console.error(`listRegions ${err}`));
							 
		if( !response ) return;

		// console.log( response.data );
		
		if( response.data.regions )
		{
			for( let region of response.data.regions)
			{
				console.log(region.slug, region.name);
			}
		}

		if( response.headers )
		{
			console.log( chalk.yellow(`Calls remaining ${response.headers["ratelimit-remaining"]}`) );
		}
	}

	async listImages( )
	{
		// HINT: Add this to the end to get better filter results: ?type=distribution&per_page=100
		let response = await axios.get('https://api.digitalocean.com/v2/images?type=distribution&per_page=100', { headers: headers })
							 .catch(err => console.error(`listImages ${err}`));
							 
		if( !response ) return;

		response.data.images.forEach( i => {
			console.log(i.slug);
		});
	}

    async getAllDroplets() {
        // HINT: Add this to the end to get better filter results: ?type=distribution&per_page=100
		let response = await axios.get('https://api.digitalocean.com/v2/droplets', { headers: headers })
        .catch(err => console.error(`listImages ${err}`));
        
        if( !response ) return;

        let droplets = [];

        response.data.droplets.forEach( i => {
            droplets.push({'name': i.name, 'id': i.id});
        });

        return droplets;
    }

	async createDroplet (dropletName, region, imageName, sshKeyId )
	{
		if( dropletName == "" || region == "" || imageName == "" || sshKeyId == "" )
		{
			console.log( chalk.red("You must provide non-empty parameters for createDroplet!") );
			return;
		}

		var data = 
		{
			"name": dropletName,
			"region":region,
			"size":"s-1vcpu-1gb",
			"image":imageName,
			"ssh_keys":[sshKeyId],
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

		console.log("Attempting to create: "+ JSON.stringify(data) );

		let response = await axios.post("https://api.digitalocean.com/v2/droplets", 
		data,
		{
			headers:headers,
		}).catch( err => 
			console.error(chalk.red(`createDroplet: ${err}`)) 
		);

		if( !response ) return;

		if(response.status == 202)
		{
			console.log(chalk.green(`Created droplet id ${response.data.droplet.id}`));
            let dropletId = response.data.droplet.id;
            return dropletId;
		}

        return 0;
	}

	async dropletInfo (id)
	{
		if( typeof id != "number" )
		{
			console.log( chalk.red("You must provide an integer id for your droplet!") );
			return;
		}

		// Make REST request
		let response = await axios.get(`https://api.digitalocean.com/v2/droplets/${id}`, {headers: headers}).catch(err => console.error(`${err}`)) /// await axios.get

		if( !response ) return;

		if( response.data.droplet )
		{
			let droplet = response.data.droplet;
			//console.log(droplet);
			for( let i of droplet.networks.v4) {
                return i.ip_address;
			}
		}

	}
    

	async deleteDroplet(id)
	{
		if( typeof id != "number" )
		{
			console.log( chalk.red("You must provide an integer id for your droplet!") );
			return;
		}

		// HINT, use the DELETE verb.
		let response = await axios.delete(`https://api.digitalocean.com/v2/droplets/${id}`, { headers: headers })
							 .catch(err => console.error(`Delete Droplet ${err}`));

		if( !response ) return;

		// No response body will be sent back, but the response code will indicate success.
		// Specifically, the response code will be a 204, which means that the action was successful with no returned body data.
		if(response.status == 204)
		{
			console.log(`Deleted droplet ${id}`);
		}

	}

};
