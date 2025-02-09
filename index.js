var express = require('express');
var app = express();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const multer = require('multer');
const upload = multer();
const algorithm = 'aes-256-cbc';
const crypto = require('crypto');

const connectionConfig = {
    host: "sql.freedb.tech",
    user: "freedb_mohamedhesham",
    password: "CfBc66Z7hyzm%aM",
    database: "freedb_MoHesham",
    port: 3306
};

const pool = mysql.createPool({
    host: "sql.freedb.tech",
    user: "freedb_mohamedhesham",
    password: "CfBc66Z7hyzm%aM",
    database: "freedb_MoHesham",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/', function (req, res) {
   res.send('Hello Mohamed Hesham');
})

app.post('/SigninWithEmailAndPassword', upload.none(), async function (req, res) {
    let connection;
    const { email, password } = req.body;

    try {
        connection = await pool.getConnection();

        const [result] = await connection.execute(
            `SELECT * FROM TestAdham_User WHERE email = ?`, [email]
        );

        if (result.length == 0) {
            return res.status(500).json( {
                response: 'No User with this email',
                result: null,
                success: false
            });
        }

        const user = result[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            return res.status(200).json({
                response: 'Sign in successfully',
                result: user,
                authorized: true,
                success: true
            });
        } else {
            return res.status(500).json({
                response: 'Wrong Password!',
                result: null,
                authorized: false,
                success: false
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            response: 'Server Internal Error',
            result: null,
            authorized: false,
            success: false
        });
    } finally {
        if (connection) {
            // Release the connection back to the pool
            connection.release();
        }
    }
})

app.post('/SignUpWithEmailAndPassword', upload.none(),    async function (req, res) {
    const { email, password, phoneNumber, name } = req.body;
    
    let connection;
    try {
        // Hash the password for database storage
        const hashedPassword = await bcrypt.hash(password, 11);

        // Connect to the database
        connection = await mysql.createConnection(connectionConfig);

        // Start a transaction
        await connection.beginTransaction();

        // Insert the user into the database
        const query = `INSERT INTO TestAdham_User (name, phonenumber, password, email, imgurl) VALUES (?, ?, ?, ?, ?)`;
        const values = [name, phoneNumber, hashedPassword, email, "https://firebasestorage.googleapis.com/v0/b/flocker-rehla.appspot.com/o/defaultdata%2FUser-Profile-PNG.png?alt=media&token=ed70a16d-6918-4734-9fa6-1e278285649a"];
        const [result] = await connection.execute(query, values);

        // Commit the transaction
        await connection.commit();
        console.log("Transaction committed successfully.");

        const token2 = {
            id: result.insertId,
            name: name,
            phonenumber: phoneNumber,
            email: email,
            imgurl: "https://firebasestorage.googleapis.com/v0/b/flocker-rehla.appspot.com/o/defaultdata%2FUser-Profile-PNG.png?alt=media&token=ed70a16d-6918-4734-9fa6-1e278285649a",
        };
        // Respond with success
        return res.status(200).json({
            result: token2,
            success: true,
            response: "success",
        });
    } catch (error) {
        console.error("Error during transaction:", error);

        if (connection) {
            try {
                // Rollback the transaction if there's an error
                await connection.rollback();
                console.log("Transaction rolled back.");
            } catch (rollbackError) {
                console.error("Error during rollback:", rollbackError);
            }
        }

        return res.status(500).json({
            response: "internal server error",
            result: "internal server error",
            success: false
        });
    } finally {
        if (connection) {
            try {
                // Close the database connection
                await connection.end();
                console.log("Connection closed.");
            } catch (closeError) {
                console.error("Error closing connection:", closeError);
            }
        }
    }
})

app.get('/GetProfile', upload.none(), async function (req, res) {
    let connection;
    const id = req.query.id;
    const email = req.query.email;

    try {
        // Get a connection from the pool
        connection = await pool.getConnection();

        // Query the database
        const [result] = await connection.execute(
            `SELECT * FROM TestAdham_User WHERE email = ? AND id = ?`, [email, id]
        );

        if (result.length === 0) {
            return {
                response: 'No User with this email',
                result: null,
                success: false
            };
        }

        const user = result[0];
        return res.status(200).json({
            response: 'Success',
            result: user,
            authorized: true,
            success: true
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            response: 'Server Internal Error',
            result: null,
            authorized: false,
            success: false
        });
    } finally {
        if (connection) {
            // Release the connection back to the pool
            connection.release();
        }
    }
})

var server = app.listen(5000, function () {
   console.log("Express App running at http://127.0.0.1:5000/");
})
