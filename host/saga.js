import { take, put, fork, select, call } from 'redux-saga/effects'

import { submitMode, changeMode, match, nextMode, updateSetting, updateText, visit } from './actions'

import { getMode } from '../util/index'

function* changeModeSaga() {
  while (true) {
    const { payload } = yield take(`${submitMode}`)
    sendData('change_mode', payload)
    if (payload == 'description') {
      yield put(match())
    }
    yield put(changeMode(payload))
  }
}

function* nextModeSaga() {
  const modes = ["description", "auction", "result", "wait"]
  while (true) {
    yield take(`${nextMode}`)
    const mode = yield select(({ mode }) => mode)
    let next = modes[0]
    for (let i = 0; i < modes.length; i ++) {
      if (mode == modes[i]) {
        next = modes[(i + 1) % modes.length]
        break
      }
    }
    yield put(submitMode(next))
  }
}

function* matchSaga() {
  while (true) {
    yield take(`${match}`)
    sendData('match')
  }
}

function* updateSettingSaga() {
  while(true) {
    const { payload } = yield take(`${updateSetting}`)
    sendData('update_setting', payload)
  }
}

function* updateTextSaga() {
  while(true) {
    const { payload } = yield take(`${updateText}`)
    sendData('update_text', payload)
  }
}

function* visitSaga() {
  while(true) {
    yield take(`${visit}`)
    sendData('visit')
  }
}

function* saga() {
  yield fork(changeModeSaga)
  yield fork(nextModeSaga)
  yield fork(matchSaga)
  yield fork(updateSettingSaga)
  yield fork(updateTextSaga)
  yield fork(visitSaga)
}

export default saga
