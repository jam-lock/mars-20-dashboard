// Libraries
import { SagaIterator } from 'redux-saga'
import { all, fork } from 'redux-saga/effects'

// Custom
import dataSagas from 'storage/data/saga'

export default function* rootSaga(): SagaIterator {
  yield all([fork(dataSagas)])
}
