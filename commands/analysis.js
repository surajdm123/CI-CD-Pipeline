const esprima = require("esprima");
const options = {tokens:true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const chalk = require('chalk');
const { count } = require("console");
require('dotenv').config();
const path = require("path");
const child_process = require('child_process');

const tempdir = "temp";

const config = require("../analysis-config.json");

let vmname = process.env.VM_NAME;

exports.command = 'static analyse <project_name>';
exports.desc = 'Perform Static Analysis on the file';
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

let globalAll = false;

exports.handler = async argv => {
    const {project_name, all} = argv;

	globalAll = all;

    (async () => {

        await run(project_name, all);

    })();

};

function run(project_name, all) {

	if(!(project_name in config.tests)) {
		console.log(chalk.red("No Project with the given name found. Projects in the config file:"));
		console.log(config.tests);
		console.log(chalk.red("Terminating..."));
		process.exit(0);
	}
	let files = config.tests[project_name];

	

	let fileNames = copyfiles(files);
	var builders = {};
	var problems = {};
	for(let fileName of fileNames) {

		console.log( "Parsing ast and running static analysis...");

		let filePath = `${tempdir}/${fileName}`;
		complexity(filePath, builders, all, problems);
		console.log( "Complete.");

	}

	deleteTempDir();

	if(globalAll) {
		// Report
		for( var node in builders )
		{
			var builder = builders[node];
			builder.report();
		}
	}

	for( let node in problems) {
		let problem = problems[node];
		problem.report();
	}
	
	

}


function copyfiles(files) {

	let fileNames = [];
	let basePath = '/home/ubuntu/';

	child_process.execSync(`vm exec ${vmname} "mkdir -p shared/cwd/${tempdir}/"`, {stdio: ['inherit', 'inherit', 'inherit']});

	for(let file of files) {

		let filePath = basePath + file;

		if(path.extname(filePath) === ".js" ) {
			child_process.execSync(`vm exec ${vmname} "'cp ${filePath} ~/shared/cwd/${tempdir}/'"`, {stdio: ['inherit', 'inherit', 'inherit']});
			let fileName = path.basename(filePath);
			fileNames.push(fileName);
		}
	}

	return fileNames;

}

function deleteTempDir(){
	child_process.execSync(`vm exec ${vmname} "rm -r shared/cwd/${tempdir}"`, {stdio: ['inherit', 'inherit', 'inherit']});
}

function complexity(filePath, builders, all, problems)
{
	var buf = fs.readFileSync(filePath, "utf8");
	var ast = esprima.parse(buf, options);

	var i = 0;

	// Initialize builder for file-level information
	var fileBuilder = new FileBuilder();
	fileBuilder.FileName = path.basename(filePath);
	builders[filePath] = fileBuilder;

	// Initialize problem for file-level information
	var problem = new Problem();
	problem.FileName = path.basename(filePath);
	problems[filePath] = problem;

	// Traverse program with a function visitor.
	traverseWithParents(ast, function (node) 
	{
		// File level calculations
		// 1. Strings
		if(node.type == "Literal" && typeof node.value == "string") {
			fileBuilder.Strings++;
		}

		// 2. Packages
		if(node.type == "CallExpression" && node.callee.type == 'Identifier' && node.callee.name == 'require') {
			fileBuilder.ImportCount++;
		}

		if (node.type === 'FunctionDeclaration') 
		{
			var builder = new FunctionBuilder();

			builder.FunctionName = functionName(node);
			builder.StartLine    = node.loc.start.line;
			// Calculate function level properties.
			// 3. Parameters
			builder.ParameterCount = node.params.length;

			problem.checkThresholdAndAddMethodsWithManyParameters(functionName(node), builder.ParameterCount);

			// 4. Method Length
			builder.Length = node.loc.end.line - node.loc.start.line;

			problem.checkThresholdAndAddLongMethod(functionName(node), builder.Length);

			// With new visitor(s)...
			// 5. CyclomaticComplexity
			traverseWithParents(node, function(child) {
				if( child.type === "IfStatement") {
					builder.SimpleCyclomaticComplexity++;
				}
			})

			// 6. Halstead

			symbols = {};

			traverseWithParents(node, function(child) {
				if( child.type === "BinaryExpression") {
					let operator = child.operator;
					if(operator in symbols) {
						let count = symbols[operator];
						symbols[operator] = ++count;
					} else {
						symbols[operator] = 1;
					}
				}

				if( child.type === "Identifier") {
					let operator = child.name;
					if(operator in symbols) {
						let count = symbols[operator];
						symbols[operator] = ++count;
					} else {
						symbols[operator] = 1;
					}
				}
			});

			builder.Halstead = Object.keys(symbols).length

			// 7. Max Depth
			let max = 0;
			traverseWithParents(node, function(child) {
				let numberOfChildren = childrenLength(child);
				if(numberOfChildren == 0) {
					let count = 0;
					let temp = child;
					while(!(temp.type == 'FunctionDeclaration')) {
						if(temp.type == 'IfStatement' || temp.type == 'WhileStatement') {
							if(!(Object.keys(temp.parent).includes("alternate"))) {
								count++;
							}
						}
						temp = temp.parent;
						
					}

					problem.checkThresholdAndAddMethodsWithNest(builder.FunctionName, count);

					max = Math.max(max, count);
				}
			});

			builder.MaxNestingDepth = max;

			// 8. Max Conditions in one if statement
			let maxConditons = 0;
			traverseWithParents(node, function(child) {
				let conditions = 0;
				if(child.type === 'IfStatement') {
					let conditionCount = recursiveConditions(child.test);
					maxConditons = Math.max(maxConditons, conditionCount);
				}
			});

			builder.MaxConditions = maxConditons;

			builders[builder.FunctionName] = builder;
		}

	});

}

function recursiveConditions(node) {

	let count = 0;

	if(node.type == 'BinaryExpression') {
		count++;
	}

	if(!node.right && !node.left) {
		return count;
	} 

	if(node.type == 'Identifier') {
		return count;
	}

	if((node.left.type == 'Identifier') && (node.right.type == 'Identifier')) {
		return count;
	}

	if(node.left.type == 'Identifier') {
		count += recursiveConditions(node.right);
	}

	else if(node.right.type == 'Identifier') {
		count += recursiveConditions(node.left);
	} else {
		count += recursiveConditions(node.left);
		count += recursiveConditions(node.right);
	}

	return count;

}

// Represent a reusable "class" following the Builder pattern.
class FunctionBuilder
{
	constructor() {
		this.StartLine = 0;
		this.FunctionName = "";
		// The number of parameters for functions
		this.ParameterCount  = 0;
		// The number of lines.
		this.Length = 0;
		// Number of if statements/loops + 1
		this.SimpleCyclomaticComplexity = 1;
		// Number of unique symbols + operators
		this.Halstead = 0;
		// The max depth of scopes (nested ifs, loops, etc)
		this.MaxNestingDepth    = 0;
		// The max number of conditions if one decision statement.
		this.MaxConditions      = 0;
	}

	threshold() {

        const thresholds = {
            SimpleCyclomaticComplexity: [{t: 10, color: 'red'}, {t: 4, color: 'yellow'}],
            Halstead: [{t: 10, color: 'red'}, {t: 3, color: 'yellow'}],
            ParameterCount: [{t: 10, color: 'red'}, {t: 3, color: 'yellow'}],
            Length: [{t: 100, color: 'red'}, {t: 10, color: 'yellow'} ]
        }

        const showScore = (id, value) => {
            let scores = thresholds[id];
            const lowestThreshold = {t: 0, color: 'green'};
            const score = scores.sort( (a,b) => {a.t - b.t}).find(score => score.t <= value) || lowestThreshold;
            return score.color;
        };

        this.Halstead = chalk`{${showScore('Halstead', this.Halstead)} ${this.Halstead}}`;
        this.Length = chalk`{${showScore('Length', this.Length)} ${this.Length}}`;
        this.ParameterCount = chalk`{${showScore('ParameterCount', this.ParameterCount)} ${this.ParameterCount}}`;
        this.SimpleCyclomaticComplexity = chalk`{${showScore('SimpleCyclomaticComplexity', this.SimpleCyclomaticComplexity)} ${this.SimpleCyclomaticComplexity}}`;

	}

	report()
	{
		this.threshold();

		if(globalAll) {
			console.log(
chalk`{blue.underline ${this.FunctionName}}(): at line #${this.StartLine}
Parameters: ${this.ParameterCount}\tLength: ${this.Length}
Cyclomatic: ${this.SimpleCyclomaticComplexity}\tHalstead: ${this.Halstead}
MaxDepth: ${this.MaxNestingDepth}\tMaxConditions: ${this.MaxConditions}\n`
		);
		}
	}
};

// A builder for storing file level information.
function FileBuilder()
{
	this.FileName = "";
	// Number of strings in a file.
	this.Strings = 0;
	// Number of imports in a file.
	this.ImportCount = 0;

	this.report = function()
	{
		console.log (
			chalk`{magenta.underline ${this.FileName}}
Packages: ${this.ImportCount}
Strings ${this.Strings}
`);

	}
}

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor)
{
    var key, child;

    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null && key != 'parent') 
            {
            	child.parent = object;
					traverseWithParents(child, visitor);
            }
        }
    }
}

