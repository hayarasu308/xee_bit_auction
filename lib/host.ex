defmodule BitAuction.Host do
  def filter_data(data) do
    rule = %{
      mode: true,
      participants: "users",
      buyer_bids: {"buyerBids", true},
      seller_bids: {"sellerBids", true},
      deals: true,
      highest_bid: "highestBid",
      lowest_bid: "lowestBid",
      highest_bid: "highestBid",
      lowest_bid: "lowestBid",
      ex_type: true,
      price_base: true,
      price_inc: true,
      price_max: true,
      price_min: true,
      dynamic_text: true,
      isFirstVisit: true,
      hist: data.mode == "result",
    }
    data
    |> Transmap.transform(rule)
  end

  def start(data) do
    %{data | started: true}
  end

  def stop(data) do
    %{data | started: false}
  end

  def change_mode(data, mode) do
    %{data | mode: mode}
  end

  def match(data) do
    participants = Enum.shuffle(data.participants) |> Enum.map_reduce(0, fn {id, participant}, acc ->
      new_participant = if rem(acc, 2) == 1 do
        %{
          role: "buyer",
          money: case data.ex_type do
            "simple" -> acc * data.price_inc + data.price_base
            "real"   -> :rand.uniform(data.price_max - data.price_min + 1) +data. price_min - 1
          end,
          bidded: false,
          bid: nil,
          dealt: false,
          deal: nil,
          my_bid: nil
        }
      else
        %{
          role: "seller",
          money: case data.ex_type do
            "simple" -> acc * data.price_inc + data.price_base
            "real"   -> :rand.uniform(data.price_max - data.price_min + 1) +data. price_min - 1
          end,
          bidded: false,
          bid: nil,
          dealt: false,
          deal: nil,
          my_bid: nil
        }
      end
      {{id, new_participant}, acc + 1}
    end) |> elem(0) |> Enum.into(%{})
    %{data | participants: participants,
     buyer_bids: [], seller_bids: [], deals: [],
     highest_bid: nil, lowest_bid: nil, hist: [] }
  end

  def fetch_contents(data) do
    action = %{
      type: "RECEIVE_CONTENTS",
      payload: filter_data(data)
    }
    {:ok, %{data: data, host: %{action: action}}}
  end

  def update_setting(data, params) do
    %{data | ex_type: params["ex_type"], price_base: params["price_base"], price_inc: params["price_inc"], price_max: params["price_max"], price_min: params["price_min"]}
  end

  def update_text(data, params) do
    %{data | dynamic_text: params}
  end

  def visit(data) do
    %{ data | isFirstVisit: false }
  end
end
