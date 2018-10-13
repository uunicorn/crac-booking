import _ from 'lodash';
import $ from 'jquery';
import 'jquery.cookie';
import ReactLoading from "react-loading";
import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
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
            'margin-right': '0.5em'
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

        const { start, end } = props.booking || {};

        this.state = {
            start: start,
            end: end || start,
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

        $.ajax({
            url: this.props.booking.url,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(),
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
                <Button color="success" onClick={this.save}>Save</Button>
                <Button onClick={this.props.onClose}>Cancel</Button>
            </ModalFooter>
        </Modal>;
    }
}

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            show: false,
            booking: null
        };

        this.toggle = this.toggle.bind(this);
        this.change = this.change.bind(this);
    }

    componentDidMount() {
        $.get('http://localhost:8000/booking-api/booking/1/')
            .then((booking) => {
                console.log('loaded booking', booking);
                this.setState({
                    loading: false,
                    booking: booking
                })
            });
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
        return <div>
            <ActionButton loading={this.state.loading} onClick={this.toggle}>Show</ActionButton>
            <TerminateModal 
                booking={this.state.booking} 
                show={this.state.show} 
                onChange={this.change} 
                onClose={this.toggle} />
        </div>;
    }
}

export default App;
