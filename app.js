const express = require("express");
const mysql2 = require("mysql2");
const session = require("express-session");
const path = require("path");
const json = require('json')
const multer = require("multer");
const bcrypt = require("bcrypt");
const { hash } = require("bcrypt");
const { hashSync } = require("bcrypt");
const { env } = require("process");
const { error } = require("console");
const fs = require('fs')




const app = express(); // this is our instance of express

app.get("/index", (req, res) => {
  res.sendFile(__dirname + "/dds/index.html");
});

app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/dds/dashboard.html");
});

app.get('/execute', (req, res) => {
  fs.readFile('./final_propdb.sql', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading SQL file:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    connection.query(data, (err) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        res.status(500).send('Internal Server Error');
        return;
      }

      res.send('SQL script executed successfully!');
    });
  });
});


app.get("/registration", (req, res) => {
  res.sendFile(__dirname + "/dds/registration.html");
});

app.get("/landlordpage", (req, res) => {
  res.sendFile(__dirname + "/dds/landlordpage.html");
});

app.get("/administrator", (req, res) => {
  res.sendFile(__dirname + "/dds/administrator.html");
});

// Set up multer storage to define where to store the uploaded image
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads")); // Store images in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Generate a unique filename
  },
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

//session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: true,
    saveUninitialized: true,
  })
);

//API middlewares

app.use(express.json()); // this is to accept data sent in json format
app.use(express.urlencoded({ extended: true })); // this is basically to decode the data sent through the html form
app.use(express.static("dds")); //this is to serve html files and also act as the  static folder
app.use(express.static("Images"));
app.use(express.static('uploads'))




//instating pool
const pool = mysql2.createPool({
  connectionLimit: 25,
  host: "localhost",
  user: "root",
  password: "Password1234",
  database: "final_propdb",
});

//mysql connection
const connection = mysql2.createConnection({
  host: "localhost",
  user: "root",
  password: "Password1234",
  database: "final_propdb",
});

connection.connect((error) => {
  if (error) {
    // throw error
    console.error("!!!!!!!!!!!Error connecting to the database!!!!!!!!!");
    return;
  }

  console.log("____________DATABASE SUCCESSFULLY CONNECTED________________ ");
  return;
});

//to post registration form in the database
app.post("/registration", async (req, res) => {
  var hashedPassword = await bcrypt.hash(req.body.password, 15); //where theres 15 i can give it a salt
  //const{username,email,contact,role}=req.body ;
  const username = req.body.username;
  const email = req.body.email;
  const password = hashedPassword;
  //const password =req.body.password
  const contact = req.body.contact;
  const role = req.body.role;

  // res.sendFile(__dirname+'/dds/thanks1.html');
  res.redirect("/index");

  //insertion of registration  data into database table registration
  pool.query(
    "insert into registration (username,email,password,contact,role) values (?,?,?,?,?)",
    [username, email, password, contact, role],
    (error) => {
      if (error) {
        //console.log(err)
        console.error("Error insertion of data into table", error);
        return;
      }
      console.log("");
      console.log(
        "***************** Successful account creation *****************"
      );

      return;
    }
  );
});



//authentication
app.post("/index", async function (request, response) {
  // Capture the input fields
  let email = request.body.email;
  let password = request.body.password;

  // Execute SQL query that'll select the account from the database based on the specified email
  connection.query(
    "SELECT email, password, role FROM registration WHERE email = ?",
    [email],
    async function (error, results) {
      if (error) {
        throw error;
      }

      if (results.length > 0) {
        const hashedPassword = results[0].password;
        const role = results[0].role;

        // Compare the input password with the stored hashed password
        const compared = await bcrypt.compare(password, hashedPassword);

        if (compared) {
          // Authentication successful

          if (role === "tenant") {
            // Redirect to the tenant dashboard page
            response.redirect("/properties");
            console.log("Successfully logged in as a tenant");
          } else if (role === "system_admin") {
            // Redirect to the tenant dashboard page
            response.redirect("/admin");
            console.log("Successfully logged in as a tenant");}

          else {
            // Redirect to the landlord page
            response.redirect("/landlordpage.html");
            console.log("Successfully logged in as a landlord");
          }
        } else {
          // Authentication failed
          response.redirect("/index");
          console.log("Wrong email or password input");
        }
      } else {
        // Account with the specified email not found
        response.redirect("/index");
        console.log("Account not found");
      }
      response.end();
    }
  );
});


