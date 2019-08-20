var mysql = require("mysql");
var inquirer = require("inquirer");

// create the connection information for the sql database
var connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "",
    database: "bamazon"
});

// connect to the mysql server and sql database
connection.connect(function (err) {
    if (err) throw err;
    // run the start function after the connection is made to prompt the user
    start();
});

function start() {
    inquirer
        .prompt({
            name: "menuOptions",
            type: "list",
            message: 'What would you like to do?',
            choices: ["View products for sale", "View low inventory", "Add to inventory", 'Add new product']
        })
        .then(function (answer) {
            // based on their answer, either call the bid or the post functions
            if (answer.menuOptions === "View products for sale") {
                viewProducts();
            }
            else if (answer.menuOptions === "View low inventory") {
                viewLow();
            }
            else if (answer.menuOptions === "Add to inventory") {
                addInventory();
            }
            else if (answer.menuOptions === "Add new product") {
                addNewProduct();
            }
            else {
                connection.end();
            }
        });
};
function viewProducts() {
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        console.log('-------------Products for sale-------------\n\n')
        for (var i = 0; i < res.length; i++) {
            console.log('Item Id: ' + res[i].item_id + "   |   " + 'Product Name: ' + res[i].product_name +
                "   |   " + 'Product Price: ' + res[i].price + "   |   " + 'Product Quantity: ' +
                res[i].stock_quantity);
        }
        console.log("-----------------------------------\n");
        console.log("Use Arrow keys to select menu options again\n");
        console.log("-----------------------------------\n");

    });
    start();
};


function viewLow() {
    var query =
        "SELECT product_name, SUM(stock_quantity) AS 'Total quantity'\n\
        FROM products GROUP BY product_name HAVING SUM(stock_quantity) < 5";
    connection.query(query, function (err, res) {
        console.log(res);
        if (err) throw err;
        for (var i = 0; i < res.length; i++) {
            console.log('Product: ' + res[i].product_name);
        }
        //checks if the response object is empty and if it is that means there is no product
        //with low quantity
        if (Object.keys(res).length < 1) {
            console.log('No inventory low')
        }
    });

};

function addInventory() {
    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;
        inquirer
            .prompt([
                {
                    name: "whichProduct",
                    type: "rawlist",
                    choices: function () {
                        var choiceArray = [];
                        var choiceIDArray = [];
                        for (var i = 0; i < results.length; i++) {
                            choiceArray.push(results[i].product_name);
                            choiceIDArray.push(results[i].item_id);
                        }
                        return choiceArray;
                    },
                    message: "Which product would you like to add to?"
                },
                {
                    name: "howMuch",
                    type: "input",
                    message: "How much product would you like to add?"
                }
            ])
            .then(function (answer) {
                console.log(answer);
                // var chosenItemID = {
                //     item_id: answer.whichProduct
                // }
                var chosenItem;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].product_name === answer.whichProduct) {
                        chosenItem = results[i];
                    }
                }
                connection.query(
                    "UPDATE products SET ? WHERE ?",
                    [
                        {
                            stock_quantity: parseFloat(chosenItem.stock_quantity) + parseFloat(answer.howMuch)
                        },
                        {
                            item_id: chosenItem.item_id
                        }
                    ],
                    function (error) {
                        if (error) throw err;
                        console.log("Product Updated");
                        start();
                    });
            })
    })
};

function addNewProduct() {
    // connection.query("INSERT INTO products(product_name, department_name, price, stock_quantity)", function (err, results) {
    //     if (err) throw err;
    inquirer
        .prompt([
            {
                name: "name_input",
                type: "input",
                message: "What is the name of the product?"
            },
            {
                name: "department_input",
                type: "input",
                message: "What department would you like to place your product in?"
            },
            {
                name: "price_input",
                type: "input",
                message: "What is the price of the product?",

            },
            {
                name: "stock_input",
                type: "input",
                message: "What is the stock of the product?",

            }
            // VALUES(answer.name_input, answer.department_input)
            //     VALUES('Turbo_kit', 'Automotive', 3500, 4)
        ])
        .then(function (answer) {
            // when finished prompting, insert a new item into the db with that info
            connection.query(
                "INSERT INTO products SET ?",
                {
                    product_name: answer.name_input,
                    department_name: answer.department_input,
                    price: answer.price_input,
                    stock_quantity: answer.stock_input
                },
                function (err) {
                    if (err) throw err;
                    console.log("Your product was created successfully!");
                    // re-prompt the user for if they want to bid or post
                    start();
                }
            );
        });
}
