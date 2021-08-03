// React
import React, { FC, useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import IStore from 'lib/redux/models'
import { IDataState } from 'storage/data/models';
import { getGeometries } from 'storage/data/duck'
import { MapContainer, TileLayer, GeoJSON, FeatureGroup } from 'react-leaflet'
import IngenuityPin from '../../assets/ingenuity-pin.svg';
import PerseverancePin from '../../assets/perseverance-pin.svg';
import { Feature } from 'geojson'
import L, { Point } from 'leaflet'
import './index.css';
import { Layout } from 'antd'
import InfoPanel from './InfoPanel';
import Loading from '../../components/UI/Loading'

const iconIngenuity = new L.Icon({
  iconUrl: IngenuityPin,
  iconRetinaUrl: IngenuityPin,
  iconAnchor: [32, 54],
  iconSize: [64, 64],
  className: 'ingenuity-icon',
});

const iconPerseverance = new L.Icon({
  iconUrl: PerseverancePin,
  iconRetinaUrl: PerseverancePin,
  iconAnchor: [32, 54],
  iconSize: [64, 64],
  className: 'perseverance-icon',
});

const useDidMountEffect = (func: () => void, deps: any[]) => {
  const didMount = useRef(false);
  useEffect(() => {
    if (didMount.current) {
      func();
    } else {
      didMount.current = true;
    }
  }, deps);
};

interface ISelectors {
  vehicle?: 'perseverance' | 'ingenuity'
  feature?: Feature
}

// Custom
import { Container } from './styled'

const Home: FC = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector<IStore, IDataState>((state) => state.data)
  const [mapRef, setMapRef] = useState<L.Map>()
  const [selectors, setSelectors] = useState<ISelectors>({})
  const featureGroupRef = useRef<L.FeatureGroup | any>()

  useDidMountEffect(() => {
    if (mapRef && !data && !loading && error === undefined) {
      dispatch(getGeometries())
    }
  }, [mapRef])

  useDidMountEffect(() => {
    if (mapRef && featureGroupRef?.current && !selectors.feature && data?.map) {
      mapRef.flyToBounds(featureGroupRef.current.getBounds())
    }
  }, [mapRef, featureGroupRef, selectors.feature, data?.map]);

  const handleFeatureEvents = {
    click: (e: L.LeafletMouseEvent) => {
      if (mapRef) {
        const center = e.sourceTarget.getCenter ? e.sourceTarget.getCenter() : e.sourceTarget.getLatLng()
        const zoom = mapRef.getZoom()
        let boundsPadding = 1000
        if (zoom > 17) {
          boundsPadding -= (zoom - 17) * 500
        }
        const bounds = center.toBounds(boundsPadding)
        const boundOpts: L.FitBoundsOptions = { paddingBottomRight: [1000, 0] }
        mapRef.flyToBounds(bounds, boundOpts)
      }
    }
  }

  const handleWaypointEvents = (vehicle: 'perseverance' | 'ingenuity') => ({
    mouseover: (e: L.LeafletMouseEvent) => {
      if (e.sourceTarget.setStyle) {
        e.sourceTarget.setStyle({ radius: 18 })
      }
    },
    mouseout: (e: L.LeafletMouseEvent) => {
      if (e.sourceTarget.setStyle) {
        e.sourceTarget.setStyle({ radius: 6 })
      }
    },
    click: (e: L.LeafletMouseEvent) => {
      setSelectors({ vehicle: vehicle, feature: e.sourceTarget.feature })
    }
  })

  const handlePathEvents = (vehicle: 'perseverance' | 'ingenuity') => ({
    mouseover: (e: L.LeafletMouseEvent) => {
      if (e.sourceTarget.setStyle) {
        e.sourceTarget.setStyle({ weight: 12, opacity: 1 })
      }
    },
    mouseout: (e: L.LeafletMouseEvent) => {
      if (e.sourceTarget.setStyle) {
        e.sourceTarget.setStyle({ weight: 3, opacity: 0.8 })
      }
    },
    click: (e: L.LeafletMouseEvent) => {
      setSelectors({ vehicle: vehicle, feature: e.sourceTarget.feature })
    }
  })

  return (
    <Container>
      {loading && <Loading />}
      <MapContainer
        center={[18.435, 77.45]} zoom={16}
        whenCreated={(map) => {
          setMapRef(map)
        }}>
        <TileLayer
          attribution='&copy; <a href="https://mars.nasa.gov/maps/location/?mission=M20">NASA</a> contributors'
          url='https://mars.nasa.gov/mmgis-maps/M20/Layers/HMC_13E10_co5_colorcorrect_rect/{z}/{x}/{y}.png'
          tms={true}
        />
        <TileLayer
          url=' https://mars.nasa.gov/mmgis-maps/M20/Layers/Jezero_Balanced_Visible_HiRISE_HRSCcolor_IHS_pansharp/{z}/{x}/{y}.png'
          tms={true}
        />
        <TileLayer
          url='https://mars.nasa.gov/mmgis-maps/M20/Layers/M20_Placenames_175k_800dpi/{z}/{x}/{y}.png'
          tms={true}
        />
        <FeatureGroup ref={featureGroupRef} eventHandlers={handleFeatureEvents}>
          {data?.map?.perseverancePath &&
            <GeoJSON
              data={data.map.perseverancePath}
              style={{
                color: "#29cc8b",
                opacity: 0.8,
              }}
              eventHandlers={handlePathEvents('perseverance')}
            />
          }
          {data?.map?.ingenuityPath &&
            <GeoJSON
              data={data.map.ingenuityPath}
              style={{
                color: "#f5b642",
                opacity: 0.8,
              }}
              eventHandlers={handlePathEvents('ingenuity')}
            />
          }
          {data?.map?.perseveranceWaypoints &&
            <GeoJSON
              data={data.map.perseveranceWaypoints}
              pointToLayer={(feature, latlng) => {
                const marker = L.circleMarker(latlng, { radius: 6, color: "#29cc8b", fillColor: "#29cc8b", fillOpacity: 0.9 })
                return marker
              }}
              eventHandlers={handleWaypointEvents('perseverance')}
            />
          }
          {data?.map?.ingenuityWaypoints &&
            <GeoJSON
              data={data.map.ingenuityWaypoints}
              pointToLayer={(feature, latlng) => {
                const marker = L.circleMarker(latlng, { radius: 6, color: "#f5b642", fillColor: "#f5b642", fillOpacity: 0.9 })
                return marker
              }}
              eventHandlers={handleWaypointEvents('ingenuity')}
            />
          }
          {data?.map?.perseveranceCurrent &&
            <GeoJSON
              data={data.map.perseveranceCurrent}
              pointToLayer={
                (geoJsonPoint, latlng) => L.marker(latlng).setIcon(iconPerseverance)
              }
              eventHandlers={handleWaypointEvents('perseverance')}
            />
          }
          {data?.map?.ingenuityCurrent &&
            <GeoJSON
              data={data.map.ingenuityCurrent}
              pointToLayer={
                (geoJsonPoint, latlng) => L.marker(latlng).setIcon(iconIngenuity)
              }
              eventHandlers={handleWaypointEvents('ingenuity')}
            />
          }
        </FeatureGroup>
      </MapContainer>
      {selectors.feature && selectors.vehicle &&
        <InfoPanel
          feature={selectors.feature}
          vehicle={selectors.vehicle}
          closeInfoPanel={() => setSelectors({})}
        />
      }
    </Container>
  )
}

export default Home
