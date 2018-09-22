import React, { Component } from 'react'
import throttle from 'react-throttle-render'

import clone from 'clone'

import { Card, CardHeader, CardText } from 'material-ui/Card'

import { ReadJSON, InsertVariable, LineBreak } from '../util/ReadJSON'
import { select } from '../participant/actions' 

const BidsTable = ({ buyerBids, sellerBids, deals, highestBid, lowestBid, expanded, dynamic_text, role, money, bidded, dispatch }) => {
  const rows = []
  const length = Math.max.apply(null, [buyerBids, sellerBids, deals].map(a => a.length))
  const maxValue = highestBid ? highestBid.bid : 0
  const minValue = lowestBid ? lowestBid.bid : 0
  function get(map, key) {
    return map ? map[key] : null
  }
  function handleOnClick() {
    dispatch(select({bid: this, deal_money: this.bid }))
  }

  const tableValue = (value, type) => {
    if (type == "deal" || !value) {
      if (typeof get(value, "deal") === 'undefined') {
        return ''
      } else {
        return get(value, "deal")
      }
    }
    let bid = get(value, "bid")
    
    if ((role == "seller" && bidded && type == "buyer"  && money <= bid)
     || (role == "buyer"  && bidded && type == "seller" && money >= bid)) {
      let color = "#0000FF"
      return (<span style={{ cursor: "pointer", color: color, textDecoration: "underline" }} onClick={handleOnClick.bind(value)}>
        {bid}
      </span>)
    }

    if (typeof value === 'undefined') {
      return ''
    } else {
      return bid
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
        <table>
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

