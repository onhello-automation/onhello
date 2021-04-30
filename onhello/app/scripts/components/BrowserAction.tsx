import { createStyles, Theme, WithStyles, withStyles } from '@material-ui/core/styles'
import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { AppTheme } from './AppTheme'

const styles = (theme: Theme) => createStyles({
	header: {
		marginBottom: theme.spacing(1),
	},
	end: {
		display: 'flex',
		justifyContent: 'flex-end',
		alignItems: 'flex-end',
	},
	reactingLoader: {
		position: 'relative',
		top: '-2px',
		paddingRight: '2px',
	},
	historyButton: {
		backgroundColor: 'inherit',
		cursor: 'pointer',
		border: 'none',
		outline: 'none',
		fontSize: '2em',
		// Make the buttons line up.
		position: 'relative',
		top: '9px',
	},
	badgesButton: {
		backgroundColor: 'inherit',
		cursor: 'pointer',
		border: 'none',
		outline: 'none',
		fontSize: '1.5em',
	},
	optionsButton: {
		backgroundColor: 'inherit',
		cursor: 'pointer',
		border: 'none',
		outline: 'none',
		// Make sure it align with the right side.
		paddingRight: theme.spacing(0.5),
		fontSize: '1.5em',
	},
	gridDiv: {
		flexGrow: 1,
		// Make sure there is an even amount of spacing on the left and right.
		overflowX: 'hidden',
	},
	reactionGrid: {
		marginTop: theme.spacing(1.5),
		minHeight: '8em',
		fontSize: '1.2em',
		marginBottom: theme.spacing(0.5),
		paddingLeft: theme.spacing(1),
		paddingRight: theme.spacing(1),
	},
	reactionButton: {
		backgroundColor: 'inherit',
		fontSize: 'inherit',
		cursor: 'pointer',
		outline: 'none',
		borderRadius: '16px',
		borderColor: 'lightgrey',
		minWidth: 'max-content',
		padding: '4px',
		paddingRight: '6px',
		paddingLeft: '6px',
	},
	reactionButtonPicked: {
		backgroundColor: 'dodgerblue',
	},
	reactionCount: {
		fontSize: '1em',
		color: 'grey',
		paddingLeft: '0.5em',
	},
	reactionPickedCount: {
		color: 'floralwhite',
	},
	errorSection: {
		color: 'red',
		fontSize: '1.0em',
		wordBreak: 'break-word',
		paddingLeft: theme.spacing(1),
		paddingRight: theme.spacing(1),
	},
	center: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},
})

class Reactions extends React.Component<WithStyles<typeof styles>, {
}> {

	constructor(props: any) {
		super(props)

		this.state = {}
	}

	componentDidMount() {
	}

	openOptions(): void {
		browser.runtime.openOptionsPage()
	}

	render(): React.ReactNode {
		const { classes } = this.props

		return <div>
			<AppTheme>
				<div className={`${classes.header} ${classes.end}`}>
					<button
						className={classes.optionsButton}
						onClick={this.openOptions}>
						⚙️
					</button>
				</div>
			</AppTheme>
		</div>
	}
}

export default withStyles(styles)(Reactions)
