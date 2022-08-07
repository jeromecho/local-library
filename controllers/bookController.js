var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

var async = require('async');

const { body, validationResult } = require('express-validator');

exports.index = function(req, res) {

    async.parallel({
        book_count(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        book_instance_count(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

// display list of all books 
exports.book_list = function(req, res) {
    Book.find({}, 'title author')
        .sort({title: 1})
        .populate('author')
        .exec(function (err, list_books) {
            if (err) { return next(err); }
            // Successful, so render 
            res.render('book_list', { 
                title: 'Book List',
                book_list: list_books
            });
        });
};

// display detail page for a specific book
exports.book_detail = function(req, res, next) {

    async.parallel({
        book(callback) {
            Book.findById( req.params.id )
            .populate('author')
            .populate('genre')
            .exec(callback)
        }, 
        book_instance(callback) {
            BookInstance.find({'book': req.params.id})
            .exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err) }
        if (results.book == null) {
            var err = new Error('Book not found');
            err.status = 404; 
            return next(err);
        }
        res.render('book_detail', {
            title: results.book.title,
            book: results.book,
            book_instances: results.book_instance, 
        })
    })
};

// display book create form on get
exports.book_create_get = function(req, res, next) {
    async.parallel({
        authors(callback) {
            Author.find(callback);
        },
        genres(callback) { 
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', {
            title: 'Create Book',
            authors: results.authors, 
            genres: results.genres,
        });
    })
};

// handle book create on post
exports.book_create_post = [
    (req, res, next) => {
        if(!(Array.isArray(req.body.genre))) {
            if(typeof req.body.genre === 'undefined')
            req.body.genre = [];
            else 
            req.body.genre = [req.body.genre];
        }

        next();
    }, 
    // Validate & sanitize 
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    // ?
    body('genre.*').escape(),
    //

    (req, res, next) => {
        const errors = validationResult(req);
        var book = new Book({
            title: req.body.title, 
            author: req.body.author,
            summary: req.body.summary, 
            isbn: req.body.isbn,
            genre: req.body.genre,
        })

        if (!errors.isEmpty()) {

            async.parallel({
                authors(callback) {
                    Author.find(callback); 
                    // Why can't we just pass in req.body.authors 
                    // into our PUG file? It's already been sanitized beforehand
                    // why should we sanitize again? Shouldn't have had been 
                    // an opportunity for authors to have become 'dirty'
                },
                genres(callback) {
                    Genre.find(callback); 
                },
            }, function(err, results) { 
                if (err) { return next(err); }

                for (let i = 0; i < results.genres.length; i++) { 
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { 
                    title: 'Create Book',
                    authors: results.authors, 
                    genres: results.genres, 
                    book: book, 
                    errors: errors.array()
                });
            });
            return;
        }
        else {
            book.save(function (err) {
                if (err) { return next(err) }
                res.redirect(book.url);
            })
        }
    }
];

// display book delete form on get
exports.book_delete_get = function(req, res) {

    async.parallel({
        book(callback) {
            Book.findById(req.params.id).exec(callback);
        }, 
        book_instances(callback) { 
            BookInstance.find({book: req.params.id}).exec(callback);
        }
    }, (err, results) => {
        if (err) { return next(err) }
        console.log('tanke')
        res.render('book_delete', {
            title: 'Delete Book',
            book: results.book, 
            book_instances: results.book_instances, 
        })
    });
};

// handle book delete on post
exports.book_delete_post = function(req, res) {
    Book.findByIdAndRemove(req.body.bookid).exec(err => {
        if (err) { return next(err) }
        Book.find().sort({title: 1}).populate('author').exec((err, books) => {
            if (err) { return next(err) }
            res.render('book_list', {
                book_list: books
            });
        })
    })
};

// display book update on get 
exports.book_update_get = function(req, res) {

    async.parallel({
        book(callback) { 
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        authors(callback) { 
            Author.find(callback);
        },
        genres(callback) { 
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err) }
        if (results.book==null) { 
            var err = new Error('Book not found');
            err.status = 404; 
            return next(err); 
        }
        for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) { 
            for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString()===results.book.genre[book_g_iter]._id.toString()) { 
                    results.genres[all_g_iter].checked='true';
                }
            }
        }
        res.render('book_form', {
            title: 'Update Book',
            authors: results.authors, 
            genres: results.genres, 
            book: results.book
        })
    })
};

// handle book update on post
exports.book_update_post = [
    (req, res, next) => {
        if(!(Array.isArray(req.body.genre))) { 
            // TODO - for me to see what format multi checkbox is in, to del
            if (typeof req.body.genre==='undefined') 
                req.body.genre=[req.body.genre];
            else 
                req.body.genre=[req.body.genre]; 
        }
        // TODO - is below line necessary?
        next();
    }, 
    body('title', 'Title must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
    body('author', 'Author must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
    body('summary', 'Summary must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
    body('isbn', 'ISBN must not be empty')
    .trim()
    .isLength({ min: 1})
    .escape(),
    body('genre.*').escape(), 
    (req, res, next) => {
        const errors = validationResult(req);

        var book = new Book({
            title: req.body.title, 
            author: req.body.author, 
            summary: req.body.summary, 
            isbn: req.body.isbn,  
            // TODO - why check again? 
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre, 
            // prevents a new ID from being auto-generated, allowing us to keep 
            // same reference for the same book
            _id: req.params.id, 
        })

        if (!errors.isEmpty()) { 
            async.parallel({
                authors(callback) {
                    Author.find(callback);
                }, 
                genres(callback) { 
                    Genre.find(callback); 
                },
            }, function(err, results) { 
                if (err) { return next(err); }
                for (let i = 0; i < results.genres.length; i++) { 
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true'; 
                    }
                }
                res.render('book_form', {
                    title: 'Update Book', 
                    authors: results.authors, 
                    genres: results.genres, 
                    book: book, 
                    errors: errors.array()
                }); 
            });
        }
        else {
            console.log('boston')
            Book.findByIdAndUpdate(
                req.params.id,
                book, // the new book w updated values
                {},
                function(err, thebook) {
                    if (err) { return next(err); }

                    res.redirect(thebook.url)
                })
        }
        return;
    }
];





