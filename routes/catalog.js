var express = require('express');
var router = express.Router();

// Require controller modules 
var book_controller = require('../controllers/bookController');
var author_controller = require('../controllers/authorController');
var genre_controller = require('../controllers/genreController');
var bookinstance_controller = require('../controllers/bookInstanceController');

/// BOOK ROUTES ///

// GET catalog home page
router.get('/', book_controller.index);

// GET request for creating book (intentionally comes before 
// routes that display Book (using an id - e.g., '/book/:id') )
router.get('/book/create', book_controller.book_create_get);

// POST request for creating Book 
router.post('/book/create', book_controller.book_create_post);

// GET request to delete Book 
router.get('/book/:id/delete', book_controller.book_delete_get)

// POST request to delete Book 
router.post('/book/:id/delete', book_controller.book_delete_post);

// GET request to update Book 
router.get('/book/:id/update', book_controller.book_update_get)

// POST request to update Book 
router.post('/book/:id/update', book_controller.book_update_post);

// GET request for one Book 
router.get('/book/:id', book_controller.book_detail)

// GET request for list of all Book items 
router.get('/books', book_controller.book_list)


/// AUTHOR ROUTES ///

router.get('/author/create', author_controller.author_create_get);

router.post('/author/create', author_controller.author_create_post);

router.get('/author/:id/delete', author_controller.author_delete_get)

router.post('/author/:id/delete', author_controller.author_delete_post);

router.get('/author/:id/update', author_controller.author_update_get)

router.post('/author/:id/update', author_controller.author_update_post);

router.get('/author/:id', author_controller.author_detail)

router.get('/authors', author_controller.author_list)


/// GENRE ROUTES ///

router.get('/genre/create', genre_controller.genre_create_get);

router.post('/genre/create', genre_controller.genre_create_post);

router.get('/genre/:id/delete', genre_controller.genre_delete_get)

router.post('/genre/:id/delete', genre_controller.genre_delete_post);

router.get('/genre/:id/update', genre_controller.genre_update_get)

router.post('/genre/:id/update', genre_controller.genre_update_post);

router.get('/genre/:id', genre_controller.genre_detail)

router.get('/genres', genre_controller.genre_list)

/// BOOKINSTANCE ROUTES ///

router.get('/bookinstance/create', bookinstance_controller.bookinstance_create_get);

router.post('/bookinstance/create', bookinstance_controller.bookinstance_create_post);

router.get('/bookinstance/:id/delete', bookinstance_controller.bookinstance_delete_get)

router.post('/bookinstance/:id/delete', bookinstance_controller.bookinstance_delete_post);

router.get('/bookinstance/:id/update', bookinstance_controller.bookinstance_update_get)

router.post('/bookinstance/:id/update', bookinstance_controller.bookinstance_update_post);

router.get('/bookinstance/:id', bookinstance_controller.bookinstance_detail)

router.get('/bookinstances', bookinstance_controller.bookinstance_list)

module.exports = router;
