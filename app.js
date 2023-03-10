var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars')
var session = require('express-session')
var fileUpload = require('express-fileupload');
const bodyparser = require('body-parser');
const flash = require('connect-flash');
const fs = require('fs')

var adminRouter = require('./routes/admin');
var userRouter = require('./routes/user');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', hbs.engine({extname:'hbs', defaultLayout:'layout', layoutsDir:__dirname+'/views/layout/', partialsDir:__dirname+'/views/partials/'}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:"KeySSH", cookie:{maxAge:600000},  saveUninitialized: true, resave: true}));
app.use(bodyparser.urlencoded({extended:false}))
app.use(bodyparser.json())
app.use(fileUpload());
app.use(flash());
app.use(express.static(path.resolve('./public')));

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
