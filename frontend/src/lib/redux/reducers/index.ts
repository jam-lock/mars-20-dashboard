// Models
import IStore, { IAction } from 'lib/redux/models'

// Libraries
import { combineReducers, Reducer } from 'redux'

// Custom
import dataReducer from 'storage/data/duck'

const appReducer: Reducer<IStore, IAction> = combineReducers({
  data: dataReducer,
})

export default appReducer