//getting table to view users
app.get('/table', (req, res) => {
  // Execute your MySQL query to fetch the desired table data
  pool.query ("SELECT PropertyName,Type,Location,Description,Number_Of_Bedrooms,Number_Of_Bathrooms,Cost,Dateadded,Image  FROM properties",(error, results) => {
    if (error) {
      console.error("Error executing MySQL query:", error);
      res.status(500).send("Internal Server Error");
      return;
    }
    // Send the retrieved data as the response
    res.json(results);
   
  });
});

// Handle the image upload route
app.post("/landlordpage", upload.single("image"), (req, res) => {
  // Save the necessary information to your database
  const {
    PropertyName,
    Type,
    Location,
    Description,
    Number_Of_Bedrooms,
    Number_Of_Bathrooms,
    Cost,
  } = req.body;

  // Get the uploaded image filename
  const imageFilename = req.file.filename;

  var Dateadded = new Date();

  // insert the data into the database table called properties
  pool.query(
    "INSERT INTO properties (PropertyName, Type, Location, Description, Number_Of_Bedrooms, Number_Of_Bathrooms, Cost, Dateadded,  imageFilename) VALUES (?, ?, ?, ?, ?, ?, ?, ? , ?)",
    [
      PropertyName,
      Type,
      Location,
      Description,
      Number_Of_Bedrooms,
      Number_Of_Bathrooms,
      Cost,
      Dateadded,
      imageFilename,
    ],
    (err) => {
      if (err) {
        console.error("Error inserting data into the database:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      // Example response
      console.log("new  image posted to database  ");
      res.redirect("thanks.html");
      //res.json({ message: "Image uploaded and data saved successfully." });
    }
  );
});

//to post leaserequest form in the database
app.post("/leaserequest", (req, res) => {
  const {
    first_name,
    surname,
    contact,
    address_1,
    address_2,
    line_1,
    line_2,
    home_phone,
    postal_code,
    property,
    number_of_units,
  } = req.body;
  res.sendFile(__dirname + "/dds/pass.html");
  //insertion of the lease request data into database table lease_request
  pool.query(
    "insert into lease_request (first_name,surname,contact,address_1,address_2,line_1,line_2,home_phone,postal_code,property,number_of_units) values (?,?,?,?,?,?,?,?,?,?,?) ",
    [
      first_name,
      surname,
      contact,
      address_1,
      address_2,
      line_1,
      line_2,
      home_phone,
      postal_code,
      property,
      number_of_units,
    ],
    (error) => {
      if (error) {
        console.error("Error insertion of data into table", error);
        //res.sendFile(__dirname+"dds/")
        //res.redirect("./thanks.html");

        return;
      }
      console.log("");
      res.redirect("./thanks.html");
      console.log(
        "*****************request successfully captured *****************"
      );
      return;
    }
  );
});



//allow ejs files to be read
app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");


//images to be trieved from database to the landing page

app.get("/properties", (req, res) => {
  pool.query("SELECT * FROM properties", (err, results) => {
    if (err) {
      console.log("Error retrieval of data from database");
      return res.status(500).json({ message: "Internal server error " });
    }
    res.render("properties", { properties: results });
  });
});

//system admin ejs page
app.get("/admin", (req, res) => {
  pool.query("SELECT * FROM properties", (err, results) => {
    if (err) {
      console.log("Error retrieval of data from database");
      return res.status(500).json({ message: "Internal server error " });
    }
    res.render("systemadmin", { properties: results });
    console.log('admin ')
  });
});


//feedback capture
app.post("/properties", (req, res) => {
  //saving necessary information into database

  //document.getElementsByClassName('Comments').addEventlistener

  const { comments, likes, dislikes } = req.body;

  pool.query(
    "insert into PropertyFeedback (comments,likes,dislikes) values (?,?,?)"[
      (comments, likes, dislikes)
    ],
    (error) => {
      if (error) {
        console.log(error);
        return;
      }
      console.log("feed back captured  ");
    }
  );
});






//api to handle lease requests

app.get("/leaserequest||leaserequests", (req, res) => {
  pool.query("SELECT * FROM lease_request", (error, results) => {
    if (error) {
      console.log("Error retrieval of data from database");
      return res.status(500).json({ message: "Internal server error " });
    }
    res.render("leaserequest", { leaserequest: results });
    //console.log('lease opened ')
  });
});







// on mac setting an environmet cvariable type in the running terminal  (export PORT=set a port value  ) on windows use (set ...) NB take note on  spacing on >><<
//if there's aprocessing environment  this value can be set outside the
const port = process.env.PORT || 2000; // perfect port declaration

// this is to listen to a port
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
