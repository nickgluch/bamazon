var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require('cli-table');


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
            choices: ["View product sales by department", 'Add new department']
        })
        .then(function (answer) {
            // based on their answer, either call the bid or the post functions
            if (answer.menuOptions === "View product sales by department") {
                viewProductSales();
            }
            else if (answer.menuOptions === "Add new department") {
                addNewDepartment();
            }
            else {
                connection.end();
            }
        });
};

function viewProductSales() {

    var query = "SELECT departments.over_head_costs, IFNULL(SUM(product_sales), 0) AS total_product_sales, departments.department_id,";
    query += " departments.department_name, IFNULL(SUM(product_sales) - over_head_costs, 0) AS total_profit";
    query += " FROM departments";
    query += " LEFT JOIN products";
    query += " ON(products.department_name = departments.department_name)";
    query += " GROUP BY products.department_name, departments.department_id, departments.department_name";
    query += " ORDER BY departments.department_id, departments.department_name, total_product_sales, over_head_costs;";

    console.log(query);

    connection.query(query, function (err, res) {

        if (err) throw err;

        var table = new Table({
            head: ['department_id', 'department_name', 'over_head_costs', 'product_sales',
                'total_profit']
        });


        for (var i = 0; i < res.length; i++) {
            console.log(res.length + " matches found!");

            table.push(
                [res[i].department_id, res[i].department_name, res[i].over_head_costs, res[i].total_product_sales,
                res[i].total_profit]
            );
        }
        console.log(table.toString());

    });

    start();
};


function addNewDepartment() {
    inquirer
        .prompt([
            {
                name: "name_input",
                type: "input",
                message: "What is the name of the department?"
            },
            {
                name: "cost_input",
                type: "input",
                message: "What is the over head cost of this department?"
            },

        ])
        .then(function (answer) {
            connection.query(
                "INSERT INTO departments SET ?",
                {
                    department_name: answer.name_input,
                    over_head_costs: answer.cost_input,
                },



                function (err) {
                    if (err) throw err;
                    console.log("Your department was created successfully!");

                    start();
                }
            );




        });
};