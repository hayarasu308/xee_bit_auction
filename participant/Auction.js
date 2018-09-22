import React, { Component } from 'react'
import { connect } from 'react-redux'

import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card'

import Divider from 'material-ui/Divider'

import DealDialog from './DealDialog'
import BidsTable from '../components/BidsTable'
import BidForm from './BidForm'

import { ReadJSON, LineBreak, InsertVariable } from '../util/ReadJSON'

const mapStateToProps = ( {personal, buyerBids, sellerBids, deals, highestBid, lowestBid, dynamic_text} ) =>
Object.assign({}, personal, { buyerBids, sellerBids, deals, highestBid, lowestBid, dynamic_text })

const Buyer = ({ money, bidded, bid, dealt, deal, dynamic_text }) => {
  if (dealt) {
    return (
      <div>
        <DealDialog 
        deal = {deal}
        bid = {bid}
        profit = {money - deal}
        />
        <p>{InsertVariable(ReadJSON().static_text["success_text"], { deal: deal, bid: bid }, dynamic_text["variables"])}</p>
        <p>{InsertVariable(ReadJSON().static_text["benefit"], { benefit: money - deal }, dynamic_text["variables"])}</p>
      </div>
    )
  } else {
    return (
      <div>
            <p>{LineBreak(InsertVariable(dynamic_text["your_buyer"], { money: money }, dynamic_text["variables"]))}</p>
            {bidded
              ? <p>{InsertVariable(ReadJSON().static_text["buyer_suggest"], { bid: bid }, dynamic_text["variables"])}</p>
              : null
            }
            <BidForm />
      </div>
    )
  }
}

const Seller = ({ money, bidded, bid, dealt, deal, dynamic_text }) => {
  if (dealt) {
    return (
      <div>
        <DealDialog 
        deal = {deal}
        bid = {bid}
        profit = {deal - money}
        />
        <p>{InsertVariable(ReadJSON().static_text["success_text"], { deal: deal, bid: bid }, dynamic_text["variables"])}</p>
        <p>{InsertVariable(ReadJSON().static_text["benefit"], { benefit: deal - money }, dynamic_text["variables"])}</p>
      </div>
    )
  } else {
    return (
      <div>
        <p>{LineBreak(InsertVariable(dynamic_text["your_seller"], { money: money }, dynamic_text["variables"]))}</p>
        {bidded
          ? <p>{InsertVariable(ReadJSON().static_text["seller_suggest"], { bid: bid }, dynamic_text["variables"])}</p>
          : null
        }
        <BidForm />
      </div>
    )
  }
}

const Auction = ({ buyerBids, sellerBids, deals, highestBid, lowestBid, role, money, bidded, bid, dealt, deal, dynamic_text, dispatch }) => (
  <div>
    <Card>
    <CardText>
    { role == "buyer" ? <Buyer money={money} bidded={bidded} bid={bid} dealt={dealt} deal={deal} dynamic_text={dynamic_text} /> : null }
    { role == "seller" ? <Seller money={money} bidded={bidded} bid={bid} dealt={dealt} deal={deal} dynamic_text={dynamic_text} /> : null }
    { role == null ? <p>{ReadJSON().static_text["donot_join"]}</p> : null }
    </CardText>
    </Card>
    <Divider
        style={{
            marginTop: "5%",
        }}
    />
    <BidsTable
      buyerBids={buyerBids}
      sellerBids={sellerBids}
      deals={deals}
      highestBid={highestBid}
      lowestBid={lowestBid}
      expanded={true}
      dynamic_text={dynamic_text}
      role={role}
      money={bid}
      bidded={bidded}
      dispatch={dispatch}
    />
  </div>
)

export default connect(mapStateToProps)(Auction)
