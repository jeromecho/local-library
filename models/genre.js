var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var GenreSchema = new Schema({
    name: { type: String, required: true, minLength: 3, maxLength: 100},
});

GenreSchema
.virtual('url')
.get(function () {
    var url = '/catalog/genre/' + this._id;
    return url;
})

module.exports = mongoose.model('Genre', GenreSchema);
