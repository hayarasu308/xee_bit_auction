import React, { Component } from 'react'
import throttle from 'react-throttle-render'

import clone from 'clone'

import { Card, CardHeader, CardText } from 'material-ui/Card'
import RaisedButton from 'material-ui/RaisedButton'

import { ReadJSON, InsertVariable, LineBreak } from '../util/ReadJSON'
import { select } from '../participant/actions' 

const BidsTable = ({ buyerBids, sellerBids, deals, highestBid, lowestBid, expanded, dynamic_text, role, money, bidded, dispatch, use_money, deal, dealt }) => {
  const rows = []
  const length = Math.max.apply(null, [buyerBids, sellerBids, deals].map(a => a.length))
  const maxValue = highestBid ? highestBid.bid : 0
  const minValue = lowestBid ? lowestBid.bid : 0
  let bidMoneyEqFlag = true
  let dealMoneyEqFlag = true
  function get(map, key) {
    return map ? map[key] : null
  }
  function handleOnClick() {
    let deal_money = null
    if (use_money == "suggested") deal_money = this.bid
    else if (use_money == "suggest") deal_money = money 
    dispatch(select({bid: this, deal_money: deal_money }))
  }

  const tableValue = (value, type) => {
    if (type == "deal" || !value) {
      if (!get(value, "deal")) {
        return null
      } else {
        let color = "#000000"
        if (deal == get(value, "deal") && dealMoneyEqFlag) {
          dealMoneyEqFlag = false
          color = "#FF0000"
        }
        return <RaisedButton
          label={get(value, "deal")}
          disabled={true}
          disabledBackgroundColor={"#FFFFFF"}
          disabledLabelColor={color}
          style={{boxShadow: "rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px"}}
        />
      }
    }
    let bid = get(value, "bid")
    
    if ((role == "seller" && bidded && type == "buyer"  && money <= bid)
     || (role == "buyer"  && bidded && type == "seller" && money >= bid)) {
      return (<RaisedButton
        primary={true}
        onClick={handleOnClick.bind(value)}
        label={bid}
      />)
    }

    if (role == type && money == bid && bidMoneyEqFlag && !dealt) {
      bidMoneyEqFlag = false
      return (<RaisedButton
        disabled={true}
        label={bid}
        disabledLabelColor={"#FF8888"}
      />)
    }

    if (typeof value === 'undefined') {
      return null
    } else if (role == "host") {
      return (<RaisedButton
          label={bid}
          disabled={true}
          disabledBackgroundColor={"#FFFFFF"}
          disabledLabelColor={"#000000"}
          style={{boxShadow: "rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px"}}
        />)
    }
    else {
      return (<RaisedButton
        disabled={true}
        label={bid}
      />)
    }
  }

  buyerBids = clone(buyerBids).sort((a, b) => b.bid - a.bid)
  sellerBids = clone(sellerBids).sort((a, b) => a.bid - b.bid)

  for (let i = 0; i < length; i ++) {
    rows.push(
      <tr key={`${get(buyerBids[i], 'id')}-${get(sellerBids[i], 'id')}-${get(deals[i], 'id')}`}>
        <td>{tableValue(buyerBids[i], "buyer")}</td>
        <td>{tableValue(sellerBids[i], "seller")}</td>
        <td>{tableValue(deals[i], "deal")}</td>
      </tr>
    )
  }
  return (
    <Card
      initiallyExpanded={expanded}
    >
      <CardHeader
        title={
          <span>{LineBreak(InsertVariable(ReadJSON().static_text["table_title"], { buyer_num: buyerBids.length, seller_num: sellerBids.length, deals_num: deals.length, max_value: maxValue, min_value: minValue}, dynamic_text["variables"]))}</span>
        }
        actAsExpander={true}
        showExpandableButton={true}
      />
      <CardText expandable={true}>
        <table
          style={{tableLayout:"fixed"}}
        >
          <thead>
            <tr>
              <th>{dynamic_text["variables"]["buying_price"]}</th>
              <th>{dynamic_text["variables"]["selling_price"]}</th>
              <th>{InsertVariable(ReadJSON().static_text["success_price"], {}, dynamic_text["variables"])}</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </CardText>
    </Card>
  )
}

export default throttle(BidsTable, 500)

