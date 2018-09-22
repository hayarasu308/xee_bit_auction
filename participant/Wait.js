import React, { Component } from 'react'
import { connect } from 'react-redux'

import {Card, CardActions, CardText, CardTitle } from 'material-ui/Card'
import CircularProgress from 'material-ui/CircularProgress'

const mapStateToProps = ({ userNumber }) => ({ userNumber })

import { ReadJSON, InsertVariable } from '../util/ReadJSON'

class Wait extends Component {
    render() {
        const { userNumber } = this.props
        return (
            <div>
                <Card>
                    <CardTitle title={ReadJSON().static_text["title"]} subtitle={ReadJSON().static_text["waiting"][0]}/>
                    <CardText>
                        <p>{ReadJSON().static_text["waiting"][1]}</p>
                        <p>{ReadJSON().static_text["waiting"][2]}</p>
                        <p>{InsertVariable(ReadJSON().static_text["waiting"][3], { user_number: userNumber})}</p>
                    </CardText>
                    <div style={{textAlign: "center"}}>
                        <CircularProgress size={140} thickness={5.0}/>
                    </div>
                </Card>
            </div>
        )
    }
}
export default connect(mapStateToProps)(Wait)
