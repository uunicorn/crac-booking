
var contextPath = '/booking-api', // XXX pass from the server side?
    aircraftsByRego,
    aircraftsByUrl,
    step = moment.duration(10, 'minutes'),
    selectionStart, // first row clicked, inclusive (moment)
    selectionEnd, // last row clicked, inclusive (moment)
    bookings; // list of bookings

var daylight_table = [ // XXX
    { start: 1, dawn: '6:30', dusk: '18:10'},
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
    cleanBookingForm();

    $('#add-form-content #url').val(booking.url);
    $('#add-form-content #date').val(moment(booking.from_time).format('DD/MM/YYYY'));
    $('#add-form-content #from_time').val(moment(booking.from_time).format('HH:mm'));
    $('#add-form-content #to_time').val(moment(booking.to_time).format('HH:mm'));
    $('#add-form-content #pic').val(booking.pic).trigger('change');
    $('#add-form-content #pax').val(booking.pax).trigger('change');
    $('#add-form-content #contact_email').val(booking.contact_email);
    $('#add-form-content #contact_phone').val(booking.contact_phone);
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

function cleanBookingForm() {
    $('#add-form-content .alerts').empty().hide();

    $('#add-form-content .has-error')
        .removeClass('has-error')
        .find('input,textarea')
        .tooltip('destroy');
}

function initBookingForm() {
    $.fn.select2.defaults.set( "theme", "bootstrap" );

    // hack to allow select2 to work with bootstrap
    $.fn.modal.Constructor.prototype.enforceFocus = function () {};

    $('.member-select').select2({
        ajax: {
            url: contextPath + "/member/",
            delay: 250,
            cache: true,
            dataType: 'json',
            data: function (params) {
                return { search: params.term };
                /*
                return {
                    search: params.term,
                    page: params.page
                };
                */
            },

            processResults: function (data, params) {
                if(data.length === 0) {
                    return {
                        results: [ {
                            id: params.term,
                            text: params.term,
                            freetext: true
                        } ]
                    };
                }

                return {
                    results: $(data).map(function() {
                        var fullname = this.first_name + ' ' + this.last_name;

                        return {
                            id: fullname,
                            text: fullname
                        };
                    })/*,
                    pagination: { 
                        more: true 
                    }*/
                };
            }
        },
        minimumInputLength: 3,
        escapeMarkup: function (markup) { 
            return markup;
        },
        templateResult: function(member) {
            if (member.loading) {
                return member.text;
            }

            if(member.freetext) {
                return $('<span>Use what I typed</span>');
            }

            return $('<span class="clearfix">').text(member.text);
        },
        templateSelection: function(member) {
            return member.text;
        },
        selectOnBlur: true,
        multiple: false,
        debug: true
    });

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
        cleanBookingForm();

        var url = $('#add-form-content #url').val(),
            date = $('#add-form-content #date').val(),
            from = moment(date + ' ' + $('#add-form-content #from_time').val(), 'DD/MM/YYYY HH:mm'),
            to = moment(date + ' ' + $('#add-form-content #to_time').val(), 'DD/MM/YYYY HH:mm'),
            request = {
                "url": url,
                "from_time": from.utc().format(),
                "to_time": to.utc().format(),
                "pax": $('#add-form-content #pax').val(),
                "pic": $('#add-form-content #pic').val(),
                "contact_email": $('#add-form-content #contact_email').val(),
                "contact_phone": $('#add-form-content #contact_phone').val(),
                "details": $('#add-form-content #details').val(),
                "aircraft": aircraftsByRego[$('#add-form-content #aircraft').val()].url
            };

        $.ajax({
            url: url ? url : (contextPath + '/booking/'),
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
        .fail(function(e) {
            var node, response = e.responseJSON;

            $(['from_time', 'to_time', 'pic', 'pax', 'contact_email', 'contact_phone', 'details'])
                .filter(function() {
                    return response[this];
                })
                .each(function(i) {
                    var input = $('#' + this);

                    if(input) {
                        input.closest('.form-group').addClass('has-error');
                        input.tooltip({trigger: 'focus', placement: 'top', title: response[this]});

                        if(i == 0) {
                            input.focus();
                        }
                    }
                });

            if(response['non_field_errors']) {
                node = $('<ul>');
                
                $(response['non_field_errors']).each(function() {
                    node.append($('<li>').text(this));
                });

                $('#add-form-content .alerts').show().append(node);
            }
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
            .addClass('pull-right btn-group')
            .append($('<div class="btn btn-success">Add</div>').click(addBooking))
            .append($('<div class="btn btn-default">Cancel</div>').click(cancelSelection))
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

    $.get(contextPath + '/booking/', { 
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
        format: 'dd/mm/yyyy',
        autoclose: true,
        disableTouchKeyboard: true
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

function init_spinny_thing() {
    var node = $('.loading').hide();

    $(document)
        .ajaxStart(function() {
            node.show();
        })
        .ajaxStop(function() {
            node.hide();
        });
}

$(document).ready(function() {
    init_spinny_thing();

    $.get(contextPath + '/aircraft/', {
	status: 'ACTIVE'
    })
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
