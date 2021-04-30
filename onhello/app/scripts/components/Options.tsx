import { PaletteType } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import Container from '@material-ui/core/Container'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import { createStyles, Theme, WithStyles, withStyles } from '@material-ui/core/styles'
import TextareaAutosize from '@material-ui/core/TextareaAutosize'
import Typography from '@material-ui/core/Typography'
import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { ErrorHandler } from '../error_handler'
import { getMessage } from '../i18n_helper'
import { setupUserSettings, ThemePreferenceType } from '../user'

const styles = (theme: Theme) => createStyles({
	title: {
		marginBottom: theme.spacing(1),
	},
	section: {
		marginBottom: theme.spacing(2),
	},
	buttonHolder: {
		paddingTop: '4px',
	},
	themeSelection: {
		marginLeft: theme.spacing(2),
	},
	rulesInput: {
		width: '80%'
	},
	saveRulesButton: {
		color: 'black',
	},
})

class Options extends React.Component<WithStyles<typeof styles>, {
	themePreference: ThemePreferenceType | ''
	rulesJson: string
	errorInRules: boolean | string
}> {
	private errorHandler = new ErrorHandler(undefined)

	constructor(props: any) {
		super(props)
		this.state = {
			themePreference: '',
			rulesJson: '',
			errorInRules: false,
		}

		this.handleChange = this.handleChange.bind(this)
		this.handleRulesChange = this.handleRulesChange.bind(this)
		this.handleThemeChange = this.handleThemeChange.bind(this)
		this.saveRules = this.saveRules.bind(this)
	}

	async componentDidMount(): Promise<void> {
		setupUserSettings(['themePreference', 'rules']).then((userSettings) => {
			const { themePreference } = userSettings
			let { rules } = userSettings
			rules = JSON.stringify(rules, null, 4)
			this.setState({
				themePreference,
				rulesJson: rules,
			})
		})

	}

	handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
		this.setState<never>({
			[event.target.name]: value,
		})
	}

	handleRulesChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		const value = event.target.value
		try {
			const parsed = JSON.parse(value)
			// TODO Validate more.
		} catch (err) {
			this.setState({ errorInRules: true })
		}
		this.setState<never>({
			[event.target.name]: value,
			errorInRules: false,
		})

	}

	handleThemeChange(event: React.ChangeEvent<HTMLInputElement>) {
		const themePreference = event.target.value as PaletteType | 'device'
		this.setState({
			themePreference,
		})
		const keys = {
			themePreference,
		}
		browser.storage.local.set(keys).catch(errorMsg => {
			this.errorHandler.showError({ errorMsg })
		})
		browser.storage.sync.set(keys).catch(errorMsg => {
			this.errorHandler.showError({ errorMsg })
		})
	}

	saveRules(): void {
		let rules
		try {
			rules = JSON.parse(this.state.rulesJson)
			// TODO Validate more.
		} catch (err) {
			alert(`Error parsing rules: ${err}.`)
			return
		}
		rules.dateModified = new Date()
		browser.storage.local.set({ rules }).catch(errorMsg => {
			this.errorHandler.showError({ errorMsg })
		})
		browser.storage.sync.set({ rules }).catch(errorMsg => {
			this.errorHandler.showError({ errorMsg })
		})
	}

	render(): React.ReactNode {
		const { classes } = this.props

		return <Container>
			<Typography className={classes.title} component="h4" variant="h4">
				{getMessage('optionsPageTitle') || "⚙️ Options"}
			</Typography>

			<div className={classes.section}>
				<Typography component="h5" variant="h5">
					{getMessage('themeSectionTitle') || "Theme"}
				</Typography>
				<Typography component="p">
					{getMessage('themePreferenceDescription')}
				</Typography>
				<FormControl className={classes.themeSelection} component="fieldset">
					<RadioGroup aria-label="theme" name="theme" value={this.state.themePreference} onChange={this.handleThemeChange}>
						<FormControlLabel value="light" control={<Radio />} label="Light" />
						<FormControlLabel value="dark" control={<Radio />} label="Dark" />
						<FormControlLabel value="device" control={<Radio />} label="Device Preference" />
					</RadioGroup>
				</FormControl>
			</div>
			<div className={classes.section}>
				<Typography component="h5" variant="h5">
					{getMessage('rulesSectionTitle') || "Rules"}
				</Typography>
				<Typography component="p">
					{getMessage('rulesInstructions')}
				</Typography>
				<TextareaAutosize name="rulesJson"
					className={classes.rulesInput}
					aria-label="Enter your rules"
					onChange={this.handleRulesChange}
					value={this.state.rulesJson} />
				<Typography component="p">
					{getMessage('saveInstructions')}
				</Typography>
				<div>
					<Button className={classes.saveRulesButton}
						onClick={this.saveRules}>
						Save Rules
					</Button>
				</div>
			</div>
		</Container >
	}
}

export default withStyles(styles)(Options)
