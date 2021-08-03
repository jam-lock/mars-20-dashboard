// React
import React, { FC } from 'react'

// Libraries
import { Provider } from 'react-redux'

// Custom
import './App.css'
import Routes from './routes'
import store from 'lib/redux'
import 'antd/dist/antd.css';

const App: FC = () => {
  return (
    <Provider store={store}>
      <Routes />
    </Provider>
  )
}

export default App
