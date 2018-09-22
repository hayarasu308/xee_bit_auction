defmodule BitAuction do
  use XeeThemeScript
  require Logger

  use Timex

  alias BitAuction.Host
  alias BitAuction.Participant

  @modes ["wait", "description", "auction", "result"]

  # Callbacks
  def script_type do
    :message
  end

  def install, do: nil

  def init do
    {:ok, %{data: %{
       counter: 0, # For create unique IDs
       mode: "wait",
       participants: %{},
       buyer_bids: [],
       highest_bid: nil,
       seller_bids: [],
       lowest_bid: nil,
       deals: [],
       started: false,
       ex_type: "simple",
       price_base: 100,
       price_inc: 100,
       price_max: 20,
       price_min: 10,
       user_number: 0,
       dynamic_text: nil,
       isFirstVisit: true,
       hist: [],
     }}}
  end

  def join(%{participants: participants} = data, id) do
    if not Map.has_key?(participants, id) do
      participant = %{role: nil, bidded: false, money: nil, bid: nil, dealt: false, deal: nil, my_bit: nil}
      participants = Map.put(participants, id, participant)
      new = %{data | participants: participants}
      new = Map.update!(new, :user_number, &(&1+1))
      wrap_result(data, new)
    else
      wrap_result(data, data)
    end
  end

  def handle_received(data, %{"action" => action, "params" => params}) do
    new = case action do
      "start" -> Host.start(data)
      "stop" -> Host.stop(data)
      "change_mode" -> Host.change_mode(data, params)
      "match" -> Host.match(data)
      "fetch_contents" -> Host.fetch_contents(data)
      "update_setting" -> Host.update_setting(data, params)
      "update_text" -> Host.update_text(data, params)
      "visit" -> Host.visit(data)
    end
    wrap_result(data, new)
  end

  def handle_received(data, %{"action" => action, "params" => params}, id) do
    new = case action do
      "fetch_contents" -> Participant.fetch_contents(data, id)
      "bid" -> Participant.bid(data, id, params)
      "select" -> Participant.select(data, id, params)
    end
    wrap_result(data, new)
  end

  def compute_diff(old, %{data: new} = result) do
    import Participant, only: [filter_data: 2]
    import Host, only: [filter_data: 1]
    host = Map.get(result, :host, %{})
    participant = Map.get(result, :participant, %{})
    participant_tasks = Enum.map(old.participants, fn {id, _} ->
      {id, Task.async(fn -> JsonDiffEx.diff(filter_data(old, id), filter_data(new, id)) end)}
    end)
    host_task = Task.async(fn -> JsonDiffEx.diff(filter_data(old), filter_data(new)) end)
    host_diff = Task.await(host_task)
    participant_diff = Enum.map(participant_tasks, fn {id, task} -> {id, %{diff: Task.await(task)}} end)
                        |> Enum.filter(fn {_, map} -> map_size(map.diff) != 0 end)
                        |> Enum.into(%{})
    host = Map.merge(host, %{diff: host_diff})
    host = if map_size(host.diff) == 0 do
      Map.delete(host, :diff)
    else
      host
    end
    host = if map_size(host) == 0 do
      nil
    else
      host
    end
    participant = Map.merge(participant, participant_diff, fn _k, v1, v2 ->
      Map.merge(v1, v2)
    end)
    %{data: new, host: host, participant: participant}
  end

  def wrap_result(old, {:ok, result}) do
    {:ok, compute_diff(old, result)}
  end

  def wrap_result(old, new) do
    {:ok, compute_diff(old, %{data: new})}
  end
end
