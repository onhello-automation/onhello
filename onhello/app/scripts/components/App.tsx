import Container from '@material-ui/core/Container'
import { createStyles, Theme, WithStyles, withStyles } from '@material-ui/core/styles'
import React from 'react'
import { updateUrl } from '../url-helper'
import { AppTheme } from './AppTheme'
import Options from './Options'

const styles = (theme: Theme) => createStyles({
	headerSection: {
		marginBottom: theme.spacing(1),
	},
	end: {
		display: 'flex',
		justifyContent: 'flex-end',
		alignItems: 'flex-end',
	},
	pageButton: {
		// Make it look like a button since I couldn't figure out how to remove the background color of a Button.
		cursor: 'pointer',
		textDecoration: 'none',
		padding: '4px',
		marginRight: theme.spacing(2),
		fontSize: '1.5em',
		opacity: 0.4,
	},
	historyButton: {
		// Make the buttons line up.
		position: 'relative',
		top: '5px',
	},
	selectedPageButton: {
		opacity: 1,
	},
})

class App extends React.Component<WithStyles<typeof styles>, {
	page: string
}> {
	constructor(props: any) {
		super(props)
		const urlParams = new URLSearchParams(window.location.search)
		const page: string = urlParams.get('page') || 'options'
		this.state = {
			page,
		}

		this.showOptions = this.showOptions.bind(this)
	}

	showOptions(page: string) {
		this.setState({ page })
		updateUrl({ page })
	}


	render(): React.ReactNode {
		const { classes } = this.props
		return <div>
			<AppTheme>
				<Container>
					<div className={`${classes.headerSection} ${classes.end}`}>
						<a className={`${classes.pageButton} ${this.state.page === 'options' ? classes.selectedPageButton : ''}`}
							onClick={() => this.showOptions('options')}>
							⚙️
					</a>
					</div>
				</Container>
				{this.page()}
			</AppTheme>
		</div>
	}

	private page(): JSX.Element {
		switch (this.state.page) {
			case 'options':
				return <Options />
		}
		// Shouldn't happen.
		return <div></div>
	}
}

export default withStyles(styles)(App)