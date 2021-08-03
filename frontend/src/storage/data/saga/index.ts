// Libraries
import { SagaIterator } from '@redux-saga/types'
import { all, put, call, takeLatest } from 'redux-saga/effects'
import { getGeometriesService } from 'services/data';
import { Types, actions } from 'storage/data/duck';
import { IDatasetImages, ILineChartData } from 'storage/data/models';
import { FeatureCollection, Feature } from 'geojson';

const { failure, fulfill, request, success } = actions

function getSolIndex(feature: Feature): string {
  if (feature?.properties?.sol) {
    return feature.properties.sol as string
  } else {
    return ""
  }
}

function addImagesToProperties(images: IDatasetImages, geodata: FeatureCollection): FeatureCollection {
  return {
    ...geodata,
    features: geodata.features.map(
      feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          thumbnail: images.thumbnail[getSolIndex(feature)],
          image: images.image[getSolIndex(feature)]
        }
      })
    )
  }
}

export function* getGeometriesSaga() {
  yield put(request())
  try {
    const perseveranceWaypoints: FeatureCollection = yield call(getGeometriesService, "perseverance-waypoints.json")
    const perseverancePath: FeatureCollection = yield call(getGeometriesService, "perseverance-path.json")
    const perseveranceCurrent: FeatureCollection = yield call(getGeometriesService, "perseverance-current.json")
    const ingenuityWaypoints: FeatureCollection = yield call(getGeometriesService, "ingenuity-waypoints.json")
    const ingenuityPath: FeatureCollection = yield call(getGeometriesService, "ingenuity-path.json")
    const ingenuityCurrent: FeatureCollection = yield call(getGeometriesService, "ingenuity-current.json")
    if (perseveranceWaypoints && perseveranceCurrent && ingenuityWaypoints && ingenuityCurrent && perseverancePath && ingenuityPath) {
      yield put(success({
        data: {
          map: {
            perseveranceWaypoints: perseveranceWaypoints,
            perseverancePath: perseverancePath,
            perseveranceCurrent: perseveranceCurrent,
            ingenuityWaypoints: ingenuityWaypoints,
            ingenuityPath: ingenuityPath,
            ingenuityCurrent: ingenuityCurrent,
          },
        },
        error: undefined
      }))
    }
  } catch (error) {
    yield put(failure(error.message))
  } finally {
    yield put(fulfill())
  }
}

export default function* dataSaga(): SagaIterator {
  yield all([
    takeLatest(Types.GET_GEOMETRIES, getGeometriesSaga)
  ])
}
