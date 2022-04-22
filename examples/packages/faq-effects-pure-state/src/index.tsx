import '@abraham/reflection'
import 'antd/dist/antd.css'
import { initDevtool } from '@sigi/devtool'
import { useModule } from '@sigi/react'
import { Modal } from 'antd'
import React, { useState, useCallback } from 'react'
import { createRoot } from 'react-dom/client'

import { AppModule } from './app.module'

function App() {
  const [{ list }, dispatcher] = useModule(AppModule)
  const [modalVisible, setModalVisible] = useState(true)
  const onFetchList = useCallback(() => {
    setModalVisible(true)
    dispatcher.fetchList()
  }, [dispatcher, setModalVisible])
  const onClose = useCallback(() => {
    setModalVisible(false)
  }, [setModalVisible])

  const loading = !list ? <div>loading</div> : null

  const title =
    list instanceof Error ? (
      <>
        <Modal title="fail" visible={modalVisible} onOk={onClose} onCancel={onClose}>
          <p>{list.message}</p>
        </Modal>
        <h1>{list.message}</h1>
      </>
    ) : (
      <h1>Hello CodeSandbox</h1>
    )

  const listNodes = Array.isArray(list) ? list.map((value) => <li key={value}>{value}</li>) : null
  return (
    <div>
      {title}
      <button onClick={onFetchList}>fetchList</button>
      <button onClick={dispatcher.cancel}>cancel</button>
      {loading}
      <ul>{listNodes}</ul>
    </div>
  )
}

const rootElement = document.getElementById('app')!
createRoot(rootElement).render(<App />)

initDevtool()
