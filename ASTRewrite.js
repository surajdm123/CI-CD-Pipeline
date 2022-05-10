
const esprima = require("esprima");
const escodegen = require("escodegen");
const options = {tokens:true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const chalk = require('chalk');
let logPath = "";
let operations = [ ConditionalBoundaryMutations,IncrementalMutations,NegateConditionals, MutateControlFlow, ConditionalExpressionMutation,ConstantReplacement, ReturnMutate, NegateConditionals, NonEmptyStringMutation]

function rewrite( filepath, newPath, logFilePath ) {

    var buf = fs.readFileSync(filepath, "utf8");
    var ast = esprima.parse(buf, options);    

    logPath=logFilePath;

    let op = operations[getRandomInt(operations.length)];
    op(ast);

    let code = escodegen.generate(ast);
    fs.writeFileSync( newPath, code);
}

function ConditionalBoundaryMutations(ast){

    let candidates = 0;
    const mutation_dictionary = {">" : ">=", "<": "<=", ">=" : ">", "<=" : "<"};

    let random_index = getRandomInt(Object.keys(mutation_dictionary).length);
    let random_operator = Object.keys(mutation_dictionary)[random_index]
    fs.appendFileSync(logPath,`Condition to be mutated is ${random_operator} \n`);


    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && node.operator === random_operator ) {
            candidates++;
        }
    })

    if (candidates == 0){
        fs.appendFileSync(logPath,`No matching entry found \n`);
        return 0;
    }

    let random_candidate = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && node.operator === random_operator ) {
            if( current === random_candidate ) {
                node.operator = mutation_dictionary[random_operator];
                fs.appendFileSync(logPath,`Replacing boundary conditionals from ${random_operator} to ${mutation_dictionary[random_operator]} on line ${node.loc.start.line}\n`);
                console.log( chalk.red(`Replacing boundary conditionals from ${random_operator} to ${mutation_dictionary[random_operator]} on line ${node.loc.start.line}` ));
            }
            current++;
        }
    })
}

function IncrementalMutations(ast){
    let candidates = 0;
    const mutation_dictionary = {"++" : "--", "--" : "++"};

    let random_index = getRandomInt(Object.keys(mutation_dictionary).length);
    let random_operator = Object.keys(mutation_dictionary)[random_index]
    fs.appendFileSync(logPath,`operator to be mutated is ${random_operator} \n`);


    traverseWithParents(ast, (node) => {
        if( node.type === "UpdateExpression" && node.operator === random_operator ) {
            candidates++;
        }
    })

    if (candidates == 0)
    {
        fs.appendFileSync(logPath,`No matching entry found \n`);
        return 0;
    }

    let random_candidate = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "UpdateExpression" && node.operator === random_operator ) {
            if( current === random_candidate ) {
                if(node.prefix === false){
                    node.operator = mutation_dictionary[random_operator];
                    fs.appendFileSync(logPath,`Replacing increments mutation from ${random_operator} to ${mutation_dictionary[random_operator]} on line ${node.loc.start.line}\n`);
                    console.log( chalk.red(`Replacing increments mutation from ${random_operator} to ${mutation_dictionary[random_operator]} on line ${node.loc.start.line}` ));

                }else{
                    node.prefix=false;
                    fs.appendFileSync(logPath, `Replacing increments mutation from ${random_operator}i to i${mutation_dictionary[random_operator]} on line ${node.loc.start.line}\n`);
                    console.log( chalk.red(`Replacing increments mutation from ${random_operator}i to i${mutation_dictionary[random_operator]} on line ${node.loc.start.line}` ));

                }
                
            }
            current++;
        }
    })
}

function NegateConditionals(ast) {

    let candidates = 0;
    const mutation_dictionary = {"==" : "!=", "!=" : "==", "<" : ">", "<=" : ">", ">" : "<", ">=" : "<"};

    let random_index = getRandomInt(Object.keys(mutation_dictionary).length);
    let random_operator = Object.keys(mutation_dictionary)[random_index]
    fs.appendFileSync(logPath,`operator to be mutated is ${random_operator} \n`);


    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && node.operator === random_operator ) {
            candidates++;
        }
    })

    if (candidates == 0)
    {
        fs.appendFileSync(logPath,`No matching entry found \n`);
        return 0;
    }

    let random_candidate = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && node.operator === random_operator ) {
            if( current === random_candidate ) {
                node.operator = mutation_dictionary[random_operator];
                fs.appendFileSync(logPath,`Replacing Negate conditionals from ${random_operator} to ${mutation_dictionary[random_operator]} on line ${functionName(node)}\n`);
                console.log( chalk.red(`Replacing Negate conditionals from ${random_operator} to ${mutation_dictionary[random_operator]} on line ${functionName(node)}` ));
            }
            current++;
        }
    })

}

