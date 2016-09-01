
var aircraftsByRego,
    aircraftsByUrl,
    step = moment.duration(10, 'minutes'),
    selectionStart, // first row clicked, inclusive (moment)
    selectionEnd, // last row clicked, inclusive (moment)
    bookings; // list of bookings

var daylight_table = [ // XXX
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


function timeDiv(time) {
    return $('<div/>')
        .addClass('time')
        .addClass('col-md-1')
        .text(time.format('HH:mm'));
}

function editBooking(booking) {
    $('#add-form-content #url').val(booking.url);
    $('#add-form-content #date').val(moment(booking.from_time).format('DD/MM/YYYY'));
    $('#add-form-content #from-time').val(moment(booking.from_time).format('HH:mm'));
    $('#add-form-content #to-time').val(moment(booking.to_time).format('HH:mm'));
    $('#add-form-content #pax').val(booking.pax);
    $('#add-form-content #pic').val(booking.pic);
    $('#add-form-content #email').val(booking.contact_email);
    $('#add-form-content #phone').val(booking.contact_phone);
    $('#add-form-content #details').val(booking.details);
    $('#add-form-content #aircraft').val(aircraftsByUrl[booking.aircraft].rego);
    if(booking.url) {
        $('#add-form-content #submit').val('Save');
        $('#add-form-content #delete').show();
    } else {
        $('#add-form-content #submit').val('Add');
        $('#add-form-content #delete').hide();
    }
    $('#add-form-content').modal('show');
}

function initBookingForm() {
    $('#add-form-content #delete').click(function() {
        var url = $('#add-form-content #url').val();

        $.ajax({
            url: url,
            type: 'DELETE',
            beforeSend: function(xhr){
                xhr.setRequestHeader('X-CSRFToken', $.cookie('csrftoken'));
            }
        })
        .done(function(booking) {
            $('.booking-line').trigger('del-booking', [url]);
            $('#add-form-content').modal('hide');
        })
        .fail(function(e, err, params) {
            alert('oops: ' + err);
        });
    });

    $('#add-form-content #submit').click(function() {
        var url = $('#add-form-content #url').val(),
            date = $('#add-form-content #date').val(),
            from = moment(date + ' ' + $('#add-form-content #from-time').val(), 'DD/MM/YYYY HH:mm'),
            to = moment(date + ' ' + $('#add-form-content #to-time').val(), 'DD/MM/YYYY HH:mm'),
            request = {
                "url": url,
                "from_time": from.utc().format(),
                "to_time": to.utc().format(),
                "pax": $('#add-form-content #pax').val(),
                "pic": $('#add-form-content #pic').val(),
                "contact_email": $('#add-form-content #email').val(),
                "contact_phone": $('#add-form-content #phone').val(),
                "details": $('#add-form-content #details').val(),
                "aircraft": aircraftsByRego[$('#add-form-content #aircraft').val()].url
            };

        $.ajax({
            url: url ? url : 'api/booking/',
            type: url ? 'PUT' : 'POST',
            contentType: 'application/json',
            data: JSON.stringify(request),
            beforeSend: function(xhr){
                xhr.setRequestHeader('X-CSRFToken', $.cookie('csrftoken'));
            }
        })
        .done(function(booking) {
            var currentAcUrl = aircraftsByRego[$('#for-ac').val()].url;

            if(url) {
                $('.booking-line').trigger('del-booking', [url]);
                if(request.aircraft === currentAcUrl) {
                    $('.booking-line').trigger('add-booking', [request]);
                }
            } else {
                selectionStart = selectionEnd = null;
                $('.booking-line').trigger('selection-changed');
                if(booking.aircraft === currentAcUrl) {
                    $('.booking-line').trigger('add-booking', [booking]);
                }
            }
            $('#add-form-content').modal('hide');
        })
        .fail(function(e, err, params) {
            alert('oops: ' + err);
        });
    });
}

function addBooking(e) {
    var min = selectionStart, 
        max = selectionEnd,
        tmp;

    e.stopPropagation();

    if(max.isBefore(min)) {
        tmp = min;
        min = max;
        max = tmp;
    }

    max = max.clone().add(step);

    editBooking({
        "from_time": min.utc().format(),
        "to_time": max.utc().format(),
        "pax": '',
        "pic": '',
        "contact_email": '',
        "contact_phone": '',
        "details": '',
        "aircraft": aircraftsByRego[$('#for-ac').val()].url
    });

}

function cancelSelection(e) {
    e.stopPropagation();
    selectionStart = selectionEnd = null;
    $('.booking-line').trigger('selection-changed');
}

function select(time) {
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
    var booking,
        header = false, 
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

        if(booking) {
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
        var min = moment(params.from_time),
            max = moment(params.to_time),
            bookingrange = moment.range(min, max);

        if(rowrange.overlaps(bookingrange)) {
            booking = params;

            div.addClass('booked');

            if(time.isSame(min)) {
                div.find('.contents').html(existingBookingHeaderDiv(booking));
            }
        }
    });

    div.bind('del-booking', function(e, params) {
        if(booking && booking.url === params) {
            div.find('.contents').empty();
            booking = null;
            div.removeClass('booked');
        }
    });

    div.click(function() {
        if(booking) {
            editBooking(booking);
            return;
        }

        if(header) {
            return;
        }

        select(time);
    });

    return div;
}

