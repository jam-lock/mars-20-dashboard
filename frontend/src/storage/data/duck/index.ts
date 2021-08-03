// Models
import { IAction } from 'lib/redux/models'
import { IChartsData, IDataActionTypes, IDataState, IGeoData, ILineChartData } from '../models'

// ACTION TYPES
export const Types = {
  FAILURE: IDataActionTypes.FAILURE,
  FULFILL: IDataActionTypes.FULFILL,
  REQUEST: IDataActionTypes.REQUEST,
  SUCCESS: IDataActionTypes.SUCCESS,
  GET_GEOMETRIES: IDataActionTypes.GET_GEOMETRIES,
  GET_CHARTS: IDataActionTypes.GET_CHARTS,
}

// INITIAL STATE
const initialState: IDataState = {}

// REDUCER
export default (
  state: IDataState = initialState,
  action?: IAction,
): IDataState => {
  switch (action?.type) {
    case Types.FAILURE:
      return {
        ...state,
        error: action.payload,
      }
    case Types.FULFILL:
      return {
        ...state,
        loading: false,
      }
    case Types.REQUEST:
      return {
        ...state,
        loading: true,
      }
    case Types.SUCCESS:
      return {
        ...state,
        ...action?.payload,
        data: {
          ...state.data,
          ...action?.payload?.data
        }
      }
    default:
      return state
  }
}

// ACTIONS

export const failure = (payload: string) => {
  return {
    type: Types.FAILURE,
    payload,
  }
}

export const fulfill = () => {
  return {
    type: Types.FULFILL,
  }
}

export const request = () => {
  return {
    type: Types.REQUEST,
  }
}

export const success = (payload: IDataState) => {
  return {
    type: Types.SUCCESS,
    payload,
  }
}

export const getGeometries = (): IAction => ({
  type: Types.GET_GEOMETRIES,
})

export const getCharts = (): IAction => ({
  type: Types.GET_CHARTS,
})

export const actions = {
  failure,
  fulfill,
  request,
  success,
  getGeometries,
  getCharts,
}
