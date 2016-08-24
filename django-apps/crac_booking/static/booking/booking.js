
var today, // midnight of today (moment)
    selectionStart, // first row clicked, inclusive (moment)
    selectionEnd, // last row clicked, inclusive (moment)
    bookings, // list of bookings
    aircrafts, // list of aircrafts
    members; // list of members

var daylight_table = [
    { start: 1, dawn: 410, dusk: 1090},
    { start: 200, dawn: 349, dusk: 977},
    { start: 300, dawn: 470, dusk: 1150}
];

function getDaylightHours(moment) {
    var days = moment.dayOfYear();
    for (var i = daylight_table.length - 1; i >= 0; i--) {
        if (days >= daylight_table[i].start) {
            return daylight_table[i];
        }
    }
    throw "Invalid daylight table";
}

function init(t) {
    today = t;

    $.when(
        $.get('/booking/api/booking/'),
        $.get('/booking/api/aircraft/'),
        $.get('/booking/api/member/')
    ).done(function(bookingsrc, aircraftsrc, membersrc) {
        bookings = bookingsrc[0];
        aircrafts = aircraftsrc[0];
        members = membersrc[0];

        render();

        for(var i=0;i<bookings.length;i++) {
            $('.booking-line').trigger('add-booking', [bookings[i]]);
        }

    }).fail(function(e, err, params) {
        alert('oops: ' + err);
    });
}

function timeDiv(time) {
    return $('<div/>')
        .addClass('time')
        .addClass('col-md-1')
        .text(time.format("HH:mm"));
}

function addNewDiv() {
    return $('<div class="add-new-ops"/>')
        .text('Adding new booking')
        .append($('<div/>')
            .addClass('pull-right')
            .append($('<div class="btn">Add</div>'))
            .append($('<div class="btn">Cancel</div>'))
        );
}

function existingBookingHeaderDiv(booking) {
    return $('<div>')
        .append(
            $('<div/>')
                .addClass('pic')
                .addClass('col-md-4')
                .append('<strong>PiC:</strong>')
                .append($('<span>').text(booking.pic))
        )
        .append(
            $('<div/>')
                .addClass('pax')
                .addClass('col-md-4')
                .append('<strong>Pax:</strong>')
                .append($('<span>').text(booking.pax))
        );
}

function baseLine(time) {
    var header = false, 
        selection = false,
        rowrange = moment.range(time, time.clone().add(10, 'm')),

        div = $('<div>')
        .addClass('booking-line')
        .addClass('row')
        .addClass('list-group-item')
        .addClass('list-group-item-action')
        .append(timeDiv(time))
        .append('<div class="contents">');

    div.bind('selection-changed', function(e, params) {
        if(div.hasClass('booked')) {
            return;
        }

        var min = selectionStart.isBefore(selectionEnd) ? selectionStart : selectionEnd;
        var max = selectionStart.isBefore(selectionEnd) ? selectionEnd : selectionStart;
        var selectedrange = moment.range(min, max.clone().add(10, 'm'));

        if(time.isSame(min)) {
            if(!header) {
                div.find('.contents').html(addNewDiv())
                header = true;
            }
        } else {
            if(header) {
                div.find('.contents').empty();
                header = false;
            }
        }

        if(rowrange.overlaps(selectedrange)) {
            if(!selection) {
                div.addClass('selection');
                selection = true;
            }
        } else {
            if(selection) {
                div.removeClass('selection');
                selection = false;
            }
        }
    });

    div.bind('add-booking', function(e, params) {
        var booking = params,
            min = moment(booking.from_time),
            max = moment(booking.to_time),
            bookingrange = moment.range(min, max);

        if(time.isSame(min)) {
            div.find('.contents').html(existingBookingHeaderDiv(booking));
        }

        if(rowrange.overlaps(bookingrange)) {
            div.addClass('booked');
        }
    });

    div.click(function() {
        if(div.hasClass('booked')) {
            return;
        }

        if(header) {
            return;
        }

        select(time);
    });

    return div;
}

function select(time) {
    if(selectionStart == null) {
        selectionStart = time;
        selectionEnd = time;
    } else {
        selectionEnd = time;
    }
    $('.booking-line').trigger('selection-changed', [selectionStart, selectionEnd])
}

function render() {
    var daylight = getDaylightHours(today);
    var listdiv = $('.js-table-content');
    var b = 0;

    listdiv.empty();

    for (var m = 0; m < 24*60; m+=10) {
        if (m >= daylight.dawn && m <= daylight.dusk) {
            var time = today.clone().add(m, 'minutes');
            listdiv.append(baseLine(time));
        }
    }
}

$(document).ready(function() {
    var today = moment('2016/08/21', 'YYYY/MM/DD'); // XXX
    init(today);
});
