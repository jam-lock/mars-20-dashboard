// React
import React, { FC, ReactElement, useState } from 'react'
import { useSelector } from 'react-redux'
import IStore from 'lib/redux/models'
import { IDataState } from 'storage/data/models';
import './InfoPanel.css';
import { Collapse, Row, Col, Typography, Image, Button, Card, Spin } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { Feature, GeoJsonProperties } from 'geojson';
import Loading from '../../components/UI/Loading'
import ReactECharts from 'echarts-for-react';
import { FeatureCollection } from 'geojson'
import { PlusOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Title } = Typography;

interface TabPaneProps {
  tab: string
  key: string
  children: ReactElement | string
}

interface TabsProps {
  children: ReactElement[]
}

const TabPane: FC<TabPaneProps> = (props: TabPaneProps) => {
  return (
    <div className="tab-content">
      {props.children}
    </div>
  )
}

const Tabs: FC<TabsProps> = (props: TabsProps) => {
  const [selectedTab, selectTab] = useState<string | number | null>(props.children[0].key)
  return (
    <div className="tabs">
      <div className="tabs-header">
        {props.children.map(child =>
          <Button
            className="select-tab"
            type={selectedTab === child.key ? 'primary' : 'default'}
            key={child.key}
            onClick={() => selectTab(child.key)}
          >
            {child.props.tab}
          </Button>
        )}
      </div>
      <div className="tab-body">
        {props.children.map(
          child => child.key === selectedTab && child
        )}
      </div>
    </div>
  )
}

interface CamImagesProps {
  images: string[]
  sol: string
}

const CamImages: FC<CamImagesProps> = (props: CamImagesProps) => {
  const batchSize = 23
  const [maxImages, setMaxImages] = useState(batchSize);
  return (
    <Row gutter={[6, 6]} className="cam-images">
      <Image.PreviewGroup>
        {
          props.images.length > 0 && props.images.length <= maxImages ?
            props.images.map(
              (image: string, index: number) =>
                <Col key={index} span={6} md={3} >
                  <Card className="image">
                    <Image
                      src={image}
                      alt={props.sol}
                      preview={{
                        src: image.replace("_320.jpg", ".png"),
                      }}
                      placeholder={<Loading />}
                    />
                  </Card>
                </Col>
            ) : props.images.length >= maxImages ?
              <React.Fragment>
                {props.images.filter((image, index) => index < maxImages).map(
                  (image: string, index: number) =>
                    <Col key={index} span={6} md={3}>
                      <Card className="image">
                        <Image
                          src={image}
                          alt={props.sol}
                          preview={{
                            src: image.replace("_320.jpg", ".png")
                          }}
                          placeholder={<Loading />}
                        />
                      </Card>
                    </Col>
                )}
                <Col span={6} md={3}>
                  <Card className="image">
                    <Button
                      onClick={() => setMaxImages(maxImages + batchSize + 1)}
                      shape="circle"
                      icon={<PlusOutlined />}
                    />
                  </Card>
                </Col>
              </React.Fragment>
              : <Typography>No images</Typography>
        }
      </Image.PreviewGroup>
    </Row>
  )
}

function getChartOptions(geodata: FeatureCollection, label: string, value: string) {
  return {
    grid: {
      top: 24,
      bottom: 24,
      right: 16,
    },
    xAxis: {
      type: 'category',
      data: geodata.features.map(feature => feature.properties ? feature.properties[label] : '')
    },
    yAxis: {
      min: 'dataMin',
      max: 'dataMax',
      type: 'value'
    },
    series: [{
      data: geodata.features.map(feature => feature.properties ? feature.properties[value] : 0),
      type: 'line'
    }]
  };
}

interface IngenuityInfoPanelProps {
  feature: Feature
}

