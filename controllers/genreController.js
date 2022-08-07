var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
var mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find()
    .sort({name: "1"})
    .exec(function (err, genres_list) {
        if (err) { return next(err) }
        res.render('genre_list', { title: 'Genre List', genres: genres_list})
    });
};


// Display detail page for specific genre 
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre(callback) {
            Genre.findById(req.params.id)
            .exec(callback)
        },
        genre_books(callback) {
            Book.find({ 'genre': req.params.id })
            .exec(callback);
        },
    }, function(err, results) {
        if (err) {
            console.log('ma')
            return next(err) 
        }
        if (results.genre==null) { 
            var err = new Error('Genre not found');
            err.status = 404; 
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', {
            title: 'Genre Detail',
            genre: results.genre,
            genre_books: results.genre_books, 
        })
    });
};

// Display Genre create form on GET
exports.genre_create_get = function(req, res) {
    res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST
// * Array notation signifies that the functions in array 
//   are middleware functions to be called in succession 
exports.genre_create_post = [
    // Validate & sanitizze name field 
    body('name', 'Genre name required')
        .trim().isLength({ min: 1 }).escape(),

    // Process request after validation & sanitization 
    (req, res, next) => {
        // Extract validation errors from request 
        const errors = validationResult(req);

        // Create genre object w escaped and trimmed data 
        const genre = new Genre({ name: req.body.name })

        if (!errors.isEmpty()) {
            // There are errors. Render form again w sanitized values/
            // error messages 
            res.render('genre_form', {
                title: 'Create Genre',
                genre, 
                errors: errors.array(),
            });
            return; 
        } else { 
            // Data from form valid
            // Check if Genre w same name already exists.   
            Genre.findOne({ name: req.body.name })
                .exec((err, found_genre) => {
                    if (err) { 
                        return next(err);
                    }
                    
                    if (found_genre) {
                        // Genre exists, redirect to detail page 
                        res.redirect(found_genre.url);
                    } else {
                        genre.save(err => {
                            if (err) {
                                return next(err);
                            }
                            // Genre saved. Redirect to genre detail page. 
                            res.redirect(genre.url)
                        })
                    }
                })
        }
    }
];
// Display Genre delete form on GET 
exports.genre_delete_get = function(req, res) {
    async.parallel({
        genre(callback) { 
            Genre.findById(req.params.id, callback); 
        }, 
        genre_books(callback) {
            Book.find({ genre: req.params.id }, callback)
        }
    }, (err, results) => {
        if (err) { return next(err) }
        res.render('genre_delete', {
            title: 'Delete',  
            genre: results.genre, 
            books: results.genre_books, 
        })
    });
};

// Handle Genre delete on POST
exports.genre_delete_post = function(req, res) {
    Genre.findByIdAndRemove(req.params.id, (err) => {
        if (err) { return next(err) } 
        res.redirect('/catalog/genres');
    });
};

// Display Genre update form on GET 
exports.genre_update_get = function(req, res) {
    Genre.findById(req.params.id, (err, foundGenre) => {

        if (err) { return next(err) }
        res.render('genre_form', {
            title: 'Update Genre', 
            genre: foundGenre, 
        });
    });
};

// Handle Genre update on POST
exports.genre_update_post = [
    body('name').trim().isLength({ min: 1 }).escape(),
    (req, res, next) => {
        const errors = validationResult(req);

        const newGenre = new Genre({
            name: req.body.name, 
            _id: req.params.id, 
        });

        if (!errors.isEmpty()) {
            res.render('genre_form', {
                title:  'Update Genre', 
                genre: req.body, 
                errors: errors.array(),
            });

            return;
        }

        Genre.findByIdAndUpdate(
            newGenre._id, 
            newGenre, 
            {}, 
            (err, updatedGenre) => {
                if (err) { return next(err) }

                res.redirect(updatedGenre.url);
            }
        );
    }
];



