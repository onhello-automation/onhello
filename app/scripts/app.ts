import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'

function onPageLoad() {
	const domContainer = document.getElementById('app-div')
	ReactDOM.render(React.createElement(App), domContainer)
}

onPageLoad()
