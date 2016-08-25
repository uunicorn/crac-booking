
var today, // midnight of today (moment)
    step = moment.duration(10, 'minutes'),
    selectionStart, // first row clicked, inclusive (moment)
    selectionEnd, // last row clicked, inclusive (moment)
    bookings, // list of bookings
    aircrafts, // list of aircrafts
    members; // list of members

var daylight_table = [
    { start: 1, dawn: '6:50', dusk: '18:10'},
    { start: 200, dawn: '5:49', dusk: '16:17'},
    { start: 300, dawn: '12:20', dusk: '19:10'}
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
        .text(time.format('HH:mm'));
}

function addBooking(e) {
    e.stopPropagation();
    alert(selectionStart.format('HH:mm') + '..' + selectionEnd.format('HH:mm'));
}

function cancelSelection(e) {
    e.stopPropagation();
    selectionStart = selectionEnd = null;
    $('.booking-line').trigger('selection-changed');
}

function select(time) {
    console.log('select');
    if(selectionStart == null) {
        selectionStart = selectionEnd = time;
    } else {
        selectionEnd = time;
    }
    $('.booking-line').trigger('selection-changed')
}

function addNewDiv() {
    return $('<div class="add-new-ops"/>')
        .text('Adding new booking')
        .append($('<div/>')
            .addClass('pull-right')
            .append($('<div class="btn">Add</div>').click(addBooking))
            .append($('<div class="btn">Cancel</div>').click(cancelSelection))
        );
}

function existingBookingHeaderDiv(booking) {
    return $('<div>')
        .append($('<div/>')
            .addClass('pic')
            .addClass('col-md-4')
            .append('<strong>PiC:</strong>')
            .append($('<span>').text(booking.pic))
        )
        .append($('<div/>')
            .addClass('pax')
            .addClass('col-md-4')
            .append('<strong>Pax:</strong>')
            .append($('<span>').text(booking.pax))
        );
}

function baseLine(time) {
    var header = false, 
        selection = false,
        rowrange = moment.range(time, time.clone().add(step)),

        div = $('<div>')
            .addClass('booking-line')
            .addClass('row')
            .addClass('list-group-item')
            .addClass('list-group-item-action')
            .append(timeDiv(time))
            .append('<div class="contents">');

    div.bind('selection-changed', function(e) {
        var min = selectionStart, 
            max = selectionEnd,
            selectedrange,
            tmp;

        if(div.hasClass('booked')) {
            return;
        }

        if(min) {
            if(max.isBefore(min)) {
                tmp = min;
                min = max;
                max = tmp;
            }

            selectedrange = moment.range(min, max.clone().add(step));
        }

        if(min && time.isSame(min)) {
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

        if(min && rowrange.overlaps(selectedrange)) {
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

function render() {
    var start = today.clone().startOf('day'),
        end = start.clone().add(1, 'day'),
        daylight = getDaylightHours(today),
        dawn = start.clone().add(moment.duration(daylight.dawn)),
        dusk = start.clone().add(moment.duration(daylight.dusk)),
        listdiv = $('.js-table-content');

    moment.range(start, end).by(step, function(time) {
        if(time.isBefore(dawn) || time.isAfter(dusk)) {
            return;
        }

        listdiv.append(baseLine(time));
    });
}

$(document).ready(function() {
    today = moment('2016/08/21', 'YYYY/MM/DD'); // XXX
    render();
    init(today);
});