function getToday() {
    return moment($('.today').val(), 'DD/MM/YYYY');
}

function render() {
    var today = getToday(),
        aircraft = $('#for-ac').val(),
        start = today.clone().startOf('day'),
        end = start.clone().add(1, 'day'),
        daylight = getDaylightHours(today),
        dawn = start.clone().add(moment.duration(daylight.dawn)),
        dusk = start.clone().add(moment.duration(daylight.dusk)),
        listdiv = $('.js-table-content');

    selectionStart = selectionEnd = null;

    listdiv.empty();

    moment.range(start, end).by(step, function(time) {
        if(time.isBefore(dawn) || time.isAfter(dusk)) {
            return;
        }

        listdiv.append(baseLine(time));
    });

    $.get('api/booking/', { 
        from_time: start.format(), 
        to_time: end.format(), 
        aircraft: aircraft 
    })
    .done(function(bookings) {
        for(var i=0;i<bookings.length;i++) {
            $('.booking-line').trigger('add-booking', [bookings[i]]);
        }
    })
    .fail(function(e, err, params) {
        alert('oops: ' + err);
    });
}

function init() {
    $('.today').datepicker({
        format: 'dd/mm/yyyy'
    });

    $('.today').change(function() {
        render();
    });
    
    $('#for-ac').change(function() {
        render();
    });
    
    $('.prev-day').click(function() {
        var today = getToday();
        today.subtract(1, 'day');
        $('.today').val(today.format('DD/MM/YYYY'));
        render();
    });

    $('.next-day').click(function() {
        var today = getToday();
        today.add(1, 'day');
        $('.today').val(today.format('DD/MM/YYYY'));
        render();
    });

    $('.today').val(moment().format('DD/MM/YYYY'));

    render();
    initBookingForm();
}

$(document).ready(function() {
    $.get('api/aircraft/')
    .done(function(acs) {
        aircraftsByRego = {};
        aircraftsByUrl = {};

        $('#for-ac').empty();
        $('#add-form-content #aircraft').empty();

        for(var i = 0;i<acs.length;i++) {
            aircraftsByRego[acs[i].rego] = acs[i];
            aircraftsByUrl[acs[i].url] = acs[i];
            $('#for-ac').append($('<option>').text(acs[i].rego));
            $('#add-form-content #aircraft').append($('<option>').text(acs[i].rego));
        }

        init();
    })
    .fail(function(e, err, params) {
        alert('oops: ' + err);
    });
});
