defmodule BitAuction.Participant do
  use Timex
  require Logger

  def filter_data(data, id) do
    participants_rule = if data.mode == "result" do
      "users"
    else
      {"personal", %{
        id => true,
        :_spread => [[id]]
      }}
    end
    rule = %{
      user_number: "userNumber",
      mode: true,
      use_money: true,
      buyer_bids: {"buyerBids", true},
      seller_bids: {"sellerBids", true},
      deals: true,
      highest_bid: "highestBid",
      lowest_bid: "lowestBid",
      ex_type: true,
      price_base: data.mode == "result",
      price_inc: data.mode == "result",
      price_max: data.mode == "result",
      price_min: data.mode == "result",
      dynamic_text: true,
      participants: participants_rule,
    }
    data
    |> Transmap.transform(rule)
  end

  def fetch_contents(data, id) do
    action = %{
      type: "RECEIVE_CONTENTS",
      payload: filter_data(data, id)
    }
    {:ok, %{data: data, participant: %{id => %{action: action}}}}
  end

  def bid(data, id, bid) do
    old = data
    participant = Map.get(data.participants, id)
    case participant do
      # Seller
      %{role: "seller", bidded: bidded, bid: previous_bid, money: money, dealt: false} when not is_nil(money) and bid >= money ->
        remove_first(data, id, previous_bid, :lowest_bid, :seller_bids, &set_lowest_bid/1)
          |> update_bid(id, bid)
          |> bid(:lowest_bid, :seller_bids, id, bid, previous_bid, "NEW_SELLER_BIDS", fn most_bid, bid ->
              bid < most_bid
             end)
      # Buyer
      %{role: "buyer", bidded: bidded, bid: previous_bid, money: money, dealt: false} when not is_nil(money) and bid <= money ->
        remove_first(data, id, previous_bid, :highest_bid, :buyer_bids, &set_highest_bid/1)
          |> update_bid(id, bid)
          |> bid(:highest_bid, :buyer_bids, id, bid, previous_bid, "NEW_BUYER_BIDS", fn most_bid, bid ->
               bid > most_bid
             end)
    end
  end

  defp update_bid(data, id, bid) do
    update_in(data, [:participants, id], fn participant ->
      %{participant | bidded: true, bid: bid}
    end)
  end

  def remove_first(data, id, previous_bid, bid_key, key, set) do
    if previous_bid != nil do
      data = %{data | key => Enum.filter(data[key], fn map ->
        map.participant_id != id
      end)}   
      if not is_nil(data[bid_key]) and data[bid_key].participant_id == id do
        set.(data)
      else
        data
      end
    else
      data
    end
  end

  def bid(data, bid_key, key, id, bid, previous_bid, action, func) do
    new = new_bid(data.counter, id, bid)
    bids = [new_bid(data.counter, id, bid) | data[key]]
    most_bid = if is_nil(data[bid_key]) or func.(data[bid_key].bid, bid) do
      new
    else
      data[bid_key]
    end
#    new_h = new_hist(id, bid, false, nil)
    data = %{data | key => bids, bid_key => most_bid}
    data
    |> Map.update!(:counter, fn x -> x + 1 end)
    |> Map.put(:hist, data.hist ++ [new_hist(id, bid, "bid", nil, Timex.format!(Timex.now(), "{ISO:Extended}"))])
    |> put_in([:participants, id, :my_bid], new)
  end

  def new_bid(id, participant_id, bid) do
    %{
      bid: bid,
      id: id,
      participant_id: participant_id
    }
  end

  def select(data, id, selected) do
    %{ "bid" =>  %{ "bid" => bid, "id" => bid_id, "participant_id" => id2 }, "deal_money" => deal_money} = selected
    partner_bid = %{bid: bid, id: bid_id, participant_id: id2}
    participant = Map.get(data.participants, id)
    case participant do
      # Seller
      %{role: "seller", bidded: bidded, bid: previous_bid, money: money, my_bid: my_bid, dealt: false} when not is_nil(money) and not is_nil(deal_money) ->
        if money <= deal_money do
          deal(data, id, :seller_bids, :buyer_bids, my_bid, partner_bid, deal_money)
        else
          data
        end
      # Buyer
      %{role: "buyer", bidded: bidded, bid: previous_bid, money: money, my_bid: my_bid, dealt: false} when not is_nil(money) and not is_nil(deal_money) ->
        if money >= deal_money do
          deal(data, id, :buyer_bids, :seller_bids, my_bid, partner_bid, deal_money)
        else
          data
        end
    end
  end

  def deal(data, id, my_key, partner_key, my_bid, partner_bid, deal_money) do
    now = Timex.format!(Timex.now(), "{ISO:Extended}")
    id2 = partner_bid.participant_id
    dealt = get_in(data,[:participants, id, :dealt]) or get_in(data,[:participants, id2, :dealt])
    if !dealt do
      deals = [new_deal(data.counter, deal_money, id, id2, now) | data.deals]
      my_bids = List.delete(data[my_key], my_bid)
      partner_bids = List.delete(data[partner_key], partner_bid)
      data = %{data | :deals => deals, partner_key => partner_bids, my_key => my_bids}
            |> dealt(id, id2, deal_money)
            |> Map.update!(:counter, fn x -> x + 1 end)
      data = data |> set_highest_bid |> set_lowest_bid
      data |> Map.put(:hist, data.hist ++ [new_hist(id, deal_money, "deal", id2, now)])
    else
      data
    end
  end

  def new_deal(id, bid, participant_id, participant_id2, now) do
    %{
      id: id,
      deal: bid,
      time: now,
      participant_id: participant_id,
      participant_id2: participant_id2,
    }
  end

  def dealt(data, id1, id2, money) do
    data
    |> update_in([:participants, id1], fn participant ->
          %{participant | bidded: false, dealt: true, deal: money}
    end)
    |> update_in([:participants, id2], fn participant ->
          %{participant | bidded: false, dealt: true, deal: money}
    end)
  end

  def new_hist(id1, bid, status, id2, now) do
    %{ id1: id1, price: bid, status: status, id2: id2, time: now }
  end

  def set_highest_bid(%{buyer_bids: []} = data) do
    %{ data | highest_bid: nil }
  end
  def set_highest_bid(%{buyer_bids: bids} = data) do
    %{ data | highest_bid: Enum.max_by(bids, &(&1.bid)) }
  end

  def set_lowest_bid(%{seller_bids: []} = data) do
    %{ data | lowest_bid: nil }
  end
  def set_lowest_bid(%{seller_bids: bids} = data) do
    %{ data | lowest_bid: Enum.min_by(bids, &(&1.bid)) }
  end
end
