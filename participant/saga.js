import { take, put, fork } from 'redux-saga/effects'

import { bid, select } from './actions'

function* bidSaga() {
  while (true) {
    const { payload } = yield take(`${bid}`)
    sendData('bid', payload)
  }
}

function* selectSaga() {
  while (true) {
    const { payload } = yield take(`${select}`)
    sendData('select', payload)
  }
}

function* saga() {
  yield fork(bidSaga)
  yield fork(selectSaga)
}

export default saga
