var mysql = require("mysql");
var inquirer = require("inquirer");

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

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    displayProducts();
});

function displayProducts() {
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        console.log('-------------Products for sale-------------\n\n')
        for (var i = 0; i < res.length; i++) {
            console.log('Item Id: ' + res[i].item_id + "   |   " + 'Product Name: ' + res[i].product_name +
                "   |   " + 'Product Price: ' + res[i].price);
        }
        console.log("-----------------------------------");
    });
    userPrompt();
}

function userPrompt() {
    // query the database for all items being auctioned
    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;
        // once you have the items, prompt the user for which they'd like to bid on
        inquirer
            .prompt([
                {
                    name: "whichID",
                    type: "rawlist",
                    choices: function () {
                        var choiceArray = [];
                        for (var i = 0; i < results.length; i++) {
                            choiceArray.push(results[i].item_id);
                        }
                        return choiceArray;
                    },
                    message: "What is the ID of the product that you want to buy?"
                },
                {
                    name: "howMany",
                    type: "input",
                    message: "How many would you like?"

                }
            ])
            .then(function (answer) {
                var chosenItem;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].item_id === answer.whichID) {
                        chosenItem = results[i];
                        // console.log(chosenItem)
                    }
                }

                if (chosenItem.stock_quantity >= parseInt(answer.howMany)) {
                    var orderCost = parseFloat(answer.howMany) * parseFloat(chosenItem.price)
                    var newTotalSales = parseFloat(orderCost) + parseFloat(chosenItem.product_sales)
                    // console.log(newTotalSales);

                    connection.query(
                        "UPDATE products SET ? WHERE ?",
                        [
                            {
                                stock_quantity: parseFloat(chosenItem.stock_quantity) - parseFloat(answer.howMany),
                                product_sales: newTotalSales
                            },
                            {
                                item_id: chosenItem.item_id,
                                item_id: chosenItem.item_id
                            }
                        ],
                        function (error) {
                            if (error) throw err;
                            console.log('\n-------------------------');
                            console.log("Order placed successfully");
                            console.log('sales: ' + chosenItem.product_sales)
                            console.log('Your order cost: $' + orderCost);
                            console.log('-------------------------\n');

                        }
                    );
                }
                else {
                    console.log("Insufficient quantity in stock");
                    userPrompt();
                }
                userPrompt();
            });
    });
}
