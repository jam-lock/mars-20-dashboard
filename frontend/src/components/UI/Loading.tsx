import React, { FC } from 'react'
import { Spin } from 'antd'
import './Loading.css';


const Loading: FC = () => {
    return (
      <div className="loading">
        <Spin />
      </div>
    )
  }

  export default Loading