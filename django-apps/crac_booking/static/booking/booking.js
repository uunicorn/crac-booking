
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

function init(today) {
    $.when(
        $.get('/booking/api/booking/'),
        $.get('/booking/api/aircraft/'),
        $.get('/booking/api/member/')
    ).done(function(bookings, aircrafts, members) {
        bookings = bookings[0];
        aircrafts = aircrafts[0];
        members = members[0];

        render(today, bookings);

    }).fail(function(e, err, params) {
        alert('oops: ' + err);
    });
}

function timeSpan(time) {
    return $('<span/>')
        .addClass('time')
        .addClass('col-md-4')
        .text(time.format("HH:mm"));
}

function baseLine(time) {
    return $('<a href="javascript:void(0)">')
        .addClass('row')
        .addClass('list-group-item')
        .addClass('list-group-item-action')
        .append(timeSpan(time));
}

function emptyLine(time) {
    return baseLine(time)
        .addClass('free')
        .click(function() {
            alert('>>> ' + time.format('HH:mm'));
        });
}

function bookingLine(time) {
    return baseLine(time).addClass('booked');
}

function bookingHeader(time, booking) {
    return baseLine(time)
        .addClass('booked')
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


function render(today, bookings) {
        var daylight = getDaylightHours(today);
        var tbody = $('.js-table-content');
        var b = 0;


        for (var m = 0; m < 24*60; m+=10) {
                if (m >= daylight.dawn && m <= daylight.dusk) {
                    var time = today.clone().add(m, 'minutes');

                    if (b < bookings.length) {
                        if (moment(bookings[b].from_time).isSame(time)) {
                            tbody.append(bookingHeader(time, bookings[b]));

                            for (m+=10; m <= daylight.dusk; m+=10) {
                                    time = today.clone().add(m, 'minutes');
                                    tbody.append(bookingLine(time));
                                    if (moment(bookings[b].to_time).isSame(time)) {
                                        break;
                                    }
                            }
                            b++;
                            continue;
                        }
                    }

                    tbody.append(emptyLine(time));
                }
        }
}

$(document).ready(function() {
    var today = moment('2016/08/21', 'YYYY/MM/DD'); // XXX
    init(today);
});
