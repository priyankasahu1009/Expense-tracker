var express = require('express');
var router = express.Router();
const User = require("../models/user");
const Expense = require("../models/expense");
const passport = require("passport");
const LocalStrategy = require("passport-local");
passport.use(new LocalStrategy(User.authenticate()));

const { sendmail } = require("../utils/sendmail");




/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { admin: req.user });
});
router.get('/register', function(req, res, next) {
  res.render('register', { admin: req.user });
});

router.post("/register", async function (req, res, next) {
  try {
      await User.register(
          { username: req.body.username, email: req.body.email },
          req.body.password
      );
      res.redirect("/login");
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});
router.get('/login', function(req, res, next) {
  res.render('login',{ admin: req.user } );
});

router.post("/login",
  passport.authenticate("local", {
      successRedirect: "/profile",
      failureRedirect: "/login"
  }),
  function (req, res, next) {}
);



router.get("/signout", isLoggedIn, function (req, res, next)  {
  req.logout(() => {
      res.redirect("/login");
  });
});

 
router.get("/profile", isLoggedIn, async function (req, res, next) {
  try {
      const { expenses } = await req.user.populate("expenses");
      console.log(req.user, expenses);
      res.render("profile", { admin: req.user, expenses });
  } catch (error) {
      res.send(error);
  }
});
router.get("/showdata", isLoggedIn, async function (req, res, next) {
  try {
      const { expenses } = await req.user.populate("expenses");
      console.log(req.user, expenses);
      res.render("showdata", { admin: req.user, expenses });
  } catch (error) {
      res.send(error);
  }
});






router.get("/reset", isLoggedIn, function (req, res, next) {
  res.render("reset",{ admin: req.user });
});
router.post("/reset", isLoggedIn,async function (req, res, next) {
  try {
    await req.user.changePassword(
        req.body.oldpassword,
        req.body.newpassword
    );
    await req.user.save();
    res.redirect("/profile");
} catch (error) {
    res.send(error);
}




});

router.get("/forget", function (req, res, next) {
  res.render("forget",{ admin: req.user });
});

router.post("/send-mail", async function (req, res, next) {
  try {
      const user = await User.findOne({ email: req.body.email });
      if (!user)
          return res.send("User Not Found! <a href='/forget'>Try Again</a>");

      sendmail(user.email, user, res, req);
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});
router.post("/forget/:id", async function (req, res, next) {
  try {
      const user = await User.findById(req.params.id);
      if (!user)
          return res.send("User not found! <a href='/forget'>Try Again</a>.");

      if (user.token == req.body.token) {
          user.token = -1;
          await user.setPassword(req.body.newpassword);
          await user.save();
          res.redirect("/login");
      } else {
          user.token = -1;
          await user.save();
          res.send("Invalid Token! <a href='/forget'>Try Again<a/>");
      }
  } catch (error) {
      res.send(error);
  }
});


router.get('/createexpense',isLoggedIn,(req,res)=>{
  res.render('createexpense',{ admin: req.user })
  
});
router.post('/createexpense',isLoggedIn, async(req,res)=>{
  try {
    const expense=await Expense(req.body);
    req.user.expenses.push(expense._id)
    expense.user=req.user._id;
    await expense.save();
    await req.user.save();
    res.redirect("/profile");
    
  } catch (error) {
    res.send(error);
  }

  
  
  
}
)
router.get("/filter", async function (req, res, next) {
  try {
      let { expenses } = await req.user.populate("expenses");
      expenses = expenses.filter((e) => e[req.query.key] == req.query.value);
      res.render("profile", { admin: req.user, expenses });
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});

router.get('/delete/:id', isLoggedIn,async(req, res) => {

try {
    await Expense.findByIdAndDelete(req.params.id)
    res.redirect("/showdata")
} catch (error) {
  res.send(error)
}
});
router.get('/update/:id', async (req, res) => {
  const expenseId = req.params.id;

  try {
    // Find the expense by ID
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Render the update page with the expense details
    res.render('update.ejs', { admin: { username: 'YourAdminUsername' }, expense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.post('/update/:id', async (req, res) => {
  const expenseId = req.params.id;

  try {
    // Find the expense by ID
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Update the expense with the submitted data
    expense.amount = req.body.amount;
    expense.remark = req.body.remark;
    expense.category = req.body.category;
    expense.paymentmode = req.body.paymentmode;

    // Save the updated expense
    await expense.save();

    // Redirect to the expense details page or any other desired page
    res.redirect('/showdata');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
      next();
  } else {
      res.redirect("/login");
  }
}

module.exports = router;

  