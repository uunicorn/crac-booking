
var contextPath = '/booking-api'; // XXX pass from the server side?

function init()
{
    $('.date').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        disableTouchKeyboard: true
    });


    $('#submit').click(function(e) {
        e.preventDefault();

        var start = moment($('#start-date').val(), 'DD/MM/YYYY'),
            end = moment($('#end-date').val(), 'DD/MM/YYYY'),
            params = {
                from_time: start.format(),
                to_time: end.format(),
                format: 'csv'
            };

        if(!start.isValid() || !end.isValid()) {
            alert("Please provide start and end date values.");
            return;
        }

        window.location = contextPath + '/booking/?' + $.param(params);
    });
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
    init();
});
