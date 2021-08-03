// Models
import { IAction, IBaseState } from 'lib/redux/models'
import { FeatureCollection, GeoJsonProperties, Geometry, LineString, Point } from 'geojson'

// Data Interfaces 

export interface IGeoData {
  perseveranceWaypoints?: FeatureCollection<Geometry | LineString, GeoJsonProperties>
  perseverancePath?: FeatureCollection<Geometry | LineString, GeoJsonProperties>
  perseveranceCurrent?: FeatureCollection<Geometry | Point, GeoJsonProperties>
  ingenuityWaypoints?: FeatureCollection<Geometry | LineString, GeoJsonProperties>
  ingenuityPath?: FeatureCollection<Geometry | LineString, GeoJsonProperties>
  ingenuityCurrent?: FeatureCollection<Geometry | Point, GeoJsonProperties>
}

export interface ISolImages {
  engineeringCameras: {
    navigationCameraLeft: string[]
    navigationCameraRight: string[]
    frontHazcamLeft: string[]
    frontHazcamRight: string[]
    rearHazcamLeft: string[]
    rearHazcamRight: string[]
    sampleCachingSystem: string[]
  }
  scienceCameras: {
    mastcamZLeft: string[]
    mastcamZRight: string[]
    medaSkyCam: string[]
    pixlMicroContextCamera: string[]
    sherlocWatson: string[]
    sherlocContextImage: string[]
    superCamRemoteMicroImager: string[]
  }
  helicopterCameras: {
    navigationCamera: string[]
    colorCamera: string[]
  }
}

export interface IDatasetImages {
  thumbnail: {
    [sol: string]: ISolImages
  }
  image: {
    [sol: string]: ISolImages
  }
}

export interface ILineChartData {
  labels: Array<string | number>
  series: Array<
    {
      data: number[]
      type: string
    }
  >
}

export interface IChartsData {
  distanceTraveled: ILineChartData
}

// Action Interfaces

export enum IDataActionTypes {
  FAILURE = 'DATA/FAILURE',
  FULFILL = 'DATA/FULFILL',
  REQUEST = 'DATA/REQUEST',
  SUCCESS = 'DATA/SUCCESS',
  GET_GEOMETRIES = 'DATA/GET_GEOMETRIES',
  GET_CHARTS = 'DATA/GET_CHARTS'
}

export interface IDataState extends IBaseState {
  data?: {
    map?: IGeoData
    charts?: IChartsData
  }
}