function MutateControlFlow(ast){

    let candidates = 0;

    let  preceedingNode = null;
    traverseWithParents(ast, (node) => {
        if (node.type === "IfStatement" && preceedingNode && preceedingNode.parent.parent.type === "IfStatement" && (!preceedingNode.parent.parent.alternate || preceedingNode.parent.parent.alternate.type === "IfStatement")) {
            candidates++;
        }        
        preceedingNode = node;
    })

    fs.appendFileSync(logPath,`If to be mutated to If-else \n`);

    if (candidates == 0)
    {
        fs.appendFileSync(logPath,`No matching entry found \n`);
        return 0;
    }

    let random_candidate = getRandomInt(candidates);
    let current = 0;
    preceedingNode = null;
    traverseWithParents(ast, (node) => {
        
        if (node.type === "IfStatement" && preceedingNode && preceedingNode.parent.parent.type === "IfStatement" && (!preceedingNode.parent.parent.alternate || preceedingNode.parent.parent.alternate.type === "IfStatement")) {
            if(current===random_candidate){
            
                console.log("traversing the if block");
                let currentNode = preceedingNode.parent.parent;
                while (currentNode.alternate && currentNode.alternate.type === "IfStatement") {
                    currentNode = currentNode.alternate;
                }
                currentNode.alternate = node;
                let currentIndex = node.parent.indexOf(node);
                node.parent.splice(currentIndex,childrenLength(node));
                fs.appendFileSync(logPath,`Replacing control flow statement on line ${functionName(node)}\n`);
                console.log( chalk.red(`Replacing control flow statement on line ${functionName(node)}` ));
            }
            current++;
        }
        preceedingNode = node;
        
    })
}

function ConditionalExpressionMutation(ast){

    let candidates = 0;
    console.log('in ConditionalExpressionMutation function');
    const mutation_dictionary = {"&&" : "||", "||" : "&&"};

    let random_index = getRandomInt(Object.keys(mutation_dictionary).length);
    let random_operator = Object.keys(mutation_dictionary)[random_index]
    fs.appendFileSync(logPath,`logical operator to be mutated is ${random_operator} \n`);


    traverseWithParents(ast, (node) => {
        if( node.type === "LogicalExpression" && node.operator === random_operator ) {
            candidates++;
        }
    })

    if (candidates == 0)
    {
        fs.appendFileSync(logPath,`No matching entry found \n`);
        return 0;
    }

    let random_candidate = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "LogicalExpression" && node.operator === random_operator ) {
            if( current === random_candidate ) {
                node.operator = mutation_dictionary[random_operator];
                fs.appendFileSync(logPath,`Replacing Conditional expression from ${random_operator} to ${mutation_dictionary[random_operator]} on line ${functionName(node)}\n`);
                console.log( chalk.red(`Replacing Conditional expression from ${random_operator} to ${mutation_dictionary[random_operator]} on line ${functionName(node)}` ));
            }
            current++;
        }
    })

}

function ReturnMutate(ast){
    let candidates = 0;
    console.log('in ReturnMutate function');
    
    traverseWithParents(ast, (node) => {
        if( node.type === "ReturnStatement") {
            candidates++;
        }
    })

    if (candidates == 0)
    {
        fs.appendFileSync(logPath,`No matching entry found \n`);
        return 0;
    }

    let random_candidate = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "ReturnStatement" ) {
            if( current === random_candidate ) {
                let returnIndex = node.parent.indexOf(node);
                node.parent.splice(getRandomInt(returnIndex-1),0,node);
                fs.appendFileSync(logPath,`Copying return ${node.argument.name} statement from line ${functionName(node)} to a random location in the function\n`);
                console.log( chalk.red(`copying return ${node.argument.name} statement from line ${functionName(node)} to a random location in the function`));
            }
            current++;
        }
    })

}
function NonEmptyStringMutation(ast){

    let candidates = 0;
    console.log('in NonEmptyStringMutation function');
    const mutation_dictionary = {"" : "<div>Bug</div>"};

    let random_index = getRandomInt(Object.keys(mutation_dictionary).length);
    let random_operator = Object.keys(mutation_dictionary)[random_index]
    fs.appendFileSync(logPath,`non empty string to be mutated is ${random_operator} \n`);

    traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.value === random_operator) {
            candidates++;
        }
    })

    if (candidates == 0)
    {
        fs.appendFileSync(logPath,`No matching entry found \n`);
        return 0;
    }

    let random_candidate = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.value === random_operator ) {
            if( current === random_candidate ) {
                node.value = mutation_dictionary[random_operator];
                fs.appendFileSync(logPath,`Replacing non empty string expression on ${functionName(node)}\n`);
                console.log( chalk.red(`Replacing non empty string expression on ${functionName(node)}` ));
            }
            current++;
        }
    })
}
function ConstantReplacement(ast){
    let candidates = 0;
    console.log('in ConditionalExpressionMutation function');
    const mutation_dictionary = {0:3,3:0};

    let random_index = getRandomInt(Object.keys(mutation_dictionary).length);
    let random_operator = Object.keys(mutation_dictionary)[random_index]
    fs.appendFileSync(logPath,`constant to be mutated is ${random_operator} \n`);


    traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.value === parseInt(random_operator) ) {
            candidates++;
        }
    })

    if (candidates == 0)
    {
        fs.appendFileSync(logPath,`No matching entry found \n`);
        return 0;
    }

    let random_candidate = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.value === parseInt(random_operator) ) {
            if( current === parseInt(random_candidate) ) {
                node.value = mutation_dictionary[random_operator];
                fs.appendFileSync(logPath,`Replacing constant expression on line ${functionName(node)} from ${random_operator} to ${mutation_dictionary[random_operator]}\n`);
                console.log( chalk.red(`Replacing constant expression on line ${functionName(node)} from ${random_operator} to ${mutation_dictionary[random_operator]}` ));
            }
            current++;
        }
    })
}

rewrite(process.argv[2], process.argv[3],process.argv[4]);


function getRandomInt(max) {
    return Math.floor(Math.random() * max);
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
	// if( node.id )
	// {
	// 	return node.id.name;
	// }
	return node.loc.start.line;
}
