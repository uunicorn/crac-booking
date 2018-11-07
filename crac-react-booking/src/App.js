import Moment from 'moment-timezone';
import { extendMoment } from 'moment-range';
import _ from 'lodash';
import $ from 'jquery';
import 'jquery.cookie';
import ReactLoading from "react-loading";
import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { 
        Form,
        FormGroup,
        Label,
        Col,
        Modal,
        ModalHeader,
        ModalBody,
        ModalFooter,
        Button,
        Input } from 'reactstrap';

const moment = extendMoment(Moment);

console.log({moment});

const Field = (props) => {
    let id = _.uniqueId();

    return <FormGroup row>
        <Label for={id} sm={6}>{props.children}</Label>
        <Col sm={6}>
            <Input id={id} {...props} />
        </Col>
    </FormGroup>
};

const bubbles = 
    <div style={{
            display: 'inline-block',
            marginRight: '0.5em'
        }}>
        <ReactLoading type="spinningBubbles" color="#fff" height="1em" width="1em" />
    </div>;

const ActionButton = (props) => {
    return <Button disabled={props.loading} {...props}>
        { props.loading && bubbles }
        { props.children }
    </Button>
};

class TerminateModal extends Component {
    constructor(props) {
        super(props);

        const { hobs_start, hobs_end } = this.props.booking;

        this.state = {
            start: hobs_start,
            end: hobs_end || hobs_start,
            saving: false
        };

        this.save = this.save.bind(this);
        this.changeStart = this.changeStart.bind(this);
        this.changeEnd = this.changeEnd.bind(this);
    }

    save() {
        this.setState({
            saving: true
        });

        setTimeout(() => {
            $.ajax({
                url: this.props.booking.url,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    ...this.props.booking,
                    hobs_start: this.state.start,
                    hobs_end: this.state.end
                }),
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-CSRFToken', $.cookie('csrftoken'));
                }
            })
            .done((booking) => {
                this.setState({
                    saving: false,
                });

                this.props.onChange(booking);
                this.props.onClose();
            })
            .fail((e) => {
                console.log('Error', e);
            });
        }, 5000);
    }

    changeStart(e) {
        this.setState({
            start: parseFloat(e.target.value).toFixed(1)
        });
    }

    changeEnd(e) {
        this.setState({
            end: parseFloat(e.target.value).toFixed(1)
        });
    }

    flightTime() {
        return (this.state.end - this.state.start).toFixed(1);
    }

    render() {
        const closeBtn = <button className="close" onClick={this.props.onClose}>&times;</button>;

        return <Modal isOpen={this.props.show} toggle={this.props.onClose}>
            <ModalHeader toggle={this.props.onClose} close={closeBtn}>Terminate the flight</ModalHeader>
            <ModalBody>
                <p className="alerts bg-danger" />
                <Form>
                    <Field type="number" step="0.1" value={this.state.start} onChange={this.changeStart}>Hobs before the flight</Field>
                    <Field type="number" step="0.1" value={this.state.end} onChange={this.changeEnd}>Hobs after the flight</Field>
                    <Field type="number" step="0.1" value={this.flightTime()} disabled>Flight time</Field>
                </Form>
            </ModalBody>

            <ModalFooter>
                <ActionButton loading={this.state.saving} color="success" onClick={this.save}>Save</ActionButton>
                <Button onClick={this.props.onClose}>Cancel</Button>
            </ModalFooter>
        </Modal>;
    }
}


const step = moment.duration(10, 'm');

const daylight_table = [ // XXX
    { start: 1, dawn: '6:30', dusk: '20:00'},
];

const invalidDaylightTable = () => { throw new Error("Invalid daylight table"); };


const Line = (props) => {
    const classes = 'booking-line row list-group-item list-group-item-action ';
    const b2range = (b) => moment.range(moment(b.from_time), moment(b.to_time));
    const matchingBookings = Array.from(_.filter(props.bookings, (b) => b2range(b).overlaps(props.range)));
    const clicked = (e) => {
        e.preventDefault();
        if(matchingBookings.length > 0) {
            props.onSelected(matchingBookings[0]);
        }
    };

    return <div className={classes + (matchingBookings.length > 0 ? 'booked' : '')} onClick={clicked}>
        <div className="col-md-1 time">
            {props.range.start.format('HH:mm')}
        </div>
        <div className="contents">
        </div>
    </div>
};

const LineGroup = (props) => {
    return <div className="list-group">{
        _.map(props.lines, (range) => 
            <Line 
                key={range.start.format('HHmm')} 
                bookings={props.bookings}
                range={range}
                onSelected={props.onSelected} />)
    }</div>
};

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            today: moment('06/11/2007', 'DD/MM/YYYY'),
            loading: true,
            bookings: [],
            editing: null
        };

        this.toggle = this.toggle.bind(this);
        this.change = this.change.bind(this);
        this.changeDate = this.changeDate.bind(this);
    }
    
    changeDate(e) {
        this.setState({
            today: moment(e.target.value, 'YYYY-MM-DD')
        });
        this.reload();
    }

    getDaylightHours() {
        const days = this.state.today.dayOfYear();

        return _.findLast(daylight_table, (i) => days >= i.start) || invalidDaylightTable;
    }

    splitTheDay() {
        const start = this.state.today.clone().startOf('day');
        const end = start.clone().add(1, 'day');
        const daylight = this.getDaylightHours();
        const offset = (o) => start.clone().add(moment.duration(o));
        const dawn = offset(daylight.dawn);
        const dusk = offset(daylight.dusk);

        const times = [];

        for(let i=start;i < end;i = i.clone().add(step)) {
            if(i.isBefore(dawn) || i.isAfter(dusk))
                continue;

            times.push(moment.range(i, i.clone().add(step)));
        }

        return times;
    }

    componentDidMount() {
        this.reload();
    }

    reload() {
        this.setState({
            loading: true
        });

        setTimeout(() => {
            const start = this.state.today.clone().startOf('day');
            const end = start.clone().add(1, 'day');

            $.get('http://localhost:8000/booking-api/booking/', { 
                from_time: start.format(), 
                to_time: end.format()
            })
            .then((bookings) => this.setState({ bookings }), (e) => console.log('oops', e));


            $.get('http://localhost:8000/booking-api/booking/1/')
                .then((booking) => {
                    console.log('loaded booking', booking);
                    this.setState({
                        loading: false,
                        booking: booking
                    })
                });
        }, 5000);
    }

    toggle() {
        this.setState({
            show: !this.state.show
        });
    }

    change(booking) {
        console.log('Saved booking', booking);
    }


    render() {
        const selected = (booking) => {
            this.setState({
                editing: booking
            });
        };
        const close = () => {
            this.setState({
                editing: null
            });
        };
        const change = (newBooking) => {
            console.log('new Booking: ', newBooking);
        };

        return <div className="wrapper"><div className="container">
            <Input type="date" onChange={this.changeDate} value={this.state.today.format('YYYY-MM-DD')} />
            <ActionButton loading={this.state.loading} onClick={this.toggle}>Show</ActionButton>
            <LineGroup lines={this.splitTheDay()} bookings={this.state.bookings} onSelected={selected}/>
            { this.state.editing && 
                <TerminateModal 
                    key={this.state.editing.url}
                    booking={this.state.editing} 
                    show={true}
                    onChange={change} 
                    onClose={close} />
            }
        </div></div>;
    }
}

export default App;
