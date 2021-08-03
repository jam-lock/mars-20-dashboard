// import api from '../../lib/axios/api'
// Mock api
import axios, { AxiosInstance } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: window.location.origin,
  timeout: 30000,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getGeometriesService = async (file: string): Promise<any> => {
  const response = await api.get(`/mars-20/api/geojson/${file}`)
  return response.data
};