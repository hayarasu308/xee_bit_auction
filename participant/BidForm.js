import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'

import debounce from 'lodash.debounce'

import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card'

import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'
import SnackBar from 'material-ui/SnackBar'

import { bid } from './actions'

import throttleProps from 'react-throttle-render'

import { ReadJSON, InsertVariable } from '../util/ReadJSON'

const mapStateToProps = ({personal, dynamic_text}) => ({
  role: personal.role,
  money: personal.money,
  dynamic_text: dynamic_text
})

class BidForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: '',
      isValid: false,
      snack: false,
      bid: '',
      errorText: ''
    }
    this.setErrorText = debounce(this.setErrorText, 500)
  }

  closeSnack() {
    this.setState({
      snack: false
    })
  }

  handleChange(event) {
    const value = event.target.value
    const { role, money } = this.props
    const numValue = parseInt(value, 10)
    const isValid = role == "buyer"
      ? numValue <= money && numValue > 0
      : numValue >= money

    this.setState({
      value,
      isValid
    })

    if (isValid || value == '') {
      this.setErrorText.cancel()
      this.setState({ errorText: '' })
    } else {
      this.setErrorText(role, numValue)
    }
  }

  setErrorText(role, numValue) {
    if (isNaN(numValue) || numValue <= 0) {
      this.setState({ errorText: InsertVariable(ReadJSON().static_text["error_text"][0], {}, this.props.dynamic_text["variables"])})
    } else {
      if (role == "buyer") {
        this.setState({ errorText: InsertVariable(ReadJSON().static_text["error_text"][1], {}, this.props.dynamic_text["variables"])})
      } else {
        this.setState({ errorText: InsertVariable(ReadJSON().static_text["error_text"][2], {}, this.props.dynamic_text["variables"])})
      }
    }
  }

  handleClick() {
    const { dispatch } = this.props
    const { value } = this.state
    this.setState({
      value: '',
      isValid: false,
      snack: true,
      bid: value
    })
    dispatch(bid(parseInt(value, 10)))
  }

  handleKeyDown(event) {
    const { isValid } = this.state
    if (isValid && (event.key === "Enter" || event.keyCode === 13)) { // Enter
      this.handleClick()
    }
  }

  render() {
    const { value, bid, snack, isValid } = this.state
    return (
      <div>
        <TextField
          autoFocus
          value={value}
          errorText = {this.state.errorText}
          floatingLabelText={ReadJSON().static_text["suggest_price"]}
          onChange={this.handleChange.bind(this)}
          onKeyDown={this.handleKeyDown.bind(this)}
        /><br/>
        <RaisedButton
          primary={true}
          disabled={!isValid}
          onClick={this.handleClick.bind(this)}
          style={{marginTop: 18}}
        >{ReadJSON().static_text["send"]}</RaisedButton>
        <SnackBar
          open={snack}
          message={InsertVariable(ReadJSON().static_text["your_suggestion"], { bid: bid }, this.props.dynamic_text["variables"])}
          autoHideDuration={3000}
          onRequestClose={this.closeSnack.bind(this)}
        />
      </div>
    )
  }
}

export default connect(mapStateToProps)(throttleProps(BidForm))