// Helper function for counting children of node.
function childrenLength(node)
{
	var key, child;
	var count = 0;
	for (key in node) 
	{
		if (node.hasOwnProperty(key)) 
		{
			child = node[key];
			if (typeof child === 'object' && child !== null && key != 'parent') 
			{
				count++;
			}
		}
	}	
	return count;
}


// Helper function for checking if a node is a "decision type node"
function isDecision(node)
{
	if( node.type == 'IfStatement' || node.type == 'ForStatement' || node.type == 'WhileStatement' ||
		 node.type == 'ForInStatement' || node.type == 'DoWhileStatement')
	{
		return true;
	}
	return false;
}

// Helper function for printing out function name.
function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "anon function @" + node.loc.start.line;
}

class Problem {
	constructor() {
		this.descriptions = [];
		this.longMethods = new Set();
		this.methodsWithManyParameters = new Set();
		this.methodsWithManyNestedIfsOrWhiles = new Set();
		this.FileName = "";
	}

	checkThresholdAndAddLongMethod(function_name, count) {
		if(count >= config.threshold.longmethod) {
			this.longMethods.add(function_name);
		}
	}

	checkThresholdAndAddMethodsWithManyParameters(function_name, count) {
		if(count >= config.threshold.methodParametercount) {
			this.methodsWithManyParameters.add(function_name);
		}
	}

