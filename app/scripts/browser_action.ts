import React from 'react'
import ReactDOM from 'react-dom'
import Reactions from './components/BrowserAction'

function onPageLoad() {
	const domContainer = document.getElementById('app-div')
	ReactDOM.render(React.createElement(Reactions), domContainer)
}

onPageLoad()
