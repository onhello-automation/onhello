import Button from '@material-ui/core/Button'
import Container from '@material-ui/core/Container'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { PaletteType } from '@material-ui/core'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import { createStyles, Theme, WithStyles, withStyles } from '@material-ui/core/styles'
import TextareaAutosize from '@material-ui/core/TextareaAutosize'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { ErrorHandler } from '../error_handler'
import { getMessage } from '../i18n_helper'
import { APP_DEFAULTS, checkRules, DEFAULT_RULES, RulesSettings } from '../rules/rules'
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
	instructions: {
		marginBottom: '1em',
	},
	rulesUi: {
		marginBottom: '1em',
	},
	rulesInput: {
		width: '80%'
	},
	rulesInputError: {
		borderColor: 'red',
		borderWidth: 'medium',
	},
	saveRulesButton: {
		color: 'black',
	},
})

class Options extends React.Component<WithStyles<typeof styles>, {
	themePreference: ThemePreferenceType | ''
	rulesJson: string
	errorInRules: string | undefined
}> {
	private errorHandler = new ErrorHandler(undefined)

	constructor(props: any) {
		super(props)
		this.state = {
			themePreference: '',
			rulesJson: '',
			errorInRules: undefined,
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
				themePreference: themePreference || 'device',
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
		let errorInRules = undefined
		try {
			const parsed = JSON.parse(value)
			checkRules(parsed)
		} catch (err) {
			errorInRules = err.toString()
			console.debug("errorInRules:", typeof errorInRules)
		}
		this.setState<never>({
			[event.target.name]: value,
			errorInRules,
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
			checkRules(rules)
		} catch (err) {
			alert(`Error parsing rules: ${err}.`)
			return
		}
		rules.dateModified = new Date().toString()
		browser.storage.local.set({ rules }).catch(errorMsg => {
			this.errorHandler.showError({ errorMsg })
		})
		browser.storage.sync.set({ rules }).catch(errorMsg => {
			this.errorHandler.showError({ errorMsg })
		})
	}

	renderRulesUi(): React.ReactNode {
		const { classes } = this.props

		if (this.state.errorInRules) {
			return <div></div>
		}

		// Extra check just in case.
		let rules: RulesSettings
		try {
			rules = JSON.parse(this.state.rulesJson)
			checkRules(rules)
		} catch (err) {
			return <div></div>
		}

		return <div className={classes.rulesUi}>
			{rules.apps.map((settings, appIndex) => {
				const defaults = APP_DEFAULTS[settings.name]
				return <div key={`rules-${settings.name}-${appIndex}`}>
					<TextField name='onhelloAppName'
						variant="outlined"
						label={"App name (only \"teams\" is supported for now)"}
						placeholder={"teams"}
						value={settings.name}
						// onChange={this.handleChange}
						style={{ display: 'block' }}
						inputProps={{}}
					/>
					<TextField name='onhelloUrlPattern'
						variant="outlined"
						label={"URL pattern of requests to get messages"}
						value={settings.urlPattern}
						placeholder={defaults ? defaults.urlPattern : undefined}
						// onChange={this.handleChange}
						style={{ display: 'block' }}
					/>
					<TextField name='onhelloReplyUrl'
						variant="outlined"
						label={"Reply URL"}
						value={settings.replyUrl}
						placeholder={defaults ? defaults.replyUrl : undefined}
						// onChange={this.handleChange}
						style={{ display: 'block' }}
					/>
					{settings.rules.map((rule, ruleIndex) => {
						return <div key={`rule-${settings.name}-${appIndex}-${ruleIndex}`}>
							<Typography component="h6" variant="h6">
								{`${settings.name} Rule ${ruleIndex + 1}`}
							</Typography>
							<TextField label={"Exact Match"}
								variant="outlined"
								value={rule.messageExactMatch}
								// onChange={this.handleChange}
								style={{ display: 'block' }}
							/>
							<div style={{ display: 'block' }}>
								<TextField label={"Pattern (Regular Expression)"}
									variant="outlined"
									value={rule.messagePattern}
								// onChange={this.handleChange}
								// style={{ display: 'block' }}
								/>
								<TextField label={"Pattern flags"}
									variant="outlined"
									value={rule.regexFlags}
								// onChange={this.handleChange}
								// style={{ display: 'block' }}
								/>
							</div>
							{rule.responses.map((response, responseIndex) => {
								return <TextField key={`response-${settings.name}-${appIndex}-${ruleIndex}-${responseIndex}`}
									label={"Response"}
									variant="outlined"
									value={response}
									// onChange={this.handleChange}
									style={{ display: 'block' }}
								/>
							})}
						</div>
					})}
				</div>
			})}
		</div>
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
				<Typography component="h5" variant="h5" className={classes.instructions}>
					{getMessage('rulesSectionTitle') || "Rules"}
				</Typography>
				<Typography component="p" className={classes.instructions}>
					{getMessage('rulesInstructions')}
				</Typography>
				<Typography component="p" className={classes.instructions}>
					{getMessage('rulesResponsesInstructions')}
				</Typography>
				{/* Rules UI */}
				{this.renderRulesUi()}
				{/* Raw Rules */}
				<Typography component="p" className={classes.instructions}>
					{getMessage('rulesRawInstructions')}
				</Typography>
				{this.state.errorInRules && <Typography component="p" className={`${classes.instructions} ${classes.rulesInputError}`}>
					{this.state.errorInRules}
				</Typography>}
				<TextareaAutosize name="rulesJson"
					className={`${classes.instructions} ${classes.rulesInput} ${this.state.errorInRules ? classes.rulesInputError : ''}`}
					aria-label="Enter your rules"
					onChange={this.handleRulesChange}
					value={this.state.rulesJson} />
				<Typography component="p">
					{getMessage('saveInstructions')}
				</Typography>
				<div>
					<Button className={classes.saveRulesButton}
						onClick={this.saveRules}>
						{getMessage('saveRules')}
					</Button>
				</div>
			</div>
			<div className={classes.section}>
				<Typography component="h5" variant="h5">
					{getMessage('advancedSectionTitle') || "Advanced"}
				</Typography>
				<Typography component="p" className={classes.instructions}>
					{getMessage('advancedInfo')}
				</Typography>
			</div>
		</Container >
	}
}

export default withStyles(styles)(Options)