	checkThresholdAndAddMethodsWithNest(function_name, count) {
		if(count >= config.threshold.nestcount) {
			this.methodsWithManyNestedIfsOrWhiles.add(function_name);
		}
	}

	report() {
		console.log(chalk.underline(chalk.magenta(this.FileName)));

		let hasProblems = this.longMethods.size > 0 || this.methodsWithManyParameters.size > 0 || this.methodsWithManyNestedIfsOrWhiles.size > 0;

		if(hasProblems) {
			if(this.longMethods.size > 0) {
				console.log("Long Methods (" + chalk.red(this.longMethods.size) + ") :");
				console.log(chalk.blue(Array.from(this.longMethods).join('(), ') + "()"));
				console.log();
			}
			
			if(this.methodsWithManyParameters.size > 0) {
				console.log("Methods with many parameters (" + chalk.red(this.methodsWithManyParameters.size) + ") :");
				console.log(chalk.blue(Array.from(this.methodsWithManyParameters).join('(), ') + "()"));
				console.log();
			}

			if(this.methodsWithManyNestedIfsOrWhiles.size > 0) {
				console.log("Methods with long nested ifs and whiles (" + chalk.red(this.methodsWithManyNestedIfsOrWhiles.size) + ") :");
				console.log(chalk.blue(Array.from(this.methodsWithManyNestedIfsOrWhiles).join('(), ') + "()"));
				console.log();
			}
			
		} else {
			console.log(chalk.green("No problems found."));
		}
	}
}