import { renderToString } from 'react-dom/server'

import { StateToPersist } from '../state-to-persist'

describe('StateToPersist specs', () => {
  function createStateToPersist<T>(data?: T, actionsToRetry = {}) {
    return new StateToPersist(data, actionsToRetry)
  }

  const renderDocumentJSX = (child: React.ReactChild | null = null) => (
    <html>
      <head>
        <link rel="stylesheet" href="https://sigi.how/style.css" />
      </head>
      <body>
        <div id="app">
          <img src="https://sigi.how/image.jpeg" alt="" />
        </div>
        {child}
      </body>
    </html>
  )

  it('empty data should return empty string', () => {
    const state = createStateToPersist()
    expect(state.extractToScriptString()).toBe('')
  })

  it('should be able to extractScriptString without tag', () => {
    const state = createStateToPersist({ bar: 'baz' })
    expect(state.extractToScriptString(false)).toMatchSnapshot()
  })

  it('empty data should return original string', () => {
    const state = createStateToPersist()
    const originalString = renderToString(renderDocumentJSX())
    expect(state.renderToDocument(originalString)).toBe(originalString)
  })

  it('should render to document', () => {
    const state = createStateToPersist({ foo: 1 })
    expect(state.renderToDocument(renderToString(renderDocumentJSX()))).toMatchSnapshot()
  })

  it('should return original string if contains non </body> tag', () => {
    const state = createStateToPersist({ foo: 1 })
    const jsx = (
      <div>
        <span>1</span>
      </div>
    )
    expect(state.renderToDocument(renderToString(jsx))).toBe(renderToString(jsx))
  })

  it('should prevent xss', () => {
    const state = createStateToPersist({
      xss: '</script><script>alert(1);</script>',
    })
    expect(state.renderToDocument(renderToString(renderDocumentJSX()))).toMatchSnapshot()
  })

  it('should return null in renderToJSX if data is null/undefined', () => {
    const state = createStateToPersist()
    expect(state.renderToJSX()).toBeNull()
  })

  it('should be able to renderToJSX', () => {
    const state = createStateToPersist({ foo: 1 })
    expect(renderToString(renderDocumentJSX(state.renderToJSX()))).toMatchSnapshot()
  })

  it('should be able extract actionsToRetry', () => {
    const state = createStateToPersist({ foo: 1 }, { home: ['initAppContext'] })
    expect(renderToString(renderDocumentJSX(state.renderToJSX()))).toMatchSnapshot()
  })
})
