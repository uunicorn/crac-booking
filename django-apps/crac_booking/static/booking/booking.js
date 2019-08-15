
var contextPath = '/booking-api', // XXX pass from the server side?
    aircraftsByRego,
    aircraftsByUrl,
    step = moment.duration(10, 'minutes'),
    selectionStart, // first row clicked, inclusive (moment)
    selectionEnd,   // last row clicked, inclusive (moment)
    selectionRego,  // selection column
    bookings,       // list of bookings
    phone = null;   // phone mode


var daylight_table = [ // XXX
    { start: 1, dawn: '6:30', dusk: '20:00'},
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
        .css({
            '-ms-grid-row': '' + 1,
            '-ms-grid-column': ''+ 1
        })
        .addClass('time')
        .text(time.format('HH:mm'));
}

function editBooking(booking) {
    cleanBookingForm();

    $('#add-form-content #url').val(booking.url);
    $('#add-form-content #date').val(moment(booking.from_time).format('DD/MM/YYYY'));
    $('#add-form-content #from_time').val(moment(booking.from_time).format('HH:mm'));
    $('#add-form-content #to_time').val(moment(booking.to_time).format('HH:mm'));
    $('#add-form-content #pic').data('select2').dataAdapter.select({ id: booking.pic, text: booking.pic });
    $('#add-form-content #pax').data('select2').dataAdapter.select({ id: booking.pax, text: booking.pax });
    $('#add-form-content #contact_email').val(booking.contact_email);
    $('#add-form-content #contact_phone').val(booking.contact_phone);
    $('#add-form-content #hobs_start').val(booking.hobs_start);
    $('#add-form-content #hobs_end').val(booking.hobs_end);
    $('#add-form-content #details').val(booking.details);
    $('#add-form-content #aircraft').val(aircraftsByUrl[booking.aircraft].rego);
    $('#add-form-content #iam_current').prop('checked', false);

    if(booking.url) {
        $('#add-form-content #submit').val('Save');
        $('#add-form-content #delete').show();
    } else {
        $('#add-form-content #submit').val('Add');
        $('#add-form-content #delete').hide();
    }
    $('#add-form-content').modal('show');
}

function terminateFlight(booking) {
    var $node = $('#terminate-flight-form-content'),
        aircraft = aircraftsByUrl[booking.aircraft].rego;

    $.get(contextPath + '/latest-hobs', { 
        aircraft: aircraft 
    })
    .done(function(d) {
        cleanForm($node);

        $node.find('#term_hobs_start').val(booking.hobs_start || d.latest_hobs);
        $node.find('#term_hobs_end').val(booking.hobs_end || d.latest_hobs);
        $node.data(booking);
        
        $('#terminate-flight-form-content').modal('show');
    })
    .fail(function(e, err, params) {
        alert('oops: ' + err);
    });
}

function cleanBookingForm() {
    cleanForm($('#add-form-content'));
}

