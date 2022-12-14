var Author = require('../models/author');
var async = require('async');
var Book = require('../models/book');

const { body, validationResult } = require('express-validator');
// Display list of all authors


exports.author_list = function(req, res) {
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec(function (err, list_authors) {
            if (err) { return next(err); }
            // Siccessful, so render
            res.render('author_list', { title: 'Author List', author_list: list_authors});
        })
};

// Display detail page for specific Author
exports.author_detail = function(req, res) {
    async.parallel({
        author(callback) {
            Author.findById(req.params.id)
            .exec(callback)
        },
        author_books(callback) {
            Book.find({author: req.params.id})
            .exec(callback)
        }, 
    }, function (err, results) {
        if (err) { return next(err) }
        if (results.author == null) { 
            var err = new Error('Author not found');
            err.status = 404; 
            return next(err);
        }
        res.render('author_detail', {
            title: 'Author Detail',
            author: results.author, 
            author_books: results.author_books, 
        })
    })
};

// Display Author create form on GET 
exports.author_create_get = function(req, res) {
    res.render('author_form', {
        title: 'Create Author',
    }); 
};

// Handle Auhtor create on POST 
exports.author_create_post = [
    body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape().withMessage('First name required')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
    body('family_name')
    .trim()
    .isLength({ min: 1 })
    .escape().withMessage('Family name required')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601().toDate(), 
    body('date_of_death', 'Invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601().toDate(),
    // Process req after validation & sanization
    (req, res, next) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) { 
            res.render('author_form', {
                title: 'Create Author',
                author: req.body, 
                errors: errors.array()
            });
            return;
        }
        else {
            var author = new Author ({
                first_name: req.body.first_name,  
                family_name: req.body.family_name, 
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death,
            });

            author.save(function (err) {

                if (err) { return next(err) }
                res.redirect(author.url);
            });
        }
    }
]; 

// Display Author delete form on GET
exports.author_delete_get = function(req, res) { 

    async.parallel({
        author(callback) { 
            Author.findById(req.params.id).exec(callback);
        },
        authors_books(callback) { 
            Book.find({ 'author': req.params.id }).exec(callback)
        }, 
    }, function(err, results) {
        if (err) { return next(err); } 
        if (results.author == null) { 
            res.redirect('/catalog/authors');
        }

        res.render('author_delete', { 
            title: 'Delete Author', 
            author: results.author, 
            author_books: results.authors_books
        });
    });
};

// Handle Author delete on POST
exports.author_delete_post = function(req, res) {
    async.parallel({
        author(callback) { 
            Author.findById(req.body.authorid).exec(callback)
        },
        authors_books(callback) { 
            Book.find({ 'author': req.body.authorid }).exec(callback);
        },
    }, function(err, results) { 
        if (err) { return next(err); }
        if (results.authors_books.length > 0) { 
            res.render('author_delete', { 
                title: 'Delete Author', 
                author: results.author, 
                author_books: results.authors_books
            });
            return; 
        } else {
            // * what a handy mongoose method!
            Author.findByIdAndRemove(req.body.authorid, 
                function deleteAuthor(err) {
                    if (err) { return next(err); }
                    res.redirect('/catalog/authors');
                })
        }
    })
};

// Display Author update form on GET
exports.author_update_get = function(req, res) {
    Author.findById(req.params.id, (err, theauthor) => {

        if (err) { return next(err) }
        res.render('author_form', {
            title: 'Update Author', 
            author: theauthor,
        });
    });
};

// Handle Author update on POST
exports.author_update_post = [
    body('first_name', 'First name is required')
    .trim()
    .isLength({ min: 1 })
    .escape(), 
    body('family_name', 'Family name is required')
    .trim()
    .isLength({ min: 1 })
    .escape(),
    body('date_of_birth', 'Date of birth must follow format')
    .trim()
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
    body('date_of_death', 'Date of death must follow format')
    .trim()
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
    (req, res, next) => {
        const errors = validationResult(req); 

        const author = new Author({
            first_name: req.body.first_name, 
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth, 
            date_of_death: req.body.date_of_death,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) { 
            res.render('author_form', {
                title: 'Create Author', 
                author: req.body, 
                errors: errors.array(),
            });
            return; 
        } 

        // * author._id can also be req.params.id - either works!
        Author.findByIdAndUpdate(
            author._id,
            author, 
            {},
            (err, updatedAuthor) => {
                if (err) { return next(err) }
                res.redirect(updatedAuthor.url);
            }
        );
    }
];

