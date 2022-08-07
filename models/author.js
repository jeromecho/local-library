var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var AuthorSchema = new Schema({
    first_name: {type: String, required: true, maxLength: 100},
    family_name: {type: String, required: true, maxLength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
});
const { DateTime } = require('luxon');

// Virtuals are NOT pushed to databases, they only exist in logic as 
// something developers decide to construct out of convenience 
AuthorSchema
.virtual('name')
.get(function () { 
    var fullname = '';
    if (this.first_name && this.family_name) {
        fullname = this.family_name + ', ' + this.first_name
    }

    return fullname; 
});

// Virtual for author's lifespan
AuthorSchema.virtual('lifespan').get(function () {
    var lifetime_string = '';
    if (this.date_of_birth) {
        lifetime_string = this.date_of_birth.getYear().toString();
    }
    lifetime_string += ' - ';
    if (this.date_of_death) { 
        lifetime_string += this.date_of_death.getYear()
    }

    return lifetime_string
})

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function() {
    return '/catalog/author/' + this._id;
}); 

AuthorSchema
.virtual('date_of_birth_formatted')
.get(function() {
    return this.date_of_birth ?
        DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) :
        '';
});

AuthorSchema
.virtual('date_of_death_formatted')
.get(function() {
    return this.date_of_death ?
        DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) :
        '';
});

module.exports = mongoose.model('Author', AuthorSchema);



