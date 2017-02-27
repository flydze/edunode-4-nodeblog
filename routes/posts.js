var express = require('express');
var multer = require('multer');
var upload = multer({dest: './public/images/uploads'});
var mongo = require('mongodb');
var db = require('monk')('localhost/nodeblog');

var router = express.Router();

router.get('/show/:id', function(req, res, next) {
  var posts = db.get('posts');
  posts.findById(req.params.id, function(err, post) {
    res.render('show', {
      'post': post
    });
  });
});

router.get('/add', function(req, res, next) {
  var categories = db.get('categories');
  categories.find({}, {}, function(err, categories) {
    res.render('addpost', {
      'title': 'Add Post',
      'categories': categories
    });
  });
});

router.post('/add', upload.single('mainimage'), function(req, res, next) {
  // get form values
  var title = req.body.title
    , category = req.body.category
    , body = req.body.body
    , author = req.body.author
    , date = new Date()
    , mainimage;

  // check image upload
  if (req.file) {
    mainimage = req.file.filename;
  } else {
    mainimage = 'noimage.jpg';
  }

  // form validation
  req.checkBody('title', 'Title field is required').notEmpty();
  req.checkBody('body', 'Body field is required').notEmpty();

  // check errors
  var errors = req.validationErrors();
  if (errors) {
    res.render('addpost', {
      'errors': errors
    });
  } else {
    var posts = db.get('posts');
    posts.insert({
      "title": title,
      "body": body,
      "category": category,
      "author": author,
      "date": date,
      "mainimage": mainimage
    }, function(err, post) {
      if (err) {
        res.send(err);
      } else {
        req.flash('success', 'Post Added');
        res.location('/');
        res.redirect('/');
      }

    });
  }
});

router.post('/addcomment', function (req, res, next) {
  // get form values
  var postId = req.body.postid
    , name = req.body.name
    , email = req.body.email
    , body = req.body.body
    , commentDate = new Date();

  // from validation
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required, but never displayed').notEmpty();
  req.checkBody('email', 'Email is not formatted properly').isEmail();
  req.checkBody('body', 'Body is required').notEmpty();

  // check errors
  var errors = req.validationErrors();
  if (errors) {
    var posts = db.get('posts');
    posts.findById(postId, function (err, post) {
      res.render('show', {
        'errors': errors,
        'post': post
      });
    });
  } else {
    var comment = {
      'name': name,
      'email': email,
      'body': body,
      'commentdate': commentDate
    };

    var posts = db.get('posts');
    posts.update({
      "_id": postId
    }, {
      $push: {
        "comments": comment
      }
    }, function (err, doc) {
      if (err) {
        throw err;
      } else {
        req.flash('success', 'Comment Added');
        res.location('/posts/show/' + postId);
        res.redirect('/posts/show/' + postId);
      }
    });
  }
});

module.exports = router;