function cleanForm($node) {
    $node.find('.alerts').empty().hide();

    $node.find('.has-error')
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
                            text: fullname,
                            original: this
                        };
                    })
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

    $('#pic').on('select2:select', function(e) {
        var data = e.params.data.original;

        if(data) {
            if(!$('#contact_email').val() && data.email) {
                $('#contact_email').val(data.email);
            }

            if(!$('#contact_phone').val() && data.cell_phone) {
                $('#contact_phone').val(data.cell_phone);
            }
        }
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
            $('.booking-line .contents').trigger('del-booking', [url]);
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
            current = $('#iam_current').is(':checked'),
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
                "hobs_start": $('#add-form-content #hobs_start').val() || null,
                "hobs_end": $('#add-form-content #hobs_end').val() || null,
                "aircraft": aircraftsByRego[$('#add-form-content #aircraft').val()].url
            };

        if(!current) {
            var input = $('#iam_current');
            input.closest('.form-group').addClass('has-error');
            input.tooltip({trigger: 'focus', placement: 'top', title: 'You must be current to hire the aircraft'});
            input.focus();
            return;
        }

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
            if(url) {
                $('.booking-line .contents').trigger('del-booking', [url]);
                $('.booking-line .contents').trigger('add-booking', [request]);
            } else {
                selectionStart = selectionEnd = selectionRego = null;
                $('.booking-line .contents').trigger('selection-changed');
                $('.booking-line .contents').trigger('add-booking', [booking]);
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

    $('#terminate-flight-form-content #term_submit').click(function() {
        var $node = $('#terminate-flight-form-content'); 

        cleanForm($node);

        var booking = $node.data();
        booking.hobs_start = $node.find('#term_hobs_start').val();
        booking.hobs_end = $node.find('#term_hobs_end').val();

        $.ajax({
            url: booking.url,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(booking),
            beforeSend: function(xhr){
                xhr.setRequestHeader('X-CSRFToken', $.cookie('csrftoken'));
            }
        })
        .done(function(booking) {
            $('.booking-line .contents').trigger('del-booking', [booking.url]);
            $('.booking-line .contents').trigger('add-booking', [booking]);

            $node.modal('hide');
        })
        .fail(function(e) {
            var node, response = e.responseJSON;

            $(['hobs_start', 'hobs_end'])
                .filter(function() {
                    return response[this];
                })
                .each(function(i) {
                    var input = $('#term_' + this);

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

                $node.find('.alerts').show().append(node);
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
        "aircraft": aircraftsByRego[selectionRego].url
    });

}

function cancelSelection(e) {
    e.stopPropagation();
    selectionStart = selectionEnd = selectionRego = null;
    $('.booking-line .contents').trigger('selection-changed');
}

function select(time, rego) {
    if(selectionStart == null) {
        selectionStart = selectionEnd = time;
    } else {
        if(time.isBefore(selectionStart)) {
            selectionStart = time;
        } else {
            selectionEnd = time;
        }
    }
    selectionRego = rego;
    $('.booking-line .contents').trigger('selection-changed')
}

function addNewDiv() {
    return $('<div class="add-new-ops"/>')
        .append($('<p/>').text('Adding new booking. To adjust your time block, click on the start and end times. Remember to allow time for preflighting and warming up the aircraft.'))
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
        )
        .append($('<div/>')
            .addClass('pull-right btn-group')
            .append(booking.hobs_end ? 
                $('<a href="#">')
                    .text('Hobbs: ' + booking.hobs_start 
                          + ' .. ' + booking.hobs_end
                          + ' ($' + (125.0*(booking.hobs_end-booking.hobs_start)).toFixed(2)
                          + ')')
                    .click(function(e) {
                        e.stopPropagation();
                        terminateFlight(booking);
                    }) 
                : 
                $('<div class="btn btn-default">Enter Hobbs hours</div>')
                    .click(function(e) {
                        e.stopPropagation();
                        terminateFlight(booking);
                    }) 
            )
        );
}

function displayACs() {
    if(phone === true) {
        return [$('#for-ac').val()];
    }

    return Object.keys(aircraftsByRego);
}

function headerLine() {
    var acs = displayACs(),
        colsTemplate = '6em' + new Array(acs.length+1).join(' 1fr'),
        div = $('<div>')
            .css({
                '-ms-grid-columns': colsTemplate,
                'grid-template-columns': colsTemplate
            })
            .addClass('header-line');

    $('<div>')
        .css({
            '-ms-grid-row': '' + 1,
            '-ms-grid-column': ''+ 1
        })
        .addClass('time')
        .text('Time')
        .appendTo(div);

    $(acs).each(function(i) {
        var rego = '' + this,
            contents = $('<div>')
                .css({
                    '-ms-grid-row': '' + 1,
                    '-ms-grid-column': ''+ (i+2)
                })
                .addClass('header-contents')
                .text(rego)
                .appendTo(div);
    });

    return div;
}

function baseLine(time) {
    var rowrange = moment.range(time, time.clone().add(step)),
        acs = displayACs(),
        colsTemplate = '6em' + new Array(acs.length+1).join(' 1fr'),
        div = $('<div>')
            .css({
                '-ms-grid-columns': colsTemplate,
                'grid-template-columns': colsTemplate
            })
            .addClass('booking-line')
            .addClass('list-group-item-action')
            .append(timeDiv(time));


    $(acs).each(function(i) {
        var rego = '' + this,
            booking,
            header = false, 
            selection = false,
            contents = $('<div>')
                .css({
                    '-ms-grid-row': '' + 1,
                    '-ms-grid-column': ''+ (i+2)
                })
                .addClass('contents')
                .addClass('contents-' + rego);

        contents.appendTo(div);

        contents.bind('selection-changed', function(e) {
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

            if(min && time.isSame(min) && rego === selectionRego) {
                if(!header) {
                    contents.html(addNewDiv())
                    header = true;
                }
            } else {
                if(header) {
                    contents.empty();
                    header = false;
                }
            }

            if(min && rowrange.overlaps(selectedrange) && rego === selectionRego) {
                if(!selection) {
                    contents.addClass('selection');
                    selection = true;
                }
            } else {
                if(selection) {
                    contents.removeClass('selection');
                    selection = false;
                }
            }
        });

        contents.bind('add-booking', function(e, params) {
            var min = moment(params.from_time),
                max = moment(params.to_time),
                bookingrange = moment.range(min, max);

            if(rowrange.overlaps(bookingrange) && aircraftsByUrl[params.aircraft].rego === rego) {
                booking = params;

                contents.addClass('booked');

                if(time.isSame(min)) {
                    contents.html(existingBookingHeaderDiv(booking));
                }
            }
        });

        contents.bind('del-booking', function(e, params) {
            if(booking && booking.url === params) {
                contents.empty();
                booking = null;
                contents.removeClass('booked');
            }
        });

        contents.click(function() {
            if(booking) {
                editBooking(booking);
                return;
            }

            if(header) {
                return;
            }

            // ignore clicks on any other column while selection is in progress
            if(selectionStart != null && rego !== selectionRego) {
                return;
            }

            select(time, rego);
        });
    });


    return div;
}

function getToday() {
    return moment($('.today').val(), 'DD/MM/YYYY');
}

function render() {
    var today = getToday(),
        start = today.clone().startOf('day'),
        end = start.clone().add(1, 'day'),
        daylight = getDaylightHours(today),
        dawn = start.clone().add(moment.duration(daylight.dawn)),
        dusk = start.clone().add(moment.duration(daylight.dusk)),
        listdiv = $('.js-table-content');

    selectionStart = selectionEnd = null;

    listdiv.empty();

    if(phone !== true) {
        listdiv.append(headerLine());
    }

    moment.range(start, end).by(step, function(time) {
        if(time.isBefore(dawn) || time.isAfter(dusk)) {
            return;
        }

        listdiv.append(baseLine(time));
    });

    $.get(contextPath + '/booking/', { 
        from_time: start.format(), 
        to_time: end.format(), 
    })
    .done(function(bookings) {
        for(var i=0;i<bookings.length;i++) {
            $('.booking-line .contents').trigger('add-booking', [bookings[i]]);
        }
    })
    .fail(function(e, err, params) {
        alert('oops: ' + err);
    });
}

function onResize() {
    if($(window).width() < 768 && phone !== true) {
        phone = true;
        $('#for-ac').parents('.row').show();
        render();
        return;
    } 
    
    if($(window).width() >= 768 && phone !== false) {
        phone = false;
        $('#for-ac').parents('.row').hide();
        render();
        return;
    } 
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
        render(); // no need to re-query the server side, but.. meh.
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

    $(window).resize(onResize);
    onResize();

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
