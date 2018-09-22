import { createAction } from 'redux-act'

export const bid = createAction('BID', price => price)
export const select = createAction('SELECT', selected => selected)