const IngenuityInfoPanel: FC<IngenuityInfoPanelProps> = (props: IngenuityInfoPanelProps) => {
  const { data } = useSelector<IStore, IDataState>((state) => state.data)
  return (
    <Tabs>
      <TabPane tab="Images" key="images">
        <>
          <div className="gif">
            <img alt={props.feature.properties?.sol} src={`${window.location.origin}/mars-20/api/gifs/${props.feature.properties?.sol}.gif`} />
          </div>
          <Collapse defaultActiveKey="helicopterCameras">
            <Panel header="Helicopter Cameras" key="helicopterCameras">
              <Collapse defaultActiveKey="navigationCamera">
                <Panel header="Navigation Camera" key="navigationCamera"
                >
                  <CamImages
                    images={props.feature.properties?.images.helicopterCameras.navigationCamera}
                    sol={props.feature.properties?.sol}
                  />
                </Panel>
                <Panel header="Color Camera" key="ColorCamera">
                  <CamImages
                    images={props.feature.properties?.images.helicopterCameras.colorCamera}
                    sol={props.feature.properties?.sol}
                  />
                </Panel>
              </Collapse>
            </Panel>
          </Collapse>
        </>
      </TabPane>
      <TabPane tab="Data" key="data">
        <div className="data-charts">
          {data?.map?.ingenuityWaypoints && data.map.ingenuityPath &&
            <React.Fragment>
              <Title level={3}>Distance per flight</Title>
              <ReactECharts option={getChartOptions(data.map.ingenuityPath, 'Flight', 'length')} />
              <Title level={3}>Latitude</Title>
              <ReactECharts option={getChartOptions(data.map.ingenuityWaypoints, 'sol', 'lat')} />
              <Title level={3}>Longitude</Title>
              <ReactECharts option={getChartOptions(data.map.ingenuityWaypoints, 'sol', 'lon')} />
              <Title level={3}>Elevation Geoid</Title>
              <ReactECharts option={getChartOptions(data.map.ingenuityWaypoints, 'sol', 'elev_geoid')} />
              <Title level={3}>Easting</Title>
              <ReactECharts option={getChartOptions(data.map.ingenuityWaypoints, 'sol', 'easting')} />
              <Title level={3}>Northing</Title>
              <ReactECharts option={getChartOptions(data.map.ingenuityWaypoints, 'sol', 'northing')} />
            </React.Fragment>
          }
        </div>
      </TabPane>
    </Tabs>
  )
}

interface PerseveranceInfoPanelProps {
  feature: Feature
}

