const express = require('express');
const session = require('express-session');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

let value = 1;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'ikrampassword', 
    resave: false,
    saveUninitialized: true
}));

const loginFilePath = 'loginFile.txt';
const petInfoFilePath = 'availablePetInformationFile.txt';

// routes for pages
app.get('/', (req, res) => {
    renderPage('home.html', res);
});

app.get('/dogcare', (req, res) => {
    renderPage('dogcare.html', res);
});

app.get('/catcare', (req, res) => {
    renderPage('catcare.html', res);
});

app.get('/createaccount', (req, res) => {
    renderPage('createaccount.html', res);
});

app.get('/contact', (req, res) => {
    renderPage('contact.html', res);
});

app.get('/disclaimer', (req, res) => {
    renderPage('disclaimer.html', res);
});

app.get('/find', (req, res) => {
    renderPage('find.html', res);
});

app.get('/givepet', requireLogin, (req, res) => {
    renderPage('givepet.html', res);
});

app.get('/pets', (req, res) => {
    renderPage('pets.html', res);
});

app.get('/usernameTaken', (req, res) => {
    renderPage('usernameTaken.html', res);
});

app.get('/successfulAccountCreation', (req, res) => {
    renderPage('successfulAccountCreation.html', res);
});

// app.get('/logIn', (req, res) => {
//    renderPage('logIn.html', res);
// });

app.get('/logIn', (req, res) => {
    // checking to see if user is logged in
    if (req.session.username) {
        // sends to /givepet
        res.redirect('/givepet');
    } else {
        // sends the login page
        renderPage('logIn.html', res);
    }
});

app.get('/failedLogin', (req, res) => {
    renderPage('failedLogin.html', res);
});

app.get('/animalAdded', (req, res) => {
    renderPage('animalAdded.html', res);
});

app.get('/noAnimals', (req, res) => {
    renderPage('noAnimals.html', res);
});

app.get('/logOut', requireLogin, (req, res) => {
    renderPage('logOut.html', res);
});

app.get('/confirmLogOut', (req, res) => {
    renderPage('confirmLogOut.html', res);
});

//routes and functions for the code. login, petInfo, logout, usernameFile etc.

// to use the template and content from the html pages
function renderPage(pageName, res) {
    // checks content of the specified page
    fs.readFile(pageName, 'utf8', (err, pageContent) => {
        if (err) {
            console.error(err);
            return res.status(500).send(`Error reading ${pageName}`);
        }

        // checks the content of template.html
        fs.readFile('template.html', 'utf8', (err, templateContent) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error reading template.html');
            }

            // replaces {{content}} with page content that i want to show
            const renderedTemplate = templateContent.replace('{{content}}', pageContent);

            // sending it back
            res.send(renderedTemplate);
        });
    });
}

// Route for registering a new user
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    // when username already exists
    if (checkUserExists(username)) {
        return res.status(400).redirect('/usernameTaken');
    }
    // adding a new User to login file
    addUserToLoginFile(username, password);
    res.redirect('/successfulAccountCreation');
});

// Function to check if a user exists in the login file
function checkUserExists(username) {
    const loginData = fs.readFileSync(loginFilePath, 'utf8');
    const users = loginData.split('\n');
    for (let user of users) {
        const [existingUsername, _] = user.split(':');
        if (existingUsername === username) {
            return true;
        }
    }
    return false;
}

// Function to add a new user to login file
function addUserToLoginFile(username, password) {
    fs.appendFileSync(loginFilePath, `${username}:${password}\n`);
}



app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Checking  ifg the username and password match an entry in the login file
    if (checkLogin(username, password)) {
        // send here if successful
        req.session.username = username;
        res.redirect('/givepet');
    } else {
        // if it didnt login, it sends here
        res.redirect('/failedLogin');
    }
});

// Function to check if the username and password match an entry in the login file
function checkLogin(username, password) {
    const loginData = fs.readFileSync(loginFilePath, 'utf8');
    const users = loginData.split('\n');
    for (let user of users) {
        const [existingUsername, existingPassword] = user.split(':');
        if (existingUsername === username && existingPassword === password) {
            return true;
        }
    }
    return false;
}





