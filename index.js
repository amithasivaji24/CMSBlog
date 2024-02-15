const express = require('express');
const path = require('path');
const {check, validationResult} = require('express-validator');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const session = require('express-session');
const app = express();



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname+'/public'));
app.use(fileUpload());
app.use(express.urlencoded({ extended: false }));

mongoose.connect('mongodb://localhost:27017/foodblog',{
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const Blog = mongoose.model('Blogs',{
    title: String,
    slug: String,
    image: String,
    content: String
});

const User = mongoose.model('Users',{
    username: String,
    password: String
});

var loginData = {
    username : "admin",
    password: "admin@123"
}

var post = new User(loginData);
post.save();

// set up session
app.use(session({
    secret: 'superrandomsecret',
    resave: false,
    saveUninitialized: true
}));


app.get('/', function(req,res){ 

    
    Blog.find({}).then(function(FoundItems){
    
        res.render('home', {blogs:FoundItems});
    
      })
       .catch(function(err){
        console.log(err);
      })
    
});

app.get('/home', function(req,res){ 

    
    Blog.find({}).then(function(FoundItems){
    
        res.render('home', {blogs:FoundItems});
    
      })
       .catch(function(err){
        console.log(err);
      })
    
});

app.get('/login', function(req, res){

    Blog.find({}).then(function(FoundItems){
    
        res.render('login', {blogs:FoundItems});
    
      })
       .catch(function(err){
        console.log(err);
      })
});

app.post('/login',function(req,res){
    var username = req.body.username;
    var password = req.body.password;
    Blog.find({}).then(function(FoundItems){
    if (!username || !password) {
        res.render('login',{
          message: "Username or Password not entered", blogs:FoundItems
        });
    }else{

        User.findOne({username, password}).then(function(user){
            if (!user) {
                res.render('login',{
                    message: "Username or password incorrect. Login unsuccessful", blogs:FoundItems
                  });
            }else{
                req.session.username = user.username;
                req.session.userLoggedIn = true;
                res.render('admin');
            }
          })
           .catch(function(err){
            console.log(err);
          })
    }
}).catch(function(err){
    console.log(err);
  })

});

app.get('/logout', function(req, res){

    Blog.find({}).then(function(FoundItems){
        req.session.username = '';
        req.session.userLoggedIn = false;
    
        res.render('home', {blogs:FoundItems});
    
      })
       .catch(function(err){
        console.log(err);
      })
});

app.get('/add',function(req,res){
    if(req.session.userLoggedIn){
    res.render('add');
    }else{
        Blog.find({}).then(function(FoundItems){
            res.render('login',{blogs:FoundItems});
        }).catch(function(err){
            console.log(err);
          })
    }
});

app.get('/edit', function(req, res){
    if(req.session.userLoggedIn){
    Blog.find({}).then(function(FoundItems){
        res.render('edit', {blogs:FoundItems});
    
      })
       .catch(function(err){
        console.log(err);
      })
    }else{
        Blog.find({}).then(function(FoundItems){
            res.render('login',{blogs:FoundItems});
        }).catch(function(err){
            console.log(err);
          }) 
    }
});

app.post('/add',[check('title','Please enter a blog title').not().isEmpty(),
check('description','Please enter the description').not().isEmpty()
],function(req,res){

    const errors = validationResult(req);
    var title = req.body.title;
    var slug = req.body.slug;
    var description = req.body.description;
    var imageName = req.files.image.name;
    var image = req.files.image;
    var imagePath = 'public/uploads/'+imageName;

    if (!errors.isEmpty()) {
        res.render('add', { errors: errors.array() })
    } else{

    image.mv(imagePath, function(err){
        console.log(err);
    });

    var pageSlug;
    if(slug){
        pageSlug = generateSlug(slug);
    }else{
        pageSlug= generateSlug(title);
    }
     

    var pageData = {
        title : title,
        slug: pageSlug,
        image : imageName,
        content : description
    }

    var post = new Blog(pageData);
    post.save();

    const msg = {msg:"Saved successfully"};

    res.render('action', {message1 :"Add Page", message2: "New Page Added Successfully"});
}
});

app.get('/nav/:slug', function(req,res){
    let blogs;
    Blog.find({}).then(function(FoundItems){
    
        blogs = FoundItems;
        const { slug } = req.params;
        
        Blog.findOne({slug}).then(function(foundItem){
            res.render('blog', {blog:foundItem, blogs:blogs});
        
          })
           .catch(function(err){
            console.log(err);
          })
    
      })
       .catch(function(err){
        console.log(err);
      })
    
});

app.get('/delete/:id', function(req,res){
    const {id} = req.params;
    Blog.findByIdAndDelete({_id:id}).then(function (deletedItem) { 
        res.render('action',{message1: "Edit Page", message2:"Page Successfully Deleted"});
    }).catch(function(err){
            console.log(err);
          })
});

app.get('/edit/:id', function(req,res){
    const {id} = req.params;
    Blog.find({}).then(function(FoundItems){
        const blogs = FoundItems
        Blog.findOne({_id:id}).then(function(foundItem){
            if (!foundItem) {
                res.render('edit', {blogs:blogs, message: "Unable to retrieve the required data"});
            }else{
                res.render('editsuccess',{id:id, blog:foundItem});
            }
          })
           .catch(function(err){
            console.log(err);
          })


        
      })
       .catch(function(err){
        console.log(err);
      })
});

app.post('/update', function(req,res){
    const id = req.body.contentid;
    var title = req.body.title;
    var slug = req.body.slug;
    var image = req.files.image;
    var content = req.body.description;
    var imageName = req.files.image.name;
    var pageSlug;
    if(slug){
        pageSlug = generateSlug(slug);
    }else{
        pageSlug= generateSlug(title);
    }
   

    Blog.find({}).then(function(FoundItems){
        const blogs = FoundItems
    Blog.findOne({_id:id}).then(function(foundItem){
        if (!foundItem) {
            res.render('edit', {blogs:blogs, message: "Unable to retrieve the required data"});
        }else{
            var oldImagePath = 'public/uploads/'+foundItem.image;
            fs.unlink(oldImagePath, (err) => {
                  console.error(err);
            });
            foundItem.title = title;
            foundItem.slug = pageSlug;
            foundItem.image = imageName;
            foundItem.content = content;
            var imagePath = 'public/uploads/'+imageName;

            image.mv(imagePath, function(err){
                console.log(err);
            });

            foundItem.save();
            res.render('action',{message1: "Edit Page", message2:"Page Successfully Edited"});
        }
      })
       .catch(function(err){
        console.log(err);
      })
    })
      .catch(function(err){
        console.log(err);
      })
});

function generateSlug(title) {
    return title
       .toLowerCase()              // Convert the title to lowercase
       .replace(/\s+/g, '-')       // Replace spaces with hyphens
       .replace(/[^\w-]+/g, '');   // Remove non-word characters (excluding hyphens)
 }

app.listen(8080, function () { console.log("Listening to port 8080") });