const PerseveranceInfoPanel: FC<PerseveranceInfoPanelProps> = (props: PerseveranceInfoPanelProps) => {
  const { data } = useSelector<IStore, IDataState>((state) => state.data)
  return (
    <Tabs>
      <TabPane tab="Images" key="images">
        <Collapse defaultActiveKey="engineeringCameras">
          <Panel header="Engineering Cameras" key="engineeringCameras">
            <Collapse defaultActiveKey="navcamLeft">
              <Panel header="Navcam Left" key="navcamLeft">
                <CamImages
                  images={props.feature.properties?.images.engineeringCameras.navigationCameraLeft}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="Navcam Right" key="navcamRight">
                <CamImages
                  images={props.feature.properties?.images.engineeringCameras.navigationCameraRight}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="Front Hazcam Left" key="frontHazcamLeft">
                <CamImages
                  images={props.feature.properties?.images.engineeringCameras.frontHazcamLeft}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="Front Hazcam Right" key="frontHazcamRight">
                <CamImages
                  images={props.feature.properties?.images.engineeringCameras.frontHazcamRight}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="Rear Hazcam Left" key="rearHazcamLeft">
                <CamImages
                  images={props.feature.properties?.images.engineeringCameras.rearHazcamLeft}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="Rear Hazcam Right" key="rearHazcamRight">
                <CamImages
                  images={props.feature.properties?.images.engineeringCameras.rearHazcamRight}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="Sample Caching System" key="sampleCachingSystem">
                <CamImages
                  images={props.feature.properties?.images.engineeringCameras.sampleCachingSystem}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
            </Collapse>
          </Panel>
          <Panel header="Science Cameras" key="scienceCameras">
            <Collapse defaultActiveKey="mastcamZLeft">
              <Panel header="Mastcam-Z Left" key="mastcamZLeft">
                <CamImages
                  images={props.feature.properties?.images.scienceCameras.mastcamZLeft}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="Mastcam-Z Right" key="mastcamZRight">
                <CamImages
                  images={props.feature.properties?.images.scienceCameras.mastcamZRight}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="MEDA SkyCam" key="medaSkyCam">
                <CamImages
                  images={props.feature.properties?.images.scienceCameras.medaSkyCam}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="PIXL Micro Context Camera" key="pixlMicroContextCamera">
                <CamImages
                  images={props.feature.properties?.images.scienceCameras.pixlMicroContextCamera}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="Sherloc Watson" key="sherlocWatson">
                <CamImages
                  images={props.feature.properties?.images.scienceCameras.sherlocWatson}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="Sherloc Context Image" key="sherlocContextImage">
                <CamImages
                  images={props.feature.properties?.images.scienceCameras.sherlocContextImage}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
              <Panel header="Super Cam Remote Micro Imager" key="superCamRemoteMicroImager">
                <CamImages
                  images={props.feature.properties?.images.scienceCameras.superCamRemoteMicroImager}
                  sol={props.feature.properties?.sol}
                />
              </Panel>
            </Collapse>
          </Panel>
        </Collapse>
      </TabPane>
      <TabPane tab="Data" key="data">
        <div className="data-charts">
          {data?.map?.perseveranceWaypoints &&
            <React.Fragment>
              <Title level={3}>Total distance (m)</Title>
              <ReactECharts option={getChartOptions(data.map.perseveranceWaypoints, 'sol', 'dist_total')} />
              <Title level={3}>Distance per sol (m)</Title>
              <ReactECharts option={getChartOptions(data.map.perseveranceWaypoints, 'sol', 'dist_m')} />
              <Title level={3}>Pitch</Title>
              <ReactECharts option={getChartOptions(data.map.perseveranceWaypoints, 'sol', 'pitch')} />
              <Title level={3}>Roll</Title>
              <ReactECharts option={getChartOptions(data.map.perseveranceWaypoints, 'sol', 'roll')} />
              <Title level={3}>Yaw</Title>
              <ReactECharts option={getChartOptions(data.map.perseveranceWaypoints, 'sol', 'yaw')} />
              <Title level={3}>Yaw (rad)</Title>
              <ReactECharts option={getChartOptions(data.map.perseveranceWaypoints, 'sol', 'yaw_rad')} />
              <Title level={3}>Tilt</Title>
              <ReactECharts option={getChartOptions(data.map.perseveranceWaypoints, 'sol', 'tilt')} />
              <Title level={3}>Elevation Geoid</Title>
              <ReactECharts option={getChartOptions(data.map.perseveranceWaypoints, 'sol', 'elev_geoid')} />
              <Title level={3}>Elevation Radii</Title>
              <ReactECharts option={getChartOptions(data.map.perseveranceWaypoints, 'sol', 'elev_radii')} />
              <Title level={3}>Easting</Title>
              <ReactECharts option={getChartOptions(data.map.perseveranceWaypoints, 'sol', 'easting')} />
              <Title level={3}>Northing</Title>
              <ReactECharts option={getChartOptions(data.map.perseveranceWaypoints, 'sol', 'northing')} />
            </React.Fragment>
          }
        </div>
      </TabPane>
    </Tabs>
  )
}


interface InfoPanelProps {
  feature: Feature | any
  vehicle: 'perseverance' | 'ingenuity'
  closeInfoPanel: () => void
}

const InfoPanel: FC<InfoPanelProps> = (props: InfoPanelProps) => {
  const isPoint = () => props.feature.geometry.type === 'Point'
  const titleText = isPoint() ?
    `Sol ${props.feature.properties?.sol}` :
    !props.feature.properties?.sol ?
      `From Sol ${props.feature.properties?.initSol} to Sol ${props.feature.properties?.endSol}` :
      `Sol ${props.feature.properties?.sol}`
  const coordinatesText = isPoint() ?
    `[${props.feature.properties?.lat}, ${props.feature.properties?.lon}]` :
    `[${props.feature.geometry?.coordinates[0][1]}, ${props.feature.geometry?.coordinates[0][0]}] -> [${props.feature.geometry?.coordinates[1][1]}, ${props.feature.geometry?.coordinates[1][0]}]`
  return (
    <div className="info-panel">
      <Row className="panel-header" justify="center" align="middle">
        <Title level={1}>{titleText}</Title>
        <Typography>{coordinatesText}</Typography>
        <Button
          className="close-info-panel"
          shape="circle"
          icon={<CloseOutlined />}
          onClick={props.closeInfoPanel}
          ghost
        />
      </Row>
      <Row className="panel-body" justify="center" align="top">
        {props.vehicle === "perseverance" && <PerseveranceInfoPanel feature={props.feature} />}
        {props.vehicle === "ingenuity" && <IngenuityInfoPanel feature={props.feature} />}
      </Row>

    </div>
  )
}

export default InfoPanel
