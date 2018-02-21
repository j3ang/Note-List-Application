//This js application will be creating crud structure utlize the web indexed database
jQuery(document).ready(function($) {
    "use strict";
    console.log("app.js loaded");

    //open database
    var openRequest = indexedDB.open('notes', 1);
    var db;

    //upgrade database if needed - This event only handled in recent browsers
    openRequest.onupgradeneeded = function(e) {
        console.log('upgrading DB');
        var thisDB = e.target.result;
        if (!thisDB.objectStoreNames.contains('notesStore')) {
            thisDB.createObjectStore('notesStore', {
                autoIncrement: true
            });
        }
    };

    //error handling 
    openRequest.onerror = function(e) {
        console.dir(e);
    };

    //success handling
    openRequest.onsuccess = function(e) {
        console.log('Success: Database was opened!');
        db = e.target.result;

        //Add button
        $('#add').click(function(e) {
            var dnT = $('#date').text();
            var detail = $('#note_detail').val();
            var sub = $('#subject').val();
            var fn = $('#full-name').val();

            // validate fields
            if (!$('#full-name').val().trim()) {
                alert('full name is reqired');
            } else if (!$('#subject').val().trim()) {
                alert('Subject is required!');
            } else if (!$('#note_detail').val()) {
                alert('Note details are required!');
            } else {
                //calling addNote() function
                addNote(new note(fn, sub, dnT, detail));

                // hides the form after add
                $('#new_form').toggle();

                //clean the form after add
                $('#date').val('');
                $('#note_detail').val('');
                $('#subject').val('');
                $('#full-name').val('');
            }

            e.preventDefault();
        });

        // render notes list
        showNotes();
    };

    //function to add new note
    function addNote(note) {
        // var time = $('#date').text();
        // var detail = $('#note_detail').val();
        // var sub = $('#subject').val();
        // var name = $('#full-name').val();

        // create transaction
        var transaction = db.transaction("notesStore", "readwrite");
        // Ask for ObejcetStore
        var store = transaction.objectStore("notesStore");
        console.log('addNote - transaction created | notesStore obtained');

        // Perform the add action
        openRequest = store.add(note);

        //Error
        openRequest.onerror = function(e) {
            console.log("Sorry, the contact was not added");
        }

        //Success - log and show on website
        openRequest.onsuccess = function(e) {
            showNotes();
        }
    }

    //function to display notes list
    function showNotes() {
        $('#results-wrapper').empty();
        //Count Objects
        var transaction = db.transaction(['notesStore'], 'readonly');
        var store = transaction.objectStore('notesStore');
        var countRequest = store.count();

        countRequest.onsuccess = function() {
            console.log('Current records: ' + countRequest.result);
            var count = Number(countRequest.result);



            if (countRequest.result > 0) {
                //create table head
                $('#results-wrapper').prepend('<table id="result_table" class="u-full-width">' +
                    '<thead><tr><th>Subject</th><th>Message</th><th>Date and Time</th><th>Action</th></tr></thead></table>');

                // create a transaction, retrieve an object store, 
                var transaction = db.transaction("notesStore", "readonly");
                var objectStore = transaction.objectStore('notesStore');

                // then use a cursor to iterate through all the records in the object store
                objectStore.openCursor().onsuccess = function(e) {
                    var cursor = e.target.result;

                    if (cursor) {
                        // cursor.value contains the current record being iterated through
                        // this is where you'd do something with the result
                        var $row = $('<tr>');


                        //limits the length of subject for display in list
                        if (cursor.value.subject.length > 15) {
                            var shortStr = cursor.value.subject.substring(0, 15);
                            var $subCell = $('<td>' + shortStr + '</td>');
                        } else {
                            var $subCell = $('<td>' + cursor.value.subject + '</td>');
                        }

                        //limits the length of detail for display in list
                        if (cursor.value.detail.length > 35) {
                            var shortDetail = cursor.value.detail.substring(0, 35);
                            var $detailOpenLink = $('<a href="#" data-key="' + cursor.key + '">'+ shortDetail +'</a>');
                            var $detailCell = $('<td></td>').append($detailOpenLink);
                        } else {
                        	var $detailOpenLink = $('<a href="#" data-key="' + cursor.key + '">'+ cursor.value.detail +'</a>');
                            var $detailCell = $('<td></td>').append($detailOpenLink);
                        }

                        var $deleteLink = $('<a href="#" data-key="' + cursor.key + '">' + '<p>Delete</p> ' + '</a>');
                        


                        $deleteLink.click(function() {
                            delNote(Number($(this).attr('data-key')));
                            // $('#load-note').show();
                            // showNotebykey(Number($(this).attr('data-key')));
                        });

                        $detailOpenLink.click(function() {
                            $('#load-note').show();
                            showNotebykey(Number($(this).attr('data-key')));
                        });


                        var $actionCell = $('<td></td>').append($deleteLink);

                        var $dntCell = $('<td></td>').append(cursor.value.time);




                        $row.append($subCell);
                        $row.append($detailCell);
                        $row.append($dntCell);
                        $row.append($actionCell);

                        $('#result_table').append($row);

                        cursor.continue();

                    } else {
                        //no more entries
                    }
                }
            } // if (countRequest.result > 0) end
            else {
                $('#results-wrapper').empty();
                $('#results-wrapper').append('No notes to show.');
            }
        }
    }




    // function to update notes
    function updateNote(k) {

        // create transaction
        var transaction = db.transaction("notesStore", "readwrite");
        // Ask for ObejcetStore
        var store = transaction.objectStore("notesStore");

        var updateName = $('#edit-name').val();
        var updateSub = $('#edit-subject').val();
        var updateDnt = showDate();
        var updateDetail = $('#edit-textarea').val();


        //perform update
        var noteUpdate = new note(updateName, updateSub, updateDnt, updateDetail);
        var request = store.put(noteUpdate, k);

        showNotes();

    } //end of  update notes



    // load by key function
    function showNotebykey(k) {
        var transaction = db.transaction("notesStore", "readonly");
        var store = transaction.objectStore('notesStore');
        var request = store.get(k);

        request.onerror = function(e) {
            // Handle errors!
        };

        request.onsuccess = function(e) {
            // Do something with the request.result!
            console.log(request);

            $('#load-note').html('<p id="addedOn"> Last edited on: ' + request.result.time +
                ' by <input type="text" class="u-full-width" id="edit-name"></p>');
            $('#edit-name').val(request.result.name);

            $('#load-note').append($('<input type="text" class="u-full-width" id="edit-subject">'));
            $('#edit-subject').val(request.result.subject);
            $('#edit-subject').wrap($('<label for="edit-subject">Subject</lable>'));

            $('#load-note').append($('<textarea class="u-full-width" id="edit-textarea">' + request.result.detail + '</textarea>'));
            $('#edit-textarea').wrap($('<label for="edit-textarea">Message</lable>'));

            $('#load-note').append($('<div class="row" id="edit-row"></div>'));
            $('#load-note').prepend($('<a id="closelink" href="#"><img id="cancel" src="img/close.png" alt="close" height="22" width="22"></a>'));
            $('#cancel').wrap($('<div id="cancel_wrapper"></div>'));

            $('#edit-row').append($('<button  class="button" id="delete"> Delete </button>'));
            $('#edit-row').append($('<button  class="button-primary" id="save"> Save Change </button>'));

            $('#closelink').click(function() {
                $('#load-note').hide();
            });

            $('#delete').click(function() {
                console.log('deleted id' + k);
                delNote(k);
                $('#load-note').hide();
            });

            $('#save').click(function() {
                console.log('updated id' + k);
                updateNote(k);
                $('#load-note').hide();
            });
        };
    } // end showNotebykey()


    // function to delete notes
    function delNote(k) {
        var transaction = db.transaction("notesStore", "readwrite");
        var store = transaction.objectStore('notesStore');
        var request = store.delete(k);
        request.onsuccess = function(e) {
            $('#result_table').empty();
            $('#result_table').hide();
            showNotes();
        };
    } // end of deleteContact()


    //fucntion to return current date and time
    function showDate() {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        var hh = today.getHours();
        var min = today.getMinutes();
        var sec = today.getSeconds();

        if (dd < 10) {
            dd = '0' + dd
        }

        if (mm < 10) {
            mm = '0' + mm
        }

        return today = mm + '/' + dd + '/' + yyyy + " " + hh + ":" + min + ":" + sec;
    } //end of showDate()

    //note constructors
    function note(name, subject, time, detail) {
        this.name = name;
        this.subject = subject;
        this.time = time;
        this.detail = detail;
    }

    //hides the form onload
    $("#new_form").toggle();

    $('#load-note').hide();

    // NEW NOTE BTN ACTION
    $('#new_note').click(function(e) {
        $('#new_form').toggle();
        //updates time each time new form is opened
        $('#date').empty();
        $('#date').append(showDate());
    });

}); //jQuery document ready end