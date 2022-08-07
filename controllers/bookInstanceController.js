var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const { body, validationResult } =  require('express-validator');
const async = require('async');

// Display list of all BookInstances
exports.bookinstance_list = function(req, res) { 
    BookInstance.find({})
        .populate('book')
        .exec((err, list_bookinstances) => {
            if (err) { return next(err); }
            // Successful, so render
            res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
        })
};
// Display list of all BookInstances
exports.bookinstance_detail = function(req, res) { 
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance) { 
        if (err) { return next(err) }
        if ( bookinstance==null ) {
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        res.render('bookinstance_detail', {
            title: 'Copy: ' + bookinstance.book.title, 
            bookinstance: bookinstance
        })
    })
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = function(req, res) {
    Book.find({}, 'title')
        .exec(function (err, books) { 
            if (err) { return next(err) }
            res.render('bookinstance_form', {
                title: 'Create BookInstance',
                book_list: books,
            })
        })
};

// Handle BookInstance create on POST 
exports.bookinstance_create_post = [
    body('book', 'Book must be specified').trim().isLength({ min : 1 }).escape(), 
    body('imprint', 'Imprint must be specified').trim().isLength({ min : 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true}).isISO8601().toDate(),
        (req, res, next) => {

            const errors = validationResult(req);
            var bookinstance = new BookInstance({
                book: req.body.book, 
                imprint: req.body.imprint, 
                status: req.body.status, 
                due_back: new Date(req.body.due_back), 
            })

            if (!errors.isEmpty()) { 

                Book.find({}, 'title')
                    .exec(function(err, books) {

                        if (err) { return next(err) }
                        res.render('bookinstance_form', {
                            title: 'Create BookInstance',
                            book_list: books, 
                            selected_book: bookinstance.book._id, 
                            errors: errors.array(), 
                            bookinstance: bookinstance, 
                        });
                    });
                return; 
            }
            else {
                bookinstance.save(function (err) { 
                    if (err) { return next(err); }
                    res.redirect(bookinstance.url);
                })
            }


        }
];

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = function(req, res) {
        BookInstance
            .findById(req.params.id)
            .populate('book')
            .exec((err, book_instance) =>{
                if (err) { return next(err) }
                res.render('bookinstance_delete', {
                    title: 'Delete',
                    bookinstance: book_instance,
                });
        });
};

// handle BookInstance delete on POST
exports.bookinstance_delete_post = function(req, res) {
    BookInstance.findByIdAndRemove(req.params.id, (err) => {
        if (err) { return next(err) }
        BookInstance.find().populate('book').exec((err, list_bookinstances) =>  {
            if (err) { return next(err) }
            res.render('bookinstance_list', {
                title: 'Book Instance List',
                bookinstance_list: list_bookinstances, 
            });
        });
    });
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = (req, res, next) => {
    async.parallel({
        book_instance(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        }, 
        books(callback) { 
            Book.find({}, callback);
        }
    }, (err, results) => {
        if (err) { return next(err) }
        
        res.render('bookinstance_form', {
            title: 'Update Bookinstance', 
            bookinstance: results.book_instance, 
            book_list: results.books,  
            selected_book: results.book_instance.book._id, 
        });
    });
};

// Handle BookInstance update on POST
exports.bookinstance_update_post = [
    // Santizie and validate
    body('book', 'Book must be specified.').trim().isLength({ min: 1 }).escape(), 
    body('imprint', 'Imprint must be specified.').trim().isLength({ min: 1 }).escape(), 
    body('due_date', 'Due date must be specified.')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1 })
    .isISO8601()
    .toDate(),
    body('status', 'Status must be specified.').trim().isLength({ min: 1 }).escape(), 
    (req, res, next) => {
        const errors = validationResult(req);

        const bookinstance = new BookInstance({ 
            _id: req.params.id, 
            book: req.body.book, 
            imprint: req.body.imprint, 
            status: req.body.status, 
            due_back: req.body.due_back, 
        });

        if (!errors.isEmpty()) { 
            Book.find().exec((err, books) => {
                if (err) { return next(err) }
                
                res.render('bookinstance_form',{
                    title: 'Update Bookinstance', 
                    bookinstance:bookinstance, 
                    book_list: books, 
                    errors: errors.array(),
                    selected_book: bookinstance.book,
                });

                return;
            });
       } 
        BookInstance.findByIdAndUpdate(
            req.params.id,
            bookinstance,
            {},
            (err, thebookinstance) => {
                if (err) { return next(err); }
                res.redirect(thebookinstance.url);
            }
        );
    }
];