// route for pet submission
app.post('/submitPet', requireLogin, (req, res) => {
    const { petType, breed, age, gender, getsAlongDogs, getsAlongCats, suitableForChildren, comment, ownerName, ownerEmail } = req.body;
    const username = req.session.username;
    addPetInfo(username, petType, breed, age, gender, getsAlongDogs, getsAlongCats, suitableForChildren, comment, ownerName, ownerEmail);
        
        res.redirect('/animalAdded');
    });

// Function to add pet information to pet info file
function addPetInfo(username, petType, breed, age, gender, getsAlongDogs, getsAlongCats, suitableForChildren, comment, ownerName, ownerEmail) {
    fs.appendFileSync(petInfoFilePath, `${value++}:${username}:${petType}:${breed}:${age}:${gender}:${getsAlongDogs}:${getsAlongCats}:${suitableForChildren}:${comment}:${ownerName}:${ownerEmail}\n`);
}

// Route for handling the pet search
app.post('/findpet', (req, res) => {
    const { petType, breed, age, gender, getsAlongDogs, getsAlongCats, suitableForChildren } = req.body;

    // Reading content in availablePetInformationFile
    fs.readFile(petInfoFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading availablePetInformationFile');
        }

        // Split content into individual animal records
        const animalRecords = data.split('\n');

        // Filtering the animal recordss based on the criteria 
        const matchedAnimals = animalRecords.filter(animalRecord => {
            const [recordID, recordUser, recordPetType, recordBreed, recordAge, recordGender, recordGetsAlongDogs, recordGetsAlongCats, recordSuitableForChildren] = animalRecord.split(':');
        //    console.log('Filtering pet:', {recordID, recordUser, recordPetType, recordBreed, recordAge, recordGender, recordGetsAlongDogs, recordGetsAlongCats, recordSuitableForChildren});
        //    console.log('Search criteria:', {petType, breed, age, gender, getsAlongDogs, getsAlongCats, suitableForChildren});
            return (
                (recordPetType === petType) &&
                (recordBreed === breed) &&
                (age === 'any' || recordAge === age) &&
                (gender === 'any' || recordGender === gender) &&
                (recordGetsAlongDogs === getsAlongDogs) &&
                (recordGetsAlongCats === getsAlongCats) &&
                (recordSuitableForChildren === suitableForChildren)
            );
        });

        console.log('Matched animals:', matchedAnimals);

        // R matched animal records to the user
        renderMatchedAnimals(matchedAnimals, res);
    });
});


function requireLogin(req, res, next) {
    if (req.session.username) {
        // User is loggd in, next is middleware/route handler
        next();
    } else {
        // User is not logged in, send to login page
        res.redirect('/login');
    }
}

// To render matched animal records to the user
function renderMatchedAnimals(matchedAnimals, res) {
    if (matchedAnimals.length === 0) {
        res.redirect('/noAnimals');
    } else {
        let html = '<h2>Matched Animals</h2>';
        matchedAnimals.forEach(animalRecord => {
            const [ID, userShow, petType, breed, age, gender, getsAlongDogs, getsAlongCats, suitableForChildren, comment, ownerName, ownerEmail] = animalRecord.split(':');
     //     console.log('check this:', {ID, userShow, petType, breed, age, gender, getsAlongDogs, getsAlongCats, suitableForChildren, comment, ownerName, ownerEmail});
            html += `<p>Pet ID: ${ID}, ${petType}: Breed: ${breed}, Age: ${age}, Gender: ${gender}, getsAlongDogs: ${getsAlongDogs}, getsAlongCats: ${getsAlongCats}, suitableForChildren: ${suitableForChildren}, Comments: ${comment}, Owner's Name: ${ownerName}, Owner's Email: ${ownerEmail}, </p>`;
        });
            html += `<p>You can reach out to the owner with the listed email.</p>`;
            html += `<p>You can also contact us, with the ID of the animal.</p>`;
            html += `<a href="/">Back to Website</a>`;
            res.send(html);
    }
}

app.get('/loggingOut', requireLogin, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Error logging out');
        } else {
            res.redirect('/confirmLogOut');
        }
    });
});


app.listen(5590, () => {
    console.log('Go to http://localhost:5590/');
